import { getAuthUser } from "@/lib/supabase/server";
import { userService } from "@/lib/services/user-service";
import { isAdminEmail, isAdminUser } from "@/lib/auth/user-access";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Page() {
  const authUser = await getAuthUser();

  let isAdmin = authUser ? isAdminEmail(authUser.email) : false;

  if (authUser) {
    try {
      const dbUser = await userService.syncFromAuth(authUser);
      if (dbUser) isAdmin = isAdminUser(dbUser);
    } catch {
      // DB not configured
    }
  }

  const user = authUser
    ? {
        email: authUser.email ?? "",
        avatarUrl:
          (authUser.user_metadata?.avatar_url as string | undefined) ??
          (authUser.user_metadata?.picture as string | undefined) ??
          null,
        isAdmin,
      }
    : null;

  return <LandingPage user={user} />;
}
