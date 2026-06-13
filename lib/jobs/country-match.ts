import type { HuntMode } from "@/lib/jobs/hunt-preferences";
import type { JobSearchResult } from "@/types";

const COUNTRY_ALIASES: Record<string, string[]> = {
  ET: ["ethiopia", "addis ababa", "addis"],
  US: ["united states", "usa", "u.s.", "america"],
  GB: ["united kingdom", "uk", "england", "london", "scotland"],
  DE: ["germany", "berlin", "munich"],
  PT: ["portugal", "lisbon"],
  IN: ["india", "bangalore", "mumbai", "delhi"],
  BR: ["brazil", "são paulo", "sao paulo"],
  CA: ["canada", "toronto", "vancouver"],
  NL: ["netherlands", "amsterdam"],
  FR: ["france", "paris"],
  ES: ["spain", "madrid", "barcelona"],
  KE: ["kenya", "nairobi"],
  NG: ["nigeria", "lagos"],
  ZA: ["south africa", "johannesburg", "cape town"],
  AE: ["uae", "dubai", "abu dhabi"],
  AU: ["australia", "sydney", "melbourne"],
};

const JOBICY_GEO: Record<string, string> = {
  US: "usa",
  GB: "uk",
  ET: "africa",
  IN: "india",
  BR: "latam",
  CA: "canada",
  DE: "europe",
  PT: "europe",
  FR: "europe",
  ES: "europe",
  NL: "europe",
  KE: "africa",
  NG: "africa",
  ZA: "africa",
  AE: "middle-east",
  AU: "australia",
};

export function jobicyGeoForCountry(country?: string): string | undefined {
  if (!country) return undefined;
  return JOBICY_GEO[country.toUpperCase()];
}

export function countrySearchTerms(country?: string): string[] {
  if (!country) return [];
  const code = country.toUpperCase();
  const aliases = COUNTRY_ALIASES[code] ?? [];
  return [code.toLowerCase(), ...aliases];
}

export function jobMatchesCountry(
  job: Pick<JobSearchResult, "location" | "tags" | "isRemote" | "rawData">,
  country?: string
): boolean {
  if (!country) return true;

  const terms = countrySearchTerms(country);
  const haystack = [
    job.location ?? "",
    ...(job.tags ?? []),
    extractCountryFromRaw(job.rawData),
  ]
    .join(" ")
    .toLowerCase();

  if (terms.some((term) => haystack.includes(term))) return true;

  // Worldwide remote jobs often omit country — allow when explicitly remote + no location restriction
  if (job.isRemote && (!job.location || /anywhere|worldwide|global|any/i.test(job.location))) {
    return true;
  }

  return false;
}

function extractCountryFromRaw(raw?: Record<string, unknown>): string {
  if (!raw) return "";

  const locations = raw.locations;
  if (Array.isArray(locations)) {
    return locations
      .map((loc) => {
        if (typeof loc === "object" && loc && "country_code" in loc) {
          return String((loc as { country_code?: string }).country_code ?? "");
        }
        return "";
      })
      .join(" ");
  }

  if (typeof raw.jobGeo === "string") return raw.jobGeo;
  return "";
}

export function jobMatchesHuntMode(
  job: Pick<JobSearchResult, "isRemote" | "location">,
  mode?: HuntMode
): boolean {
  if (!mode || mode === "any") return true;
  if (mode === "remote") return job.isRemote;
  if (mode === "onsite") return !job.isRemote;
  return true;
}

export function filterJobsByHunt(
  jobs: JobSearchResult[],
  country?: string,
  mode?: HuntMode
): JobSearchResult[] {
  return jobs.filter(
    (job) => jobMatchesCountry(job, country) && jobMatchesHuntMode(job, mode)
  );
}
