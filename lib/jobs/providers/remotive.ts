import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

function matchesQuery(job: RemotiveJob, query: string): boolean {
  const terms = query
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 1);
  if (terms.length === 0) return true;

  const haystack = [
    job.title,
    job.company_name,
    job.category,
    job.description,
    ...(job.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return terms.some((term) => haystack.includes(term));
}

export class RemotiveProvider implements JobProviderAdapter {
  readonly name = "remotive" as const;
  readonly displayName = "Remotive";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 50;
    const url = "https://remotive.com/api/remote-jobs?category=software-dev";

    const res = await fetch(url, {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { jobs?: RemotiveJob[] };
    const listings = data.jobs ?? [];

    return listings
      .filter((job) => matchesQuery(job, query))
      .slice(0, limit)
      .map((job) => ({
        externalId: String(job.id),
        provider: "remotive" as const,
        company: job.company_name,
        title: job.title,
        description: job.description?.replace(/<[^>]+>/g, " ").slice(0, 8000) ?? "",
        url: job.url,
        location: job.candidate_required_location,
        isRemote: true,
        tags: job.tags ?? [],
        postedAt: job.publication_date ? new Date(job.publication_date) : undefined,
        rawData: job as unknown as Record<string, unknown>,
      }));
  }
}
