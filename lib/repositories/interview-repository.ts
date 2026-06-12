import { eq, desc } from "drizzle-orm";
import { requireDb, interviews, applications, jobs } from "@/lib/db";

export const interviewRepository = {
  async findForUser(userId: string) {
    const db = requireDb();
    return db
      .select({
        interview: interviews,
        application: applications,
        job: jobs,
      })
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(interviews.userId, userId))
      .orderBy(desc(interviews.scheduledAt));
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
