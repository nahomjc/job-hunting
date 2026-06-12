"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { managerAgent } from "@/lib/ai/agents/manager-agent";
import { rateLimit } from "@/lib/security/rate-limit";
import type { ManagerTask } from "@/lib/ai/agents/manager-agent";

export async function runAgentTask(task: ManagerTask, jobId?: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`agent:${user.id}`, 10, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded");

  const result = await managerAgent.run({ userId: user.id, task, jobId }, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/agents");
  return result;
}
