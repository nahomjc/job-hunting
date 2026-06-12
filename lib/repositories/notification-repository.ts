import { eq, desc } from "drizzle-orm";
import { requireDb, notifications } from "@/lib/db";

export const notificationRepository = {
  async findForUser(userId: string, limit = 50) {
    const db = requireDb();
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  },

  async create(data: {
    userId: string;
    type: "high_match_job" | "recruiter_response" | "interview_scheduled" | "weekly_report" | "system";
    channel: "email" | "telegram" | "in_app";
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    sentAt?: Date;
  }) {
    const db = requireDb();
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  },

  async markRead(userId: string, id: string) {
    const db = requireDb();
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  },

  async countUnread(userId: string) {
    const db = requireDb();
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    return rows.filter((n) => !n.read).length;
  },
};
