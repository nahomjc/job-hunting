"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { interviewRepository } from "@/lib/repositories/interview-repository";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { interviewAgent } from "@/lib/ai/agents/interview-agent";
import { rateLimit } from "@/lib/security/rate-limit";

export async function generateInterviewPrep(applicationId: string, stage = "technical") {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`interview-prep:${user.id}`, 10, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded. Try again later.");

  const row = await applicationRepository.findById(user.id, applicationId);
  if (!row) throw new Error("Application not found");

  if (row.application.status !== "interview_scheduled") {
    throw new Error("Move this application to the Interview column first.");
  }

  const profile = await profileRepository.getByUserId(user.id);
  if (!profile) throw new Error("Complete your profile before generating prep notes.");

  const interview = await interviewRepository.ensureForApplication(user.id, applicationId);

  const result = await interviewAgent.run(
    { profile, job: row.job, stage },
    user.id
  );

  if (!result.success || !result.data) {
    throw new Error(result.error ?? "Failed to generate interview prep");
  }

  await interviewRepository.updatePrep(user.id, interview.id, {
    prepNotes: result.data.prepNotes,
    likelyQuestions: result.data.likelyQuestions ?? [],
    stage: stage as "phone_screen" | "technical" | "behavioral" | "onsite" | "final" | "other",
  });

  revalidatePath("/dashboard/interviews");
  revalidatePath("/dashboard/applications");

  return { success: true };
}
