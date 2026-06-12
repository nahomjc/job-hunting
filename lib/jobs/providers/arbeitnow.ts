import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: string;
}

function matchesQuery(job: ArbeitnowJob, query: string): boolean {
  const terms = query
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 1);
  if (terms.length === 0) return true;

  const haystack = [
    job.title,
    job.company_name,
    job.description,
    job.location,
    ...(job.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return terms.some((term) => haystack.includes(term));
}

export class ArbeitnowProvider implements JobProviderAdapter {
  readonly name = "arbeitnow" as const;
  readonly displayName = "Arbeitnow";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 50;
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { data?: ArbeitnowJob[] };
    const listings = data.data ?? [];

    return listings
      .filter((job) => matchesQuery(job, query))
      .slice(0, limit)
      .map((job) => ({
        externalId: job.slug,
        provider: "arbeitnow" as const,
        company: job.company_name,
        title: job.title,
        description: job.description?.replace(/<[^>]+>/g, " ").slice(0, 8000) ?? "",
        url: job.url || `https://www.arbeitnow.com/jobs/${job.slug}`,
        location: job.location,
        isRemote: job.remote,
        tags: job.tags ?? [],
        postedAt: job.created_at ? new Date(job.created_at) : undefined,
        rawData: job as unknown as Record<string, unknown>,
      }));
  }
}
