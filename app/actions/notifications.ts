"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { notificationSettingsRepository } from "@/lib/repositories/notification-settings-repository";
import {
  getTelegramBotUsername,
  getTelegramDeepLink,
  isTelegramConfigured,
  sendTelegramMessage,
} from "@/lib/telegram/bot";
import { rateLimit } from "@/lib/security/rate-limit";
import { logAudit } from "@/lib/security/audit";

const LINK_CODE_TTL_MS = 15 * 60 * 1000;

export async function getNotificationSettingsAction() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const settings = await notificationSettingsRepository.getOrCreate(user.id);
  const botUsername = getTelegramBotUsername();
  const linkCode = settings.telegramLinkCode;
  const linkValid =
    linkCode &&
    settings.telegramLinkExpiresAt &&
    settings.telegramLinkExpiresAt > new Date();

  return {
    emailEnabled: settings.emailEnabled ?? true,
    telegramEnabled: settings.telegramEnabled ?? false,
    telegramConnected: Boolean(settings.telegramChatId),
    highMatchThreshold: settings.highMatchThreshold ?? 80,
    notifyHighMatch: settings.notifyHighMatch ?? true,
    notifyRecruiterResponse: settings.notifyRecruiterResponse ?? true,
    notifyInterviewScheduled: settings.notifyInterviewScheduled ?? true,
    telegramConfigured: isTelegramConfigured(),
    botUsername,
    linkCode: linkValid ? linkCode : null,
    linkExpiresAt: linkValid ? settings.telegramLinkExpiresAt?.toISOString() : null,
    deepLink: linkValid && linkCode ? getTelegramDeepLink(linkCode) : null,
  };
}

export async function updateNotificationSettingsAction(data: {
  emailEnabled?: boolean;
  telegramEnabled?: boolean;
  highMatchThreshold?: number;
  notifyHighMatch?: boolean;
  notifyRecruiterResponse?: boolean;
  notifyInterviewScheduled?: boolean;
}) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`notifications:${user.id}`, 20, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded");

  const current = await notificationSettingsRepository.getOrCreate(user.id);

  if (data.telegramEnabled && !current.telegramChatId) {
    throw new Error("Connect Telegram before enabling notifications");
  }

  if (data.highMatchThreshold !== undefined) {
    const t = data.highMatchThreshold;
    if (t < 50 || t > 100) throw new Error("Threshold must be between 50 and 100");
  }

  await notificationSettingsRepository.update(user.id, data);

  await logAudit({
    userId: user.id,
    action: "notification_settings.update",
    resource: "notification_settings",
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function generateTelegramLinkAction() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  if (!isTelegramConfigured()) {
    throw new Error("Telegram bot is not configured on the server");
  }

  const limit = rateLimit(`telegram-link:${user.id}`, 5, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded. Try again in a minute.");

  const code = randomBytes(4).toString("hex");
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS);

  await notificationSettingsRepository.update(user.id, {
    telegramLinkCode: code,
    telegramLinkExpiresAt: expiresAt,
  });

  revalidatePath("/dashboard/settings");

  return {
    code,
    expiresAt: expiresAt.toISOString(),
    deepLink: getTelegramDeepLink(code),
    botUsername: getTelegramBotUsername(),
    manualCommand: `/start ${code}`,
  };
}

export async function disconnectTelegramAction() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await notificationSettingsRepository.disconnectTelegram(user.id);

  await logAudit({
    userId: user.id,
    action: "telegram.disconnect",
    resource: "notification_settings",
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function sendTelegramTestAction() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const settings = await notificationSettingsRepository.getOrCreate(user.id);
  if (!settings.telegramChatId) {
    throw new Error("Telegram is not connected");
  }

  const sent = await sendTelegramMessage(
    settings.telegramChatId,
    "🔔 <b>Test notification</b>\n\nTelegram is connected to JobHunter AI. You'll receive alerts here."
  );

  if (!sent) throw new Error("Failed to send test message. Check TELEGRAM_BOT_TOKEN.");

  return { success: true };
}
