"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Briefcase, Globe2, User } from "lucide-react";
import { ProfileForm, type ProfileFormSection } from "@/components/dashboard/profile-form";
import { NotificationSettingsForm } from "@/components/dashboard/notification-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Profile } from "@/lib/db/schema";
import type { getNotificationSettingsDisplay } from "@/lib/services/notification-settings-display";

type NotificationSettings = Awaited<ReturnType<typeof getNotificationSettingsDisplay>>;

const TAB_CONFIG = [
  {
    value: "profile",
    label: "Profile & CV",
    icon: User,
    title: "Profile & CV",
    description: "Upload your CV and keep contact details up to date for AI scoring and applications.",
    profileSection: "profile" as ProfileFormSection,
  },
  {
    value: "preferences",
    label: "Job preferences",
    icon: Briefcase,
    title: "Job preferences",
    description: "Salary range, work style, and locations used to score and rank opportunities.",
    profileSection: "preferences" as ProfileFormSection,
  },
  {
    value: "hunt",
    label: "Local hunt",
    icon: Globe2,
    title: "Local hunt & leads",
    description: "Country targeting, hunt mode, and services you offer for business pitch letters.",
    profileSection: "hunt" as ProfileFormSection,
  },
  {
    value: "notifications",
    label: "Notifications",
    icon: Bell,
    title: "Notifications",
    description: "Email and Telegram alerts for high matches, interviews, and weekly reports.",
    profileSection: null,
  },
] as const;

type TabValue = (typeof TAB_CONFIG)[number]["value"];

const VALID_TABS = new Set<string>(TAB_CONFIG.map((t) => t.value));

function parseTab(value: string | null): TabValue {
  if (value && VALID_TABS.has(value)) return value as TabValue;
  return "profile";
}

interface SettingsTabsProps {
  profile: Profile | null;
  notificationSettings: NotificationSettings | null;
}

export function SettingsTabs({ profile, notificationSettings }: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabValue>(() => parseTab(searchParams.get("tab")));

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const onTabChange = useCallback(
    (value: string) => {
      const next = parseTab(value);
      setTab(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "profile") params.delete("tab");
      else params.set("tab", next);
      const query = params.toString();
      router.replace(query ? `/dashboard/settings?${query}` : "/dashboard/settings", {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  const active = TAB_CONFIG.find((t) => t.value === tab) ?? TAB_CONFIG[0];

  return (
    <div className="w-full space-y-6">
      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="min-w-0 px-2 sm:px-3">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/10 pb-5">
          <CardTitle className="text-lg">{active.title}</CardTitle>
          <CardDescription>{active.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {active.profileSection ? (
            <ProfileForm profile={profile} section={active.profileSection} />
          ) : notificationSettings ? (
            <NotificationSettingsForm initial={notificationSettings} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect the database to manage notification preferences.
            </p>
          )}
        </CardContent>
      </Card>

      {active.profileSection && (
        <p className="text-center text-xs text-muted-foreground">
          Profile, job preferences, and local hunt share one save — switch tabs without losing edits.
        </p>
      )}
    </div>
  );
}
