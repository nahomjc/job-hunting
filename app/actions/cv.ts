"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { importCvForUser } from "@/lib/services/cv-import-service";
import type { ParsedCvResult } from "@/lib/services/cv-parser-service";

export interface ParseCvResponse {
  parsed: ParsedCvResult;
  profileId: string;
  resumeId: string;
}

/** Prefer POST /api/cv/parse for file uploads (avoids server-action body size limits). */
export async function parseAndImportCv(formData: FormData): Promise<ParseCvResponse> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("cv") as File | null;
  if (!file || !(file instanceof File)) {
    throw new Error("No file uploaded");
  }
  const result = await importCvForUser(user, file);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/resumes");

  return result;
}
