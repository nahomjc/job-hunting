import { Globe, MapPin } from "lucide-react";
import {
  getCountryLabel,
  getHuntModeLabel,
  getHuntPreferences,
} from "@/lib/jobs/hunt-preferences";
import type { Profile } from "@/lib/db/schema";

interface HuntStatusBadgeProps {
  profile: Profile | null;
}

export function HuntStatusBadge({ profile }: HuntStatusBadgeProps) {
  const prefs = getHuntPreferences(profile?.preferences);
  const country = getCountryLabel(prefs.huntCountry);
  const mode = getHuntModeLabel(prefs.huntMode);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/30 px-2.5 py-1">
        <Globe className="h-3 w-3" />
        {country}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/30 px-2.5 py-1">
        <MapPin className="h-3 w-3" />
        {mode}
      </span>
    </div>
  );
}
