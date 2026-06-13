"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { userService } from "@/lib/services/user-service";
import { logAudit } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { normalizeProfileUrl } from "@/lib/utils";
import type { ProfileFormData } from "@/types";
import type { HuntMode } from "@/lib/jobs/hunt-preferences";

export async function updateHuntPreferences(data: {
  huntCountry?: string;
  huntMode?: HuntMode;
}) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`profile:${user.id}`, 20, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded");

  await userService.syncFromAuth(user);
  const profile = await profileRepository.upsert(user.id, {
    huntCountry: data.huntCountry,
    huntMode: data.huntMode,
  });

  await logAudit({
    userId: user.id,
    action: "profile.hunt_preferences.update",
    resource: "profiles",
    resourceId: profile.id,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hunt");
  revalidatePath("/dashboard");
  return profile;
}

export async function updateProfile(data: ProfileFormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const limit = rateLimit(`profile:${user.id}`, 10, 60_000);
  if (!limit.success) throw new Error("Rate limit exceeded");

  await userService.syncFromAuth(user);
  const profile = await profileRepository.upsert(user.id, {
    ...data,
    linkedinUrl: normalizeProfileUrl(data.linkedinUrl),
    githubUrl: normalizeProfileUrl(data.githubUrl),
    portfolioUrl: normalizeProfileUrl(data.portfolioUrl),
  });

  await logAudit({
    userId: user.id,
    action: "profile.update",
    resource: "profiles",
    resourceId: profile.id,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hunt");
  revalidatePath("/dashboard");
  return profile;
}
