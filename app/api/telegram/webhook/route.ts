import { NextResponse } from "next/server";
import {
  isTelegramConfigured,
  parseStartCommand,
  sendTelegramMessage,
  verifyTelegramWebhookSecret,
  type TelegramUpdate,
} from "@/lib/telegram/bot";
import { formatTelegramWelcome, getUserDisplayName } from "@/lib/telegram/messages";
import { notificationSettingsRepository } from "@/lib/repositories/notification-settings-repository";

function fallbackName(update: TelegramUpdate): string {
  return update.message?.from?.first_name?.trim() || "there";
}

export async function POST(request: Request) {
  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: false, error: "Telegram not configured" }, { status: 503 });
  }

  if (!verifyTelegramWebhookSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = update.message;
  if (!message?.text || !message.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const text = message.text;

  if (text.startsWith("/disconnect")) {
    await sendTelegramMessage(
      chatId,
      "To disconnect Telegram, use the Settings page in JobHunter AI and click Disconnect."
    );
    return NextResponse.json({ ok: true });
  }

  const linkCode = parseStartCommand(text);
  if (linkCode) {
    const settings = await notificationSettingsRepository.findByLinkCode(linkCode);
    if (!settings) {
      await sendTelegramMessage(
        chatId,
        "⚠️ Link code expired or invalid. Open JobHunter AI → Settings → Notifications and generate a new link."
      );
      return NextResponse.json({ ok: true });
    }

    await notificationSettingsRepository.linkTelegram(settings.userId, chatId);
    const name =
      (await getUserDisplayName(settings.userId)) ?? fallbackName(update);
    await sendTelegramMessage(
      chatId,
      formatTelegramWelcome(name, true, true)
    );
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/start")) {
    const linked = await notificationSettingsRepository.findByChatId(chatId);
    let name = fallbackName(update);

    if (linked) {
      name = (await getUserDisplayName(linked.userId)) ?? name;
      await sendTelegramMessage(chatId, formatTelegramWelcome(name, true));
    } else {
      await sendTelegramMessage(chatId, formatTelegramWelcome(name, false));
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: isTelegramConfigured(),
    webhook: "/api/telegram/webhook",
  });
}
