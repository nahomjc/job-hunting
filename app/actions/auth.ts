"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recordLogin } from "@/lib/services/login-event-service";
import { userService } from "@/lib/services/user-service";

function getAppOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function syncUserAndLogLogin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  try {
    await userService.syncFromAuth(user);
  } catch {
    // DB not configured
  }

  const headerStore = await headers();
  await recordLogin({
    userId: user.id,
    email: user.email,
    ipAddress:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      undefined,
    userAgent: headerStore.get("user-agent") ?? undefined,
    success: true,
  });
}

export async function signInWithEmailAction(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  await syncUserAndLogLogin();
  redirect("/dashboard");
}

export async function signUpWithEmailAction(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppOrigin()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    await syncUserAndLogLogin();
    redirect("/dashboard");
  }

  return { success: true, needsConfirmation: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
