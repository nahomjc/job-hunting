import { eq, and, notInArray, sql } from "drizzle-orm";
import { requireDb, jobs, jobMatches } from "@/lib/db";
import type { JobSearchResult, JobProvider } from "@/types";

export const jobRepository = {
  async findById(id: string) {
    const db = requireDb();
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return job ?? null;
  },

  async findByExternalId(provider: JobProvider, externalId: string) {
    const db = requireDb();
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.provider, provider), eq(jobs.externalId, externalId)))
      .limit(1);
    return job ?? null;
  },

  async upsert(data: JobSearchResult) {
    const db = requireDb();
    const [job] = await db
      .insert(jobs)
      .values({
        externalId: data.externalId,
        provider: data.provider,
        company: data.company,
        title: data.title,
        description: data.description,
        url: data.url,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency ?? "USD",
        location: data.location,
        isRemote: data.isRemote,
        tags: data.tags,
        rawData: data.rawData,
        postedAt: data.postedAt,
      })
      .onConflictDoUpdate({
        target: [jobs.provider, jobs.externalId],
        set: {
          title: data.title,
          description: data.description,
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          updatedAt: new Date(),
        },
      })
      .returning();
    return job;
  },

  async findUnscoredForUser(userId: string, limit = 50) {
    const db = requireDb();
    const scored = await db
      .select({ jobId: jobMatches.jobId })
      .from(jobMatches)
      .where(eq(jobMatches.userId, userId));

    const scoredIds = scored.map((s) => s.jobId);
    if (scoredIds.length === 0) {
      return db.select().from(jobs).limit(limit);
    }

    return db
      .select()
      .from(jobs)
      .where(notInArray(jobs.id, scoredIds))
      .limit(limit);
  },

  async count() {
    const db = requireDb();
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(jobs);
    return result?.count ?? 0;
  },
};
