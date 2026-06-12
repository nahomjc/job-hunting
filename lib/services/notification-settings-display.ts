import {
  getTelegramBotUsername,
  getTelegramDeepLink,
  isTelegramConfigured,
} from "@/lib/telegram/bot";
import { notificationSettingsRepository } from "@/lib/repositories/notification-settings-repository";

export async function getNotificationSettingsDisplay(userId: string) {
  const settings = await notificationSettingsRepository.getOrCreate(userId);
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
    linkExpiresAt: linkValid ? settings.telegramLinkExpiresAt?.toISOString() ?? null : null,
    deepLink: linkValid && linkCode ? getTelegramDeepLink(linkCode) : null,
  };
}

export type NotificationSettingsDisplay = Awaited<
  ReturnType<typeof getNotificationSettingsDisplay>
>;
