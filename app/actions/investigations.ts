"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { companyInvestigationService } from "@/lib/services/company-investigation-service";
import { companyInvestigationRepository } from "@/lib/repositories/company-investigation-repository";
import { rateLimit } from "@/lib/security/rate-limit";
import type { ServiceOffered } from "@/lib/jobs/hunt-preferences";

export async function investigateCompany(jobId: string, pitchService?: ServiceOffered) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`investigate:${user.id}`, 15, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded");

  const investigation = await companyInvestigationService.investigate(
    user.id,
    jobId,
    pitchService
  );

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");

  return investigation;
}

export async function getInvestigation(jobId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  return companyInvestigationRepository.findByUserAndJob(user.id, jobId);
}

export async function getInvestigations() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  return companyInvestigationRepository.findForUser(user.id);
}
