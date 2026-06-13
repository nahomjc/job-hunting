import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { isAdminEmail, isAdminUser } from "@/lib/auth/user-access";
import { userRepository } from "@/lib/repositories/user-repository";

export async function requireAdmin() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login?next=/admin");

  let dbUser = null;
  try {
    dbUser = await userRepository.getById(authUser.id);
  } catch {
    // DB unavailable
  }

  const allowed = dbUser ? isAdminUser(dbUser) : isAdminEmail(authUser.email);
  if (!allowed) redirect("/dashboard");

  if (dbUser?.blocked) redirect("/blocked");

  return { auth: authUser, db: dbUser };
}

// Re-export for convenience
export { getAdminEmails, isAdminEmail, isAdminUser } from "@/lib/auth/user-access";
