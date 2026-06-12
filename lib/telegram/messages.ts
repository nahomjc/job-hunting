import { eq } from "drizzle-orm";
import { requireDb, notificationSettings, profiles, users } from "@/lib/db";

export async function getUserDisplayName(userId: string): Promise<string | null> {
  try {
    const db = requireDb();
    const [row] = await db
      .select({
        fullName: profiles.fullName,
        email: users.email,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) return null;
    if (row.fullName?.trim()) return row.fullName.trim();
    if (row.email) {
      const local = row.email.split("@")[0];
      if (local) return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}

export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatTelegramWelcome(name: string, connected: boolean, justLinked = false) {
  const safeName = escapeTelegramHtml(name);

  if (justLinked) {
    return `✅ <b>Welcome, ${safeName}!</b>\n\nTelegram is now connected to JobHunter AI. You'll receive job alerts and updates here.\n\nManage preferences in Dashboard → Settings.`;
  }

  if (connected) {
    return `👋 <b>Welcome back, ${safeName}!</b>\n\nYour JobHunter AI account is linked. You'll get high-match jobs, interview updates, and weekly reports here.\n\nManage notifications in Dashboard → Settings.`;
  }

  return `👋 <b>Hi ${safeName}!</b>\n\nWelcome to <b>JobHunter AI</b> on Telegram.\n\nTo connect your account, open the app → Settings → Notifications → <b>Connect Telegram</b>.\n\nOr send <code>/start YOUR_CODE</code> if you already have a link code.`;
}
