"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { applicationEventRepository } from "@/lib/repositories/application-event-repository";
import { managerAgent } from "@/lib/ai/agents/manager-agent";
import { rateLimit } from "@/lib/security/rate-limit";
import type { ApplicationStatus } from "@/types";

export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const app = await applicationRepository.updateStatus(user.id, applicationId, status);
  revalidatePath("/dashboard/applications");
  return app;
}

export async function updateApplicationNotes(applicationId: string, notes: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const app = await applicationRepository.updateNotes(user.id, applicationId, notes);
  revalidatePath("/dashboard/applications");
  return app;
}

export async function getApplicationTimeline(applicationId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const events = await applicationEventRepository.findForApplication(applicationId, user.id);
  return events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    message: e.message,
    fromStatus: e.fromStatus,
    toStatus: e.toStatus,
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function generateApplicationMaterials(jobId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`generate:${user.id}`, 5, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded. Try again later.");

  const result = await managerAgent.run(
    { userId: user.id, task: "generate_application", jobId },
    user.id
  );

  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/resumes");
  return result;
}

export async function saveJob(jobId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const app = await applicationRepository.upsert(user.id, jobId, { status: "saved" });
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/agents");
  revalidatePath("/dashboard/applications");
  return app;
}
