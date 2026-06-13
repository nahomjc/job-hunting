import { eq, desc, and, sql } from "drizzle-orm";
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

  async findRecentInApp(userId: string, limit = 8) {
    const db = requireDb();
    return db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.channel, "in_app"))
      )
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
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  },

  async markAllRead(userId: string) {
    const db = requireDb();
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  },

  async countUnread(userId: string) {
    const db = requireDb();
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result?.count ?? 0;
  },
};
