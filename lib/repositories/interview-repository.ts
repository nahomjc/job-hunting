import { eq, and, desc } from "drizzle-orm";
import { requireDb, interviews, applications, jobs } from "@/lib/db";

export const interviewRepository = {
  async ensureForApplication(userId: string, applicationId: string) {
    const db = requireDb();
    const [existing] = await db
      .select()
      .from(interviews)
      .where(
        and(eq(interviews.applicationId, applicationId), eq(interviews.userId, userId))
      )
      .limit(1);

    if (existing) return existing;

    const [created] = await db
      .insert(interviews)
      .values({
        userId,
        applicationId,
        stage: "other",
      })
      .returning();

    return created;
  },

  async findForUser(userId: string) {
    const db = requireDb();

    const rows = await db
      .select({
        interview: interviews,
        application: applications,
        job: jobs,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(interviews, eq(interviews.applicationId, applications.id))
      .where(
        and(eq(applications.userId, userId), eq(applications.status, "interview_scheduled"))
      )
      .orderBy(desc(applications.updatedAt));

    const result = [];
    for (const row of rows) {
      const interview =
        row.interview ?? (await this.ensureForApplication(userId, row.application.id));
      result.push({
        interview,
        application: row.application,
        job: row.job,
      });
    }

    return result;
  },

  async findByApplicationId(userId: string, applicationId: string) {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(interviews)
      .where(
        and(eq(interviews.applicationId, applicationId), eq(interviews.userId, userId))
      )
      .limit(1);
    return row ?? null;
  },

  async updatePrep(
    userId: string,
    interviewId: string,
    data: {
      prepNotes: string;
      likelyQuestions: string[];
      stage?: "phone_screen" | "technical" | "behavioral" | "onsite" | "final" | "other";
    }
  ) {
    const db = requireDb();
    const [updated] = await db
      .update(interviews)
      .set({
        prepNotes: data.prepNotes,
        likelyQuestions: data.likelyQuestions,
        stage: data.stage ?? "other",
        updatedAt: new Date(),
      })
      .where(and(eq(interviews.id, interviewId), eq(interviews.userId, userId)))
      .returning();
    return updated;
  },

  async create(data: {
    userId: string;
    applicationId: string;
    stage: "phone_screen" | "technical" | "behavioral" | "onsite" | "final" | "other";
    scheduledAt?: Date;
    prepNotes?: string;
    likelyQuestions?: string[];
  }) {
    const db = requireDb();
    const [interview] = await db.insert(interviews).values(data).returning();
    return interview;
  },
};
