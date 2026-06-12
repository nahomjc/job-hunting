import { Header } from "@/components/dashboard/header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let profile = null;
  try {
    profile = await profileRepository.getByUserId(user.id);
  } catch {
    // DB not configured
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
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Email is sent via Brevo. Set BREVO_API_KEY and verify your sender domain.
              Auth emails (signup, reset password) use Brevo SMTP in Supabase — see docs/BREVO.md.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• High match jobs (score ≥ 80)</p>
            <p>• Recruiter responses</p>
            <p>• Interview scheduled</p>
            <p>• Weekly performance reports</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
