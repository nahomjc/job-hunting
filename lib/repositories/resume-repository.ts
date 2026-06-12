import { eq, and, desc } from "drizzle-orm";
import { requireDb, resumes } from "@/lib/db";

export const resumeRepository = {
  async findForUser(userId: string) {
    const db = requireDb();
    return db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt));
  },

  async create(data: {
    userId: string;
    jobId?: string;
    title: string;
    content: string;
    isDefault?: boolean;
  }) {
    const db = requireDb();
    const [resume] = await db.insert(resumes).values(data).returning();
    return resume;
  },

  async upsertDefault(userId: string, title: string, content: string) {
    const db = requireDb();
    await db
      .update(resumes)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(resumes.userId, userId));

    const [resume] = await db
      .insert(resumes)
      .values({ userId, title, content, isDefault: true })
      .returning();
    return resume;
  },

  async findById(userId: string, id: string) {
    const db = requireDb();
    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, id))
      .limit(1);
    if (!resume || resume.userId !== userId) return null;
    return resume;
  },

  async findDefault(userId: string) {
    const db = requireDb();
    const [resume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.isDefault, true)))
      .limit(1);
    return resume ?? null;
  },
};
