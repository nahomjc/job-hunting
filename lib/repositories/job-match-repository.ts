import { eq, and, gte, desc } from "drizzle-orm";
import { requireDb, jobMatches, jobs, applications } from "@/lib/db";
import {
  buildJobFilterConditions,
  needsCompanySizePostFilter,
} from "@/lib/jobs/build-job-query";
import { inferCompanySize } from "@/lib/jobs/job-metadata";
import { dedupeKeyFromJob } from "@/lib/jobs/dedupe";
import { resolveJobDisplayDate } from "@/lib/jobs/parse-posted-date";
import type { MatchScoreResult, JobMatchFilters } from "@/types";

function applyCompanySizeFilter<T extends { job: typeof jobs.$inferSelect }>(
  rows: T[],
  filters: JobMatchFilters
): T[] {
  if (!needsCompanySizePostFilter(filters) || !filters.companySize) return rows;

  return rows.filter((row) => {
    const size = inferCompanySize(row.job);
    if (size === filters.companySize) return true;
    return false;
  });
}

function dedupeRows<T extends { job: typeof jobs.$inferSelect }>(rows: T[]): T[] {
  const seenRoles = new Set<string>();
  return rows.filter((row) => {
    const roleKey = row.job.dedupeKey ?? dedupeKeyFromJob(row.job);
    if (seenRoles.has(roleKey)) return false;
    seenRoles.add(roleKey);
    return true;
  });
}

function sortRows<T extends { job: typeof jobs.$inferSelect; match: typeof jobMatches.$inferSelect }>(
  rows: T[],
  sortBy: JobMatchFilters["sortBy"]
): T[] {
  const mode = sortBy ?? "score";
  return [...rows].sort((a, b) => {
    if (mode === "date") {
      const da = resolveJobDisplayDate(a.job.postedAt, a.job.createdAt) ?? a.job.createdAt;
      const db = resolveJobDisplayDate(b.job.postedAt, b.job.createdAt) ?? b.job.createdAt;
      return new Date(db).getTime() - new Date(da).getTime();
    }
    return b.match.score - a.match.score;
  });
}

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
    const conditions = buildJobFilterConditions(userId, filters);

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

    const deduped = dedupeRows(applyCompanySizeFilter(rows, filters));
    return sortRows(deduped, filters.sortBy);
  },

  async countForUser(userId: string, filters: JobMatchFilters = {}) {
    const rows = await this.findForUser(userId, filters);
    return rows.length;
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
