import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { requireDb, applications, jobs, jobMatches } from "@/lib/db";
import type { ApplicationStatus } from "@/types";
import { applicationEventRepository } from "@/lib/repositories/application-event-repository";
import { interviewRepository } from "@/lib/repositories/interview-repository";

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
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.updatedAt));
  },

  async findById(userId: string, applicationId: string) {
    const db = requireDb();
    const [row] = await db
      .select({
        application: applications,
        job: jobs,
        match: jobMatches,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(jobMatches, eq(applications.jobMatchId, jobMatches.id))
      .where(
        and(eq(applications.userId, userId), eq(applications.id, applicationId))
      )
      .limit(1);
    return row ?? null;
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
    const existing = await db
      .select()
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)))
      .limit(1);

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

    if (existing.length === 0 && app) {
      await applicationEventRepository.logCreated(
        app.id,
        userId,
        app.status
      );
    }

    return app;
  },

  async updateStatus(userId: string, applicationId: string, status: ApplicationStatus) {
    const db = requireDb();
    const [current] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1);

    if (!current) return null;
    if (current.status === status) return current;

    const [app] = await db
      .update(applications)
      .set({
        status,
        appliedAt: status === "applied" && !current.appliedAt ? new Date() : current.appliedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .returning();

    if (app) {
      await applicationEventRepository.logStatusChange(
        applicationId,
        userId,
        current.status,
        status
      );

      if (status === "interview_scheduled") {
        await interviewRepository.ensureForApplication(userId, applicationId);
      }
    }

    return app;
  },

  async updateNotes(userId: string, applicationId: string, notes: string) {
    const db = requireDb();
    const [app] = await db
      .update(applications)
      .set({ notes, updatedAt: new Date() })
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .returning();

    if (app) {
      await applicationEventRepository.logNoteUpdate(applicationId, userId);
    }

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
