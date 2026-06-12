import { requireDb, loginEvents } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export async function logLoginEvent(data: {
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  suspicious?: boolean;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = requireDb();
    await db.insert(loginEvents).values({
      userId: data.userId ?? null,
      email: data.email ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      success: data.success ?? true,
      suspicious: data.suspicious ?? false,
      metadata: data.metadata,
    });
  } catch {
    // Non-blocking
  }
}

export async function detectSuspiciousLogin(email: string, ipAddress?: string): Promise<boolean> {
  try {
    const db = requireDb();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentForEmail = await db
      .select()
      .from(loginEvents)
      .where(eq(loginEvents.email, email))
      .orderBy(desc(loginEvents.createdAt))
      .limit(10);

    const recentFailed = recentForEmail.filter(
      (e) => !e.success && e.createdAt >= oneHourAgo
    ).length;

    if (recentFailed >= 3) return true;

    if (ipAddress) {
      const ipEvents = await db
        .select()
        .from(loginEvents)
        .where(eq(loginEvents.ipAddress, ipAddress))
        .orderBy(desc(loginEvents.createdAt))
        .limit(20);

      const distinctEmails = new Set(
        ipEvents.filter((e) => e.createdAt >= oneHourAgo && e.email).map((e) => e.email)
      );
      if (distinctEmails.size >= 5) return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function recordLogin(data: {
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
}) {
  const suspicious = data.success
    ? await detectSuspiciousLogin(data.email ?? "", data.ipAddress)
    : false;

  await logLoginEvent({ ...data, suspicious });
}
