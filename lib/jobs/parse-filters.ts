import type { Profile } from "@/lib/db/schema";
import { getHuntPreferences, type HuntMode } from "@/lib/jobs/hunt-preferences";
import { DEFAULT_JOB_PAGE_SIZE, parsePage } from "@/lib/jobs/pagination";
import type { CompanySize, ExperienceLevel, JobMatchFilters, JobSortBy, RemoteFilter } from "@/types";

function parseRemoteFilter(remoteParam?: string): RemoteFilter {
  if (remoteParam === "true" || remoteParam === "remote") return "remote";
  if (remoteParam === "onsite") return "onsite";
  if (remoteParam === "hybrid") return "hybrid";
  return "all";
}

function parseHuntMode(value?: string): HuntMode | undefined {
  if (value === "remote" || value === "onsite" || value === "any") return value;
  return undefined;
}

function parseSort(value?: string): JobSortBy {
  return value === "score" ? "score" : "date";
}

export function parseJobFilters(params: Record<string, string | undefined>): JobMatchFilters {
  const remoteFilter = parseRemoteFilter(params.remote);

  return {
    minScore: params.minScore ? Number(params.minScore) : undefined,
    minSalary: params.minSalary ? Number(params.minSalary) : undefined,
    maxSalary: params.maxSalary ? Number(params.maxSalary) : undefined,
    remote: remoteFilter === "remote" ? true : undefined,
    remoteFilter,
    location: params.location || undefined,
    search: params.q || undefined,
    companySize: (params.companySize as CompanySize) || undefined,
    experienceLevel: (params.experienceLevel as ExperienceLevel) || undefined,
    huntCountry: params.country || undefined,
    huntMode: parseHuntMode(params.huntMode),
    sortBy: params.sort ? parseSort(params.sort) : undefined,
    page: parsePage(params.page),
    pageSize: DEFAULT_JOB_PAGE_SIZE,
  };
}

/** Hunt page job list — country/mode only from URL (not profile defaults). Default sort: newest first. */
export function parseHuntResultsFilters(
  params: Record<string, string | undefined>
): JobMatchFilters {
  const base = parseJobFilters(params);
  return {
    ...base,
    huntCountry: params.country || undefined,
    huntMode: parseHuntMode(params.huntMode),
    sortBy: parseSort(params.sort),
    page: parsePage(params.page),
    pageSize: DEFAULT_JOB_PAGE_SIZE,
  };
}

export function parseHuntPageFilters(
  params: Record<string, string | undefined>,
  profile?: Profile | null
): JobMatchFilters {
  const base = parseJobFilters(params);
  const prefs = getHuntPreferences(profile?.preferences);

  return {
    ...base,
    huntCountry: params.country ?? prefs.huntCountry ?? undefined,
    huntMode: parseHuntMode(params.huntMode) ?? prefs.huntMode ?? undefined,
  };
}

export function filtersToSearchParams(
  filters: Partial<JobMatchFilters> & { q?: string },
  options?: { includeHunt?: boolean }
): URLSearchParams {
  const params = new URLSearchParams();

  const search = filters.q ?? filters.search;
  if (search) params.set("q", search);
  if (filters.minScore) params.set("minScore", String(filters.minScore));
  if (filters.minSalary) params.set("minSalary", String(filters.minSalary));
  if (filters.maxSalary) params.set("maxSalary", String(filters.maxSalary));
  if (filters.location) params.set("location", filters.location);
  if (filters.companySize) params.set("companySize", filters.companySize);
  if (filters.experienceLevel) params.set("experienceLevel", filters.experienceLevel);

  const rf = filters.remoteFilter;
  if (rf && rf !== "all") params.set("remote", rf);

  if (options?.includeHunt) {
    if (filters.huntCountry) params.set("country", filters.huntCountry);
    if (filters.huntMode) params.set("huntMode", filters.huntMode);
  }

  if (filters.sortBy && filters.sortBy !== "date") {
    params.set("sort", filters.sortBy);
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  return params;
}

export function countActiveFilters(filters: JobMatchFilters, options?: { includeHunt?: boolean }): number {
  let count = 0;
  if (filters.minScore) count++;
  if (filters.minSalary) count++;
  if (filters.maxSalary) count++;
  if (filters.remoteFilter && filters.remoteFilter !== "all") count++;
  if (filters.location) count++;
  if (filters.companySize) count++;
  if (filters.experienceLevel) count++;
  if (options?.includeHunt) {
    if (filters.huntCountry) count++;
    if (filters.huntMode && filters.huntMode !== "any") count++;
  }
  return count;
}

export function readFiltersFromSearchParams(
  searchParams: URLSearchParams,
  options?: { includeHunt?: boolean }
): JobMatchFilters & { q?: string } {
  const remoteFilter = parseRemoteFilter(searchParams.get("remote") ?? undefined);

  const filters: JobMatchFilters & { q?: string } = {
    q: searchParams.get("q") ?? undefined,
    search: searchParams.get("q") ?? undefined,
    minScore: searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined,
    minSalary: searchParams.get("minSalary") ? Number(searchParams.get("minSalary")) : undefined,
    maxSalary: searchParams.get("maxSalary") ? Number(searchParams.get("maxSalary")) : undefined,
    location: searchParams.get("location") ?? undefined,
    remoteFilter,
    companySize: (searchParams.get("companySize") as CompanySize) || undefined,
    experienceLevel: (searchParams.get("experienceLevel") as ExperienceLevel) || undefined,
  };

  if (options?.includeHunt) {
    filters.huntCountry = searchParams.get("country") ?? undefined;
    filters.huntMode = parseHuntMode(searchParams.get("huntMode") ?? undefined);
  }

  const sort = searchParams.get("sort");
  if (sort === "score" || sort === "date") filters.sortBy = sort;

  return filters;
}
