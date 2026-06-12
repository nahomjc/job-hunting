import { eq, and, gte, desc } from "drizzle-orm";
import { requireDb, jobMatches, jobs, applications } from "@/lib/db";
import type { MatchScoreResult, JobMatchFilters } from "@/types";

export const jobMatchRepository = {
  async upsert(userId: string, jobId: string, score: MatchScoreResult) {
    const db = requireDb();
    const [match] = await db
      .insert(jobMatches)
      .values({
        userId,
        jobId,
        score: score.score,
        reasons: score.reasons,
        explanation: score.explanation,
        scoredAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [jobMatches.userId, jobMatches.jobId],
        set: {
          score: score.score,
          reasons: score.reasons,
          explanation: score.explanation,
          scoredAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return match;
  },

  async findForUser(userId: string, filters: JobMatchFilters = {}) {
    const db = requireDb();
    const conditions = [eq(jobMatches.userId, userId)];

    if (filters.minScore) {
      conditions.push(gte(jobMatches.score, filters.minScore));
    }

    const rows = await db
      .select({
        match: jobMatches,
        job: jobs,
        application: applications,
      })
      .from(jobMatches)
      .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
      .leftJoin(
        applications,
        and(eq(applications.jobId, jobs.id), eq(applications.userId, userId))
      )
      .where(and(...conditions))
      .orderBy(desc(jobMatches.score));

    return rows.filter((row) => {
      if (filters.minSalary && row.job.salaryMin && row.job.salaryMin < filters.minSalary) {
        return false;
      }
      if (filters.remote !== undefined && row.job.isRemote !== filters.remote) {
        return false;
      }
      if (
        filters.location &&
        !row.job.location?.toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }
      if (filters.status && row.application?.status !== filters.status) {
        return false;
      }
      return true;
    });
  },

  async countHighMatches(userId: string, threshold = 80) {
    const db = requireDb();
    const rows = await db
      .select()
      .from(jobMatches)
      .where(and(eq(jobMatches.userId, userId), gte(jobMatches.score, threshold)));
    return rows.length;
  },
};
