import { NextResponse } from "next/server";
import {
  isTelegramConfigured,
  parseStartCommand,
  sendTelegramMessage,
  verifyTelegramWebhookSecret,
  type TelegramUpdate,
} from "@/lib/telegram/bot";
import { notificationSettingsRepository } from "@/lib/repositories/notification-settings-repository";

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
    // Allow users to unlink by messaging the bot (best-effort lookup by chat id)
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
    await sendTelegramMessage(
      chatId,
      "✅ <b>Telegram connected!</b>\n\nYou'll receive job alerts and updates here from JobHunter AI.\n\nManage preferences in Dashboard → Settings."
    );
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/start")) {
    await sendTelegramMessage(
      chatId,
      "👋 <b>JobHunter AI</b>\n\nTo connect your account, open Settings in the app and tap <b>Connect Telegram</b> — you'll get a one-time link.\n\nOr send <code>/start YOUR_CODE</code> if you already have a code."
    );
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
