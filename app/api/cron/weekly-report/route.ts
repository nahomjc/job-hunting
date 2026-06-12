import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/security/rate-limit";
import { requireDb, profiles } from "@/lib/db";
import { analyticsService } from "@/lib/services/analytics-service";
import { notificationRepository } from "@/lib/repositories/notification-repository";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = requireDb();
  const allProfiles = await db.select().from(profiles);
  const reports = [];

  for (const profile of allProfiles) {
    const stats = await analyticsService.getDashboardStats(profile.userId);
    const body = `Weekly Report:
• Jobs found: ${stats.totalJobsFound}
• Applications sent: ${stats.applicationsSent}
• Interviews: ${stats.interviewsReceived}
• Response rate: ${stats.responseRate.toFixed(1)}%
• Offer rate: ${stats.offerRate.toFixed(1)}%`;

    await notificationRepository.create({
      userId: profile.userId,
      type: "weekly_report",
      channel: "in_app",
      title: "Your Weekly Job Hunt Report",
      body,
      metadata: stats as unknown as Record<string, unknown>,
    });

    reports.push({ userId: profile.userId, stats });
  }

  return NextResponse.json({ processed: reports.length, reports });
}
