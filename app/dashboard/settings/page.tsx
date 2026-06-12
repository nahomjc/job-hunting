import { Header } from "@/components/dashboard/header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { NotificationSettingsForm } from "@/components/dashboard/notification-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { getNotificationSettingsDisplay } from "@/lib/services/notification-settings-display";

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
      <Header title="Settings" description="Manage your profile and preferences" />
      <div className="flex-1 p-4 md:p-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Drop your CV to let AI parse it and build your profile. Supports PDF, DOCX, and TXT.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Email (Brevo) and Telegram alerts for matches, interviews, and weekly reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notificationSettings ? (
              <NotificationSettingsForm initial={notificationSettings} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Connect the database to manage notification preferences.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
