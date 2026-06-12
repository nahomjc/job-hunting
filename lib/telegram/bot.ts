import { telegramError, telegramLog } from "@/lib/telegram/logger";

const TELEGRAM_API = "https://api.telegram.org";

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export function getTelegramBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME ?? null;
}

export function getTelegramDeepLink(code: string) {
  const username = getTelegramBotUsername();
  if (!username) return null;
  return `https://t.me/${username}?start=${code}`;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    telegramError("sendMessage skipped: TELEGRAM_BOT_TOKEN missing", { chatId });
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      telegramError("sendMessage failed", {
        chatId,
        status: res.status,
        body: body.slice(0, 500),
      });
      return false;
    }

    telegramLog("sendMessage ok", { chatId, textLength: text.length });
    return true;
  } catch (err) {
    telegramError("sendMessage error", {
      chatId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export function verifyTelegramWebhookSecret(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;
  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    text?: string;
    from?: { id: number; username?: string; first_name?: string };
  };
}

export function parseStartCommand(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/start")) return null;
  const parts = trimmed.split(/\s+/);
  return parts[1] ?? null;
}
