import { getAuthUser } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Page() {
  const authUser = await getAuthUser();

  const user = authUser
    ? {
        email: authUser.email ?? "",
        avatarUrl:
          (authUser.user_metadata?.avatar_url as string | undefined) ??
          (authUser.user_metadata?.picture as string | undefined) ??
          null,
      }
    : null;

  return <LandingPage user={user} />;
}
