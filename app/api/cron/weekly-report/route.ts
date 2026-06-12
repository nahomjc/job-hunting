import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/security/rate-limit";
import { runWeeklyReport } from "@/lib/cron/jobs";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklyReport();
  return NextResponse.json(result);
}
