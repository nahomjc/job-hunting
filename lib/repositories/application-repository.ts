import { eq, and, sql, inArray } from "drizzle-orm";
import { requireDb, applications, jobs, jobMatches } from "@/lib/db";
import type { ApplicationStatus } from "@/types";

export const applicationRepository = {
  async findForUser(userId: string) {
    const db = requireDb();
    return db
      .select({
        application: applications,
        job: jobs,
        match: jobMatches,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(jobMatches, eq(applications.jobMatchId, jobMatches.id))
      .where(eq(applications.userId, userId));
  },

  async upsert(
    userId: string,
    jobId: string,
    data: {
      status?: ApplicationStatus;
      coverLetter?: string;
      outreachEmail?: string;
      outreachLinkedin?: string;
      followUpMessage?: string;
      notes?: string;
      jobMatchId?: string;
    }
  ) {
    const db = requireDb();
    const [app] = await db
      .insert(applications)
      .values({
        userId,
        jobId,
        ...data,
        appliedAt: data.status === "applied" ? new Date() : undefined,
      })
      .onConflictDoUpdate({
        target: [applications.userId, applications.jobId],
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return app;
  },

  async updateStatus(userId: string, applicationId: string, status: ApplicationStatus) {
    const db = requireDb();
    const [app] = await db
      .update(applications)
      .set({
        status,
        appliedAt: status === "applied" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .returning();
    return app;
  },

  async countByStatus(userId: string, statuses: ApplicationStatus[]) {
    const db = requireDb();
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applications)
      .where(
        and(eq(applications.userId, userId), inArray(applications.status, statuses))
      );
    return result?.count ?? 0;
  },
};
