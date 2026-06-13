import { revalidatePath } from "next/cache";
import { managerAgent } from "@/lib/ai/agents/manager-agent";

export async function runFullPipelineInBackground(userId: string) {
  try {
    await managerAgent.run({ userId, task: "full_pipeline" }, userId);
  } finally {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard/hunt");
    revalidatePath("/dashboard/agents");
  }
}
