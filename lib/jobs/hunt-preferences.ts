export type HuntMode = "remote" | "onsite" | "any";

export type ServiceOffered =
  | "website"
  | "marketing"
  | "accounting"
  | "branding"
  | "seo"
  | "social_media";

export interface HuntPreferences {
  huntCountry?: string;
  huntMode?: HuntMode;
  servicesOffered?: ServiceOffered[];
}

export const HUNT_COUNTRIES = [
  { code: "", label: "Any country" },
  { code: "ET", label: "Ethiopia" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "PT", label: "Portugal" },
  { code: "IN", label: "India" },
  { code: "BR", label: "Brazil" },
  { code: "CA", label: "Canada" },
  { code: "NL", label: "Netherlands" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "KE", label: "Kenya" },
  { code: "NG", label: "Nigeria" },
  { code: "ZA", label: "South Africa" },
  { code: "AE", label: "UAE" },
  { code: "AU", label: "Australia" },
] as const;

export const HUNT_MODES: { value: HuntMode; label: string }[] = [
  { value: "any", label: "Any (remote + on-site)" },
  { value: "remote", label: "Remote in country" },
  { value: "onsite", label: "On-site / local" },
];

export const SERVICE_OPTIONS: { value: ServiceOffered; label: string }[] = [
  { value: "website", label: "Website development" },
  { value: "marketing", label: "Marketing" },
  { value: "accounting", label: "Accounting / bookkeeping" },
  { value: "branding", label: "Branding & design" },
  { value: "seo", label: "SEO" },
  { value: "social_media", label: "Social media management" },
];

export function getHuntPreferences(
  preferences?: Record<string, unknown> | null
): HuntPreferences {
  if (!preferences) return {};
  return {
    huntCountry:
      typeof preferences.huntCountry === "string" ? preferences.huntCountry : undefined,
    huntMode:
      preferences.huntMode === "remote" ||
      preferences.huntMode === "onsite" ||
      preferences.huntMode === "any"
        ? preferences.huntMode
        : undefined,
    servicesOffered: Array.isArray(preferences.servicesOffered)
      ? (preferences.servicesOffered as ServiceOffered[])
      : undefined,
  };
}

export function getCountryLabel(code?: string): string {
  if (!code) return "Any country";
  return HUNT_COUNTRIES.find((c) => c.code === code)?.label ?? code;
}

export function getHuntModeLabel(mode?: HuntMode): string {
  return HUNT_MODES.find((m) => m.value === mode)?.label ?? "Any";
}

export function getInitialHuntState(
  profile: { preferences?: Record<string, unknown> | null } | null
) {
  const prefs = getHuntPreferences(profile?.preferences);
  return {
    huntCountry: prefs.huntCountry ?? "",
    huntMode: (prefs.huntMode ?? "any") as HuntMode,
    servicesOffered: (prefs.servicesOffered ?? []) as ServiceOffered[],
  };
}
