import { parseJobPostedDate } from "@/lib/jobs/parse-posted-date";
import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";
import { matchesQuery, stripHtml } from "./utils";

interface RemoteJobsOrgJob {
  id: string;
  title: string;
  url: string;
  apply_url?: string;
  company: { name: string };
  location?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_text?: string | null;
  type?: string;
  description?: string;
  posted_at?: string;
}

export class RemoteJobsOrgProvider implements JobProviderAdapter {
  readonly name = "remotejobs" as const;
  readonly displayName = "RemoteJobs.org";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 40;
    const params = new URLSearchParams({
      category: "programming",
      limit: String(Math.min(limit, 50)),
      q: query.trim() || "software engineer",
    });

    const res = await fetch(`https://remotejobs.org/api/v1/jobs?${params}`, {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { data?: RemoteJobsOrgJob[] };
    const listings = data.data ?? [];

    return listings
      .filter((job) =>
        query.trim()
          ? matchesQuery([job.title, job.description, job.company?.name], query)
          : true
      )
      .slice(0, limit)
      .map((job) => ({
        externalId: job.id,
        provider: "remotejobs" as const,
        company: job.company?.name ?? "Unknown",
        title: job.title,
        description: stripHtml(job.description ?? ""),
        url: job.apply_url ?? job.url,
        salaryMin: job.salary_min ?? undefined,
        salaryMax: job.salary_max ?? undefined,
        location: job.location,
        isRemote: true,
        tags: [],
        postedAt: parseJobPostedDate(job.posted_at),
        rawData: job as unknown as Record<string, unknown>,
      }));
  }
}
