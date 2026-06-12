import { NextResponse } from "next/server";
import {
  isTelegramConfigured,
  parseStartCommand,
  sendTelegramMessage,
  verifyTelegramWebhookSecret,
  type TelegramUpdate,
} from "@/lib/telegram/bot";
import { telegramError, telegramLog } from "@/lib/telegram/logger";
import { formatTelegramWelcome, getUserDisplayName } from "@/lib/telegram/messages";
import { notificationSettingsRepository } from "@/lib/repositories/notification-settings-repository";

function fallbackName(update: TelegramUpdate): string {
  return update.message?.from?.first_name?.trim() || "there";
}

export async function POST(request: Request) {
  telegramLog("webhook POST received");

  if (!isTelegramConfigured()) {
    telegramError("webhook rejected: Telegram not configured");
    return NextResponse.json({ ok: false, error: "Telegram not configured" }, { status: 503 });
  }

  if (!verifyTelegramWebhookSecret(request)) {
    telegramError("webhook rejected: invalid or missing secret token", {
      hasSecretEnv: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      hasHeader: Boolean(request.headers.get("x-telegram-bot-api-secret-token")),
    });
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch (err) {
    telegramError("webhook rejected: invalid JSON body", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = update.message;
  if (!message?.text || !message.chat?.id) {
    telegramLog("webhook ignored: no text message", {
      updateId: update.update_id,
      hasMessage: Boolean(message),
      hasText: Boolean(message?.text),
      hasChat: Boolean(message?.chat?.id),
    });
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const text = message.text;
  const fromUsername = message.from?.username ?? null;

  telegramLog("webhook message", {
    updateId: update.update_id,
    chatId,
    fromUsername,
    textPreview: text.slice(0, 80),
  });

  try {
    if (text.startsWith("/disconnect")) {
      telegramLog("handling /disconnect", { chatId });
      const sent = await sendTelegramMessage(
        chatId,
        "To disconnect Telegram, use the Settings page in JobHunter AI and click Disconnect."
      );
      telegramLog("/disconnect handled", { chatId, sent });
      return NextResponse.json({ ok: true });
    }

    const linkCode = parseStartCommand(text);
    if (linkCode) {
      telegramLog("handling /start with link code", {
        chatId,
        linkCodePrefix: linkCode.slice(0, 4),
      });

      const settings = await notificationSettingsRepository.findByLinkCode(linkCode);
      if (!settings) {
        telegramLog("link code invalid or expired", { chatId });
        const sent = await sendTelegramMessage(
          chatId,
          "⚠️ Link code expired or invalid. Open JobHunter AI → Settings → Notifications and generate a new link."
        );
        telegramLog("/start link rejected", { chatId, sent });
        return NextResponse.json({ ok: true });
      }

      await notificationSettingsRepository.linkTelegram(settings.userId, chatId);
      const name =
        (await getUserDisplayName(settings.userId)) ?? fallbackName(update);
      const sent = await sendTelegramMessage(
        chatId,
        formatTelegramWelcome(name, true, true)
      );
      telegramLog("/start linked account", {
        chatId,
        userId: settings.userId,
        sent,
      });
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/start")) {
      telegramLog("handling plain /start", { chatId });

      const linked = await notificationSettingsRepository.findByChatId(chatId);
      let name = fallbackName(update);

      if (linked) {
        name = (await getUserDisplayName(linked.userId)) ?? name;
        const sent = await sendTelegramMessage(chatId, formatTelegramWelcome(name, true));
        telegramLog("/start welcome back", {
          chatId,
          userId: linked.userId,
          sent,
        });
      } else {
        const sent = await sendTelegramMessage(chatId, formatTelegramWelcome(name, false));
        telegramLog("/start not linked", { chatId, sent });
      }
      return NextResponse.json({ ok: true });
    }

    telegramLog("webhook ignored: unhandled command", {
      chatId,
      textPreview: text.slice(0, 40),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    telegramError("webhook handler error", {
      chatId,
      updateId: update.update_id,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 300) : undefined,
    });
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  const configured = isTelegramConfigured();
  telegramLog("webhook GET health check", { configured });
  return NextResponse.json({
    ok: true,
    configured,
    webhook: "/api/telegram/webhook",
  });
}
