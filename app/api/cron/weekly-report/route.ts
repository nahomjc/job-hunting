import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/security/rate-limit";
import { requireDb, profiles } from "@/lib/db";
import { analyticsService } from "@/lib/services/analytics-service";
import { notificationService } from "@/lib/services/notification-service";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = requireDb();
  const allProfiles = await db.select().from(profiles);
  const reports = [];

  for (const profile of allProfiles) {
    const stats = await analyticsService.getDashboardStats(profile.userId);

    await notificationService.notifyWeeklyReport(profile.userId, stats);

    reports.push({ userId: profile.userId, stats });
  }

  return NextResponse.json({ processed: reports.length, reports });
}
