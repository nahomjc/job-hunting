import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";
import { matchesQuery, stripHtml } from "./utils";

interface LandingJobsLocation {
  city?: string;
  country_code?: string;
}

interface LandingJobsJob {
  id: number;
  title: string;
  url: string;
  role_description?: string;
  main_requirements?: string;
  nice_to_have?: string;
  perks?: string;
  remote: boolean;
  type?: string;
  tags?: string[];
  gross_salary_low?: number | null;
  gross_salary_high?: number | null;
  currency_code?: string;
  published_at?: string;
  locations?: LandingJobsLocation[];
}

function companyFromUrl(url: string): string {
  const match = url.match(/landing\.jobs\/at\/([^/]+)/i);
  if (!match) return "Unknown";

  return match[1]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatLocation(locations?: LandingJobsLocation[]): string | undefined {
  if (!locations?.length) return undefined;

  return locations
    .map((loc) => {
      const parts = [loc.city, loc.country_code].filter(Boolean);
      return parts.join(", ");
    })
    .filter(Boolean)
    .join(" · ");
}

export class LandingJobsProvider implements JobProviderAdapter {
  readonly name = "landing_jobs" as const;
  readonly displayName = "Landing.jobs";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 40;
    const params = new URLSearchParams({
      limit: String(Math.min(limit, 50)),
      offset: "0",
    });

    if (options.remote !== false) {
      params.set("remote", "true");
    }

    if (options.huntMode === "onsite") {
      params.delete("remote");
    }

    const res = await fetch(`https://landing.jobs/api/v1/jobs?${params}`, {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as LandingJobsJob | LandingJobsJob[];
    const listings = Array.isArray(data) ? data : [data];

    return listings
      .filter((job) =>
        matchesQuery(
          [
            job.title,
            job.role_description,
            job.main_requirements,
            job.tags?.join(" "),
            companyFromUrl(job.url),
          ],
          query
        )
      )
      .slice(0, limit)
      .map((job) => ({
        externalId: String(job.id),
        provider: "landing_jobs" as const,
        company: companyFromUrl(job.url),
        title: job.title,
        description: stripHtml(
          [job.role_description, job.main_requirements, job.nice_to_have]
            .filter(Boolean)
            .join("\n\n")
        ),
        url: job.url,
        salaryMin: job.gross_salary_low ?? undefined,
        salaryMax: job.gross_salary_high ?? undefined,
        salaryCurrency: job.currency_code ?? "EUR",
        location: formatLocation(job.locations),
        isRemote: job.remote,
        tags: job.tags ?? [],
        postedAt: job.published_at ? new Date(job.published_at) : undefined,
        rawData: job as unknown as Record<string, unknown>,
      }));
  }
}
