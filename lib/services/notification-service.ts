import { eq } from "drizzle-orm";
import { requireDb, notificationSettings, users } from "@/lib/db";
import { notificationRepository } from "@/lib/repositories/notification-repository";
import { sendEmail, isBrevoConfigured } from "@/lib/email/brevo";
import { sendTelegramMessage } from "@/lib/telegram/bot";
import type { Job } from "@/lib/db/schema";
import type { DashboardStats } from "@/types";

import type { NotificationSettings } from "@/lib/db/schema";

async function getSettings(userId: string): Promise<NotificationSettings | undefined> {
  try {
    const db = requireDb();
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);
    return settings;
  } catch (error) {
    console.warn(
      "notification_settings query failed — run lib/db/migrations/001-telegram-and-subscriptions.sql",
      error
    );
    return undefined;
  }
}

async function getUserEmail(userId: string) {
  const db = requireDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user?.email ?? null;
}

async function sendUserEmail(
  userId: string,
  subject: string,
  body: string,
  type: "high_match_job" | "recruiter_response" | "interview_scheduled" | "weekly_report",
  metadata?: Record<string, unknown>
) {
  const settings = await getSettings(userId);
  if (settings && settings.emailEnabled === false) return false;

  const email = await getUserEmail(userId);
  if (!email) return false;

  const sent = await sendEmail({ to: email, subject, text: body });
  if (sent) {
    await notificationRepository.create({
      userId,
      type,
      channel: "email",
      title: subject,
      body,
      metadata,
      sentAt: new Date(),
    });
  }
  return sent;
}

async function sendUserTelegram(
  userId: string,
  title: string,
  body: string,
  type: "high_match_job" | "recruiter_response" | "interview_scheduled" | "weekly_report",
  metadata?: Record<string, unknown>
) {
  const settings = await getSettings(userId);
  if (!settings?.telegramEnabled || !settings.telegramChatId) return false;

  const sent = await sendTelegramMessage(
    settings.telegramChatId,
    `<b>${title}</b>\n${body}`
  );

  if (sent) {
    await notificationRepository.create({
      userId,
      type,
      channel: "telegram",
      title,
      body,
      metadata,
      sentAt: new Date(),
    });
  }
  return sent;
}

export const notificationService = {
  isEmailConfigured: isBrevoConfigured,

  async notifyHighMatch(userId: string, job: Job, score: number) {
    const settings = await getSettings(userId);
    if (settings && !settings.notifyHighMatch) return;
    if (settings && score < (settings.highMatchThreshold ?? 80)) return;

    const title = `High match: ${job.title} at ${job.company}`;
    const body = `Score: ${score}/100\n${job.title} at ${job.company}\n${job.url}`;

    await notificationRepository.create({
      userId,
      type: "high_match_job",
      channel: "in_app",
      title,
      body,
      metadata: { jobId: job.id, score },
    });

    await sendUserEmail(userId, title, body, "high_match_job", {
      jobId: job.id,
      score,
    });

    await sendUserTelegram(userId, title, body, "high_match_job", {
      jobId: job.id,
      score,
    });
  },

  async notifyInterviewScheduled(
    userId: string,
    company: string,
    title: string,
    date: Date
  ) {
    const settings = await getSettings(userId);
    if (settings && !settings.notifyInterviewScheduled) return;

    const notifTitle = `Interview scheduled: ${title} at ${company}`;
    const body = `Your interview for ${title} at ${company} is scheduled for ${date.toLocaleString()}.`;

    await notificationRepository.create({
      userId,
      type: "interview_scheduled",
      channel: "in_app",
      title: notifTitle,
      body,
    });

    await sendUserEmail(userId, notifTitle, body, "interview_scheduled");
    await sendUserTelegram(userId, notifTitle, body, "interview_scheduled");
  },

  async notifyRecruiterResponse(userId: string, company: string, message: string) {
    const settings = await getSettings(userId);
    if (settings && !settings.notifyRecruiterResponse) return;

    const title = `Recruiter response from ${company}`;

    await notificationRepository.create({
      userId,
      type: "recruiter_response",
      channel: "in_app",
      title,
      body: message,
    });

    await sendUserEmail(userId, title, message, "recruiter_response");
    await sendUserTelegram(userId, title, message, "recruiter_response");
  },

  async notifyWeeklyReport(userId: string, stats: DashboardStats) {
    const title = "Your Weekly Job Hunt Report";
    const body = `Weekly Report:
• Jobs found: ${stats.totalJobsFound}
• Applications sent: ${stats.applicationsSent}
• Interviews: ${stats.interviewsReceived}
• Response rate: ${stats.responseRate.toFixed(1)}%
• Offer rate: ${stats.offerRate.toFixed(1)}%`;

    await notificationRepository.create({
      userId,
      type: "weekly_report",
      channel: "in_app",
      title,
      body,
      metadata: stats as unknown as Record<string, unknown>,
    });

    await sendUserEmail(userId, title, body, "weekly_report", stats as unknown as Record<string, unknown>);
    await sendUserTelegram(userId, title, body, "weekly_report", stats as unknown as Record<string, unknown>);
  },
};
