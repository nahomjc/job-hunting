import { and, eq, gte, ilike, or, sql, type SQL } from "drizzle-orm";
import { jobs, jobMatches, applications } from "@/lib/db";
import { countrySearchTerms } from "@/lib/jobs/country-match";
import type { JobMatchFilters } from "@/types";
import type { ExperienceLevel } from "@/lib/jobs/job-metadata";

function searchTokenCondition(token: string): SQL {
  const pattern = `%${token}%`;
  return or(
    ilike(jobs.title, pattern),
    ilike(jobs.company, pattern),
    ilike(jobs.location, pattern),
    ilike(jobs.description, pattern),
    sql`${jobs.tags}::text ILIKE ${pattern}`
  ) as SQL;
}

function experienceLevelCondition(level: ExperienceLevel): SQL | undefined {
  const text = sql`lower(coalesce(${jobs.title}, '') || ' ' || coalesce(${jobs.description}, '') || ' ' || coalesce(${jobs.tags}::text, ''))`;

  switch (level) {
    case "staff":
      return sql`${text} ~* '(staff|principal|distinguished|fellow)'`;
    case "lead":
      return sql`${text} ~* '(lead|head of|director of)'`;
    case "senior":
      return sql`${text} ~* '(senior|sr\\.?)'`;
    case "junior":
      return sql`${text} ~* '(junior|jr\\.?|entry[- ]level|graduate|intern|internship)'`;
    case "mid":
      return sql`${text} ~* '(mid[- ]level|intermediate|\\yii\\y|level 2)'`;
    default:
      return undefined;
  }
}

function countryCondition(country: string): SQL {
  const terms = countrySearchTerms(country);
  const termConditions = terms.map((term) => {
    const pattern = `%${term}%`;
    return or(
      ilike(jobs.location, pattern),
      ilike(jobs.company, pattern),
      ilike(jobs.title, pattern),
      sql`${jobs.tags}::text ILIKE ${pattern}`,
      sql`${jobs.rawData}::text ILIKE ${pattern}`
    ) as SQL;
  });

  const worldwideRemote = and(
    eq(jobs.isRemote, true),
    or(
      sql`${jobs.location} IS NULL`,
      ilike(jobs.location, "%anywhere%"),
      ilike(jobs.location, "%worldwide%"),
      ilike(jobs.location, "%global%"),
      ilike(jobs.location, "%any country%")
    )
  ) as SQL;

  return or(...termConditions, worldwideRemote) as SQL;
}

export function buildJobFilterConditions(
  userId: string,
  filters: JobMatchFilters = {}
): SQL[] {
  const conditions: SQL[] = [eq(jobMatches.userId, userId)];

  if (filters.minScore) {
    conditions.push(gte(jobMatches.score, filters.minScore));
  }

  if (filters.search?.trim()) {
    const tokens = filters.search.trim().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      conditions.push(searchTokenCondition(token));
    }
  }

  if (filters.location?.trim()) {
    const pattern = `%${filters.location.trim()}%`;
    conditions.push(
      or(ilike(jobs.location, pattern), ilike(jobs.company, pattern)) as SQL
    );
  }

  if (filters.minSalary) {
    conditions.push(
      sql`(${jobs.salaryMax} IS NULL AND ${jobs.salaryMin} IS NULL) OR COALESCE(${jobs.salaryMax}, ${jobs.salaryMin}) >= ${filters.minSalary}`
    );
  }

  if (filters.maxSalary) {
    conditions.push(
      sql`(${jobs.salaryMax} IS NULL AND ${jobs.salaryMin} IS NULL) OR COALESCE(${jobs.salaryMin}, ${jobs.salaryMax}) <= ${filters.maxSalary}`
    );
  }

  const remoteFilter = filters.remoteFilter ?? (filters.remote ? "remote" : "all");
  if (remoteFilter === "remote") {
    conditions.push(eq(jobs.isRemote, true));
  } else if (remoteFilter === "onsite") {
    conditions.push(eq(jobs.isRemote, false));
  } else if (remoteFilter === "hybrid") {
    conditions.push(
      or(eq(jobs.isRemote, false), ilike(jobs.location, "%hybrid%")) as SQL
    );
  }

  if (filters.huntMode === "remote") {
    conditions.push(eq(jobs.isRemote, true));
  } else if (filters.huntMode === "onsite") {
    conditions.push(eq(jobs.isRemote, false));
  }

  if (filters.huntCountry) {
    conditions.push(countryCondition(filters.huntCountry));
  }

  if (filters.experienceLevel && filters.experienceLevel !== "unknown") {
    const exp = experienceLevelCondition(filters.experienceLevel);
    if (exp) conditions.push(exp);
  }

  if (filters.status) {
    conditions.push(eq(applications.status, filters.status));
  }

  return conditions;
}

export function needsCompanySizePostFilter(filters: JobMatchFilters): boolean {
  return Boolean(filters.companySize && filters.companySize !== "unknown");
}
