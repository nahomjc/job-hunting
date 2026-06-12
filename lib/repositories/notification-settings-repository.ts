import { eq, and, gt } from "drizzle-orm";
import { requireDb, notificationSettings } from "@/lib/db";
import type { NotificationSettings } from "@/lib/db/schema";

const DEFAULT_SETTINGS = {
  emailEnabled: true,
  telegramEnabled: false,
  highMatchThreshold: 80,
  notifyHighMatch: true,
  notifyRecruiterResponse: true,
  notifyInterviewScheduled: true,
};

export const notificationSettingsRepository = {
  async getOrCreate(userId: string) {
    const db = requireDb();
    const [existing] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);

    if (existing) return existing;

    const [created] = await db
      .insert(notificationSettings)
      .values({ userId, ...DEFAULT_SETTINGS })
      .returning();
    return created;
  },

  async update(
    userId: string,
    data: Partial<
      Pick<
        NotificationSettings,
        | "emailEnabled"
        | "telegramEnabled"
        | "highMatchThreshold"
        | "notifyHighMatch"
        | "notifyRecruiterResponse"
        | "notifyInterviewScheduled"
        | "telegramChatId"
        | "telegramLinkCode"
        | "telegramLinkExpiresAt"
      >
    >
  ) {
    const db = requireDb();
    await this.getOrCreate(userId);
    const [updated] = await db
      .update(notificationSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notificationSettings.userId, userId))
      .returning();
    return updated;
  },

  async findByLinkCode(code: string) {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(notificationSettings)
      .where(
        and(
          eq(notificationSettings.telegramLinkCode, code),
          gt(notificationSettings.telegramLinkExpiresAt, new Date())
        )
      )
      .limit(1);
    return row ?? null;
  },

  async linkTelegram(userId: string, chatId: string) {
    return this.update(userId, {
      telegramChatId: chatId,
      telegramEnabled: true,
      telegramLinkCode: null,
      telegramLinkExpiresAt: null,
    });
  },

  async disconnectTelegram(userId: string) {
    return this.update(userId, {
      telegramChatId: null,
      telegramEnabled: false,
      telegramLinkCode: null,
      telegramLinkExpiresAt: null,
    });
  },

  async findByChatId(chatId: string) {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.telegramChatId, chatId))
      .limit(1);
    return row ?? null;
  },
};
