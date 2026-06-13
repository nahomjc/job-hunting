import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { agentExecutionRepository } from "@/lib/repositories/agent-execution-repository";

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cancelled = await agentExecutionRepository.cancelPipelineRunning(user.id);

  return NextResponse.json({ cancelled: cancelled > 0, count: cancelled });
}
