import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/security/rate-limit";
import { requireDb, profiles } from "@/lib/db";
import { managerAgent } from "@/lib/ai/agents/manager-agent";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = requireDb();
  const allProfiles = await db.select().from(profiles);
  const results = [];

  for (const profile of allProfiles) {
    const result = await managerAgent.run(
      { userId: profile.userId, task: "full_pipeline" },
      profile.userId
    );
    results.push({ userId: profile.userId, ...result });
  }

  return NextResponse.json({ processed: results.length, results });
}
