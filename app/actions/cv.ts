"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { resumeRepository } from "@/lib/repositories/resume-repository";
import { userService } from "@/lib/services/user-service";
import { extractTextFromCv } from "@/lib/services/cv-extract";
import { parseCvWithAi } from "@/lib/services/cv-parser-service";
import { logAudit } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { normalizeProfileUrl } from "@/lib/utils";
import type { ParsedCvResult } from "@/lib/services/cv-parser-service";

export interface ParseCvResponse {
  parsed: ParsedCvResult;
  profileId: string;
  resumeId: string;
}

export async function parseAndImportCv(formData: FormData): Promise<ParseCvResponse> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`cv-parse:${user.id}`, 5, 60 * 60 * 1000);
  if (!limit.success) throw new Error("Rate limit exceeded. Try again in an hour.");

  const file = formData.get("cv") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    throw new Error("No file uploaded");
  }

  await userService.syncFromAuth(user);

  const rawText = await extractTextFromCv(file);
  const parsed = await parseCvWithAi(rawText);

  const existing = await profileRepository.getByUserId(user.id);

  const updates: Partial<{
    fullName: string;
    skills: string[];
    yearsOfExperience: number;
    resumeText: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
  }> = {
    skills: parsed.skills,
    yearsOfExperience: parsed.yearsOfExperience,
    resumeText: parsed.resumeContent,
  };

  if (parsed.fullName) updates.fullName = parsed.fullName;
  if (parsed.linkedinUrl) updates.linkedinUrl = normalizeProfileUrl(parsed.linkedinUrl);
  else if (existing?.linkedinUrl) updates.linkedinUrl = existing.linkedinUrl;
  if (parsed.githubUrl) updates.githubUrl = normalizeProfileUrl(parsed.githubUrl);
  else if (existing?.githubUrl) updates.githubUrl = existing.githubUrl;
  if (parsed.portfolioUrl) updates.portfolioUrl = normalizeProfileUrl(parsed.portfolioUrl);
  else if (existing?.portfolioUrl) updates.portfolioUrl = existing.portfolioUrl;

  const profile = await profileRepository.upsert(user.id, updates);

  const resumeTitle = parsed.fullName
    ? `${parsed.fullName} — Master Resume`
    : "Master Resume";

  const resume = await resumeRepository.upsertDefault(
    user.id,
    resumeTitle,
    parsed.resumeContent
  );

  await logAudit({
    userId: user.id,
    action: "cv.parse",
    resource: "profiles",
    resourceId: profile.id,
    metadata: { fileName: file.name, skillsCount: parsed.skills.length },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/resumes");

  return { parsed, profileId: profile.id, resumeId: resume.id };
}
