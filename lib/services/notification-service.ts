import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { requireDb, notificationSettings, users } from "@/lib/db";
import { notificationRepository } from "@/lib/repositories/notification-repository";
import type { Job } from "@/lib/db/schema";

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

async function getSettings(userId: string) {
  const db = requireDb();
  const [settings] = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);
  return settings;
}

async function sendEmail(to: string, subject: string, body: string) {
  const client = getResend();
  if (!client) return false;

  await client.emails.send({
    from: process.env.EMAIL_FROM ?? "JobHunter AI <onboarding@resend.dev>",
    to,
    subject,
    text: body,
  });
  return true;
}

async function sendTelegram(chatId: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });
  return true;
}

export const notificationService = {
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

    const db = requireDb();
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (settings?.emailEnabled !== false && user?.email) {
      const sent = await sendEmail(user.email, title, body);
      if (sent) {
        await notificationRepository.create({
          userId,
          type: "high_match_job",
          channel: "email",
          title,
          body,
          sentAt: new Date(),
        });
      }
    }

    if (settings?.telegramEnabled && settings.telegramChatId) {
      const sent = await sendTelegram(settings.telegramChatId, `<b>${title}</b>\n${body}`);
      if (sent) {
        await notificationRepository.create({
          userId,
          type: "high_match_job",
          channel: "telegram",
          title,
          body,
          sentAt: new Date(),
        });
      }
    }
  },

  async notifyInterviewScheduled(userId: string, company: string, title: string, date: Date) {
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
  },
};
