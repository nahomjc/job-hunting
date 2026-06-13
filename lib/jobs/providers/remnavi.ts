import { parseJobPostedDate } from "@/lib/jobs/parse-posted-date";
import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";
import { matchesQuery } from "./utils";

interface RemNaviJob {
  id: number;
  title: string;
  company: string;
  url: string;
  source?: string;
  category?: string;
  location?: string;
  salary?: string | null;
  posted_at?: string;
  hybrid_classification?: string;
}

export class RemNaviProvider implements JobProviderAdapter {
  readonly name = "remnavi" as const;
  readonly displayName = "RemNavi";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 40;
    const params = new URLSearchParams({
      limit: String(Math.min(limit, 100)),
      category: "engineering",
    });

    const res = await fetch(`https://remnavi.com/jobs_api.php?${params}`, {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { jobs?: RemNaviJob[] };
    const listings = data.jobs ?? [];

    return listings
      .filter((job) =>
        matchesQuery([job.title, job.company, job.category, job.location], query)
      )
      .slice(0, limit)
      .map((job) => ({
        externalId: String(job.id),
        provider: "remnavi" as const,
        company: job.company,
        title: job.title,
        description: [job.category, job.source, job.salary].filter(Boolean).join(" · "),
        url: job.url,
        location: job.location,
        isRemote:
          job.hybrid_classification === "remote" ||
          job.location?.toLowerCase().includes("remote") ||
          false,
        tags: job.category ? [job.category] : [],
        postedAt: parseJobPostedDate(job.posted_at),
        rawData: job as unknown as Record<string, unknown>,
      }));
  }
}
