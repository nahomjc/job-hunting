import "server-only";

import type { Profile } from "@/lib/db/schema";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { resumeRepository } from "@/lib/repositories/resume-repository";
import { CV_REQUIRED_MESSAGE } from "@/lib/profile/cv-constants";

export { CV_REQUIRED_MESSAGE, CV_SETTINGS_PATH } from "@/lib/profile/cv-constants";

export function profileHasCv(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(profile.resumeText?.trim());
}

export async function userHasCv(userId: string): Promise<boolean> {
  const profile = await profileRepository.getByUserId(userId);
  if (profileHasCv(profile)) return true;

  const resume = await resumeRepository.findDefault(userId);
  return Boolean(resume?.content?.trim());
}

export async function requireUserCv(userId: string): Promise<void> {
  if (!(await userHasCv(userId))) {
    throw new Error(CV_REQUIRED_MESSAGE);
  }
}
