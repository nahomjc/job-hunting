import { countrySearchTerms } from "@/lib/jobs/country-match";
import type { Profile } from "@/lib/db/schema";

function haystackForProfile(profile: Profile): string {
  const parts = [
    ...(profile.preferredLocations ?? []),
    profile.resumeText ?? "",
  ];
  return parts.join(" ").toLowerCase();
}

export function profileIndicatesEthiopia(profile: Profile): boolean {
  const haystack = haystackForProfile(profile);
  if (!haystack.trim()) return false;

  const terms = countrySearchTerms("ET");
  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

export function shouldUseEthiopiaProviders(
  profile: Profile,
  huntCountry?: string
): boolean {
  return huntCountry?.toUpperCase() === "ET" && profileIndicatesEthiopia(profile);
}

export const ETHIOPIA_PROVIDER_LABELS = ["EthioJobs", "Afriwork", "HaHu Jobs"] as const;
