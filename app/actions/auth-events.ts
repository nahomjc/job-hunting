"use server";

import { headers } from "next/headers";
import { getAuthUser } from "@/lib/supabase/server";
import { recordLogin } from "@/lib/services/login-event-service";

export async function recordLoginEvent(success = true) {
  const user = await getAuthUser();
  const headerStore = await headers();

  await recordLogin({
    userId: user?.id,
    email: user?.email,
    ipAddress:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      undefined,
    userAgent: headerStore.get("user-agent") ?? undefined,
    success,
  });
}
