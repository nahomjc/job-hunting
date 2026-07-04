import { after, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { agentExecutionRepository } from "@/lib/repositories/agent-execution-repository";
import { rateLimit } from "@/lib/security/rate-limit";
import { requireUserCv } from "@/lib/profile/has-cv";
import { runFullPipelineInBackground } from "@/lib/agents/run-pipeline";

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`agent:${user.id}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    await requireUserCv(user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CV required" },
      { status: 400 }
    );
  }

  const running = await agentExecutionRepository.findPipelineRunning(user.id);
  if (running.length > 0) {
    return NextResponse.json({ started: false, alreadyRunning: true });
  }

  after(() => runFullPipelineInBackground(user.id));

  return NextResponse.json({ started: true });
}
