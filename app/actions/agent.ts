"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { managerAgent } from "@/lib/ai/agents/manager-agent";
import { rateLimit } from "@/lib/security/rate-limit";
import { requireUserCv } from "@/lib/profile/has-cv";
import type { ManagerTask } from "@/lib/ai/agents/manager-agent";

const HUNT_TASKS = new Set<ManagerTask>(["full_pipeline", "search_jobs"]);

export async function runAgentTask(task: ManagerTask, jobId?: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`agent:${user.id}`, 10, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded");

  if (HUNT_TASKS.has(task)) {
    await requireUserCv(user.id);
  }

  const result = await managerAgent.run({ userId: user.id, task, jobId }, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/hunt");
  revalidatePath("/dashboard/agents");
  return result;
}
