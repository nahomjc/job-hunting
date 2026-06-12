import type { CompanySize, ExperienceLevel, JobMatchFilters, RemoteFilter } from "@/types";

export function parseJobFilters(params: Record<string, string | undefined>): JobMatchFilters {
  const remoteParam = params.remote;
  let remoteFilter: RemoteFilter = "all";
  if (remoteParam === "true" || remoteParam === "remote") remoteFilter = "remote";
  else if (remoteParam === "onsite") remoteFilter = "onsite";
  else if (remoteParam === "hybrid") remoteFilter = "hybrid";

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
  };
}

export function filtersToSearchParams(filters: Partial<JobMatchFilters> & { q?: string }): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.minScore) params.set("minScore", String(filters.minScore));
  if (filters.minSalary) params.set("minSalary", String(filters.minSalary));
  if (filters.maxSalary) params.set("maxSalary", String(filters.maxSalary));
  if (filters.location) params.set("location", filters.location);
  if (filters.companySize) params.set("companySize", filters.companySize);
  if (filters.experienceLevel) params.set("experienceLevel", filters.experienceLevel);

  const rf = filters.remoteFilter;
  if (rf && rf !== "all") params.set("remote", rf);

  return params;
}

export function countActiveFilters(filters: JobMatchFilters): number {
  let count = 0;
  if (filters.minScore) count++;
  if (filters.minSalary) count++;
  if (filters.maxSalary) count++;
  if (filters.remoteFilter && filters.remoteFilter !== "all") count++;
  if (filters.location) count++;
  if (filters.companySize) count++;
  if (filters.experienceLevel) count++;
  return count;
}
