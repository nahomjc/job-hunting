import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { userService } from "@/lib/services/user-service";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  try {
    await userService.syncFromAuth(user);
  } catch {
    // DB not configured yet — allow dashboard to load for UI preview
  }

  return (
    <div className="flex min-h-screen bg-grid">
      <Sidebar />
      <div className="flex flex-1 flex-col pb-16 md:pb-0 min-w-0">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
