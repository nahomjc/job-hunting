import { Suspense } from "react";
import { Header } from "@/components/dashboard/header";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthUser } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { getNotificationSettingsDisplay } from "@/lib/services/notification-settings-display";

function SettingsTabsFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let profile = null;
  let notificationSettings = null;

  try {
    profile = await profileRepository.getByUserId(user.id);
  } catch {
    // DB not configured
  }

  try {
    notificationSettings = await getNotificationSettingsDisplay(user.id);
  } catch {
    // DB not configured or notification_settings schema pending migration
  }

  return (
    <>
      <Header
        title="Settings"
        description="Manage your profile, hunt preferences, and notification channels"
      />
      <div className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Suspense fallback={<SettingsTabsFallback />}>
            <SettingsTabs profile={profile} notificationSettings={notificationSettings} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
