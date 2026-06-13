import { eq, and, gte, desc } from "drizzle-orm";
import { requireDb, jobMatches, jobs, applications } from "@/lib/db";
import {
  inferCompanySize,
  inferExperienceLevel,
} from "@/lib/jobs/job-metadata";
import { dedupeKeyFromJob } from "@/lib/jobs/dedupe";
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

    const seenRoles = new Set<string>();

    return rows.filter((row) => {
      const roleKey = dedupeKeyFromJob(row.job);
      if (seenRoles.has(roleKey)) return false;
      seenRoles.add(roleKey);

      const { job, application } = row;

      if (filters.minSalary) {
        const effectiveMax = job.salaryMax ?? job.salaryMin;
        if (effectiveMax != null && effectiveMax < filters.minSalary) return false;
      }
      if (filters.maxSalary) {
        const effectiveMin = job.salaryMin ?? job.salaryMax;
        if (effectiveMin != null && effectiveMin > filters.maxSalary) return false;
      }

      const remoteFilter = filters.remoteFilter ?? (filters.remote ? "remote" : "all");
      if (remoteFilter === "remote" && !job.isRemote) return false;
      if (remoteFilter === "onsite" && job.isRemote) return false;
      if (remoteFilter === "hybrid") {
        const loc = (job.location ?? "").toLowerCase();
        if (!loc.includes("hybrid") && job.isRemote) return false;
      }

      if (
        filters.location &&
        !job.location?.toLowerCase().includes(filters.location.toLowerCase()) &&
        !job.company.toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const haystack = [
          job.title,
          job.company,
          job.location ?? "",
          ...(job.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (filters.companySize && filters.companySize !== "unknown") {
        const size = inferCompanySize(job);
        if (size !== filters.companySize && size !== "unknown") return false;
        if (size === "unknown") return false;
      }

      if (filters.experienceLevel && filters.experienceLevel !== "unknown") {
        const level = inferExperienceLevel(job);
        if (level !== filters.experienceLevel && level !== "unknown") return false;
        if (level === "unknown") return false;
      }

      if (filters.status && application?.status !== filters.status) {
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
