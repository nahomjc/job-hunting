import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userService } from "@/lib/services/user-service";
import { recordLogin } from "@/lib/services/login-event-service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          await userService.syncFromAuth(user);
        } catch {
          // DB not configured
        }

        const ipAddress =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          undefined;

        await recordLogin({
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent: request.headers.get("user-agent") ?? undefined,
          success: true,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
