import { eq, and, gte, desc, sql } from "drizzle-orm";
import { requireDb, jobMatches, jobs, applications } from "@/lib/db";
import {
  buildJobFilterConditions,
  needsCompanySizePostFilter,
} from "@/lib/jobs/build-job-query";
import { inferCompanySize } from "@/lib/jobs/job-metadata";
import { dedupeKeyFromJob } from "@/lib/jobs/dedupe";
import { resolveJobDisplayDate } from "@/lib/jobs/parse-posted-date";
import { DEFAULT_JOB_PAGE_SIZE, paginateSlice } from "@/lib/jobs/pagination";
import type { StatsDateRange } from "@/lib/analytics/stats-period";
import { withDateRange } from "@/lib/analytics/date-range-sql";

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

type JobMatchRow = {
  match: typeof jobMatches.$inferSelect;
  job: typeof jobs.$inferSelect;
  application: typeof applications.$inferSelect | null;
};

async function fetchMatchRows(userId: string, filters: JobMatchFilters): Promise<JobMatchRow[]> {
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

  return dedupeRows(applyCompanySizeFilter(rows, filters));
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
    const rows = await fetchMatchRows(userId, filters);
    return sortRows(rows, filters.sortBy);
  },

  async findPageForUser(userId: string, filters: JobMatchFilters = {}) {
    const sorted = sortRows(await fetchMatchRows(userId, filters), filters.sortBy);
    const pageSize = filters.pageSize ?? DEFAULT_JOB_PAGE_SIZE;
    const page = filters.page ?? 1;
    const slice = paginateSlice(sorted, page, pageSize);
    return {
      rows: slice.rows,
      total: slice.total,
      page: slice.page,
      pageSize: slice.pageSize,
      totalPages: slice.totalPages,
      rangeStart: slice.rangeStart,
      rangeEnd: slice.rangeEnd,
    };
  },

  async countForUser(userId: string, filters: JobMatchFilters = {}) {
    const rows = await fetchMatchRows(userId, filters);
    return rows.length;
  },

  async countHighMatches(userId: string, threshold = 80, range?: StatsDateRange) {
    const db = requireDb();
    const conditions = [
      eq(jobMatches.userId, userId),
      gte(jobMatches.score, threshold),
    ];
    if (range?.from ?? range?.to) {
      withDateRange(conditions, jobMatches.scoredAt, range);
    }
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobMatches)
      .where(and(...conditions));
    return result?.count ?? 0;
  },

  async countMatchesForUser(userId: string, range?: StatsDateRange) {
    const db = requireDb();
    const conditions = [eq(jobMatches.userId, userId)];
    if (range?.from ?? range?.to) {
      withDateRange(conditions, jobMatches.scoredAt, range);
    }
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobMatches)
      .where(and(...conditions));
    return result?.count ?? 0;
  },
};
