import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";

export class WellfoundProvider implements JobProviderAdapter {
  readonly name = "wellfound" as const;
  readonly displayName = "Wellfound";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 20;
    const searchQuery = encodeURIComponent(query);
    const url = `https://wellfound.com/job_listings.json?query=${searchQuery}`;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "JobHunter-AI/1.0" },
        cache: "no-store",
      });

      if (!res.ok) return [];

      const data = await res.json();
      const listings = data?.jobs ?? data?.job_listings ?? [];

      return (listings as Array<Record<string, unknown>>).slice(0, limit).map((job) => ({
        externalId: String(job.id ?? job.slug ?? crypto.randomUUID()),
        provider: "wellfound" as const,
        company: String(job.startup_name ?? job.company ?? "Unknown"),
        title: String(job.title ?? job.role ?? "Software Engineer"),
        description: String(job.description ?? ""),
        url: String(job.url ?? job.apply_url ?? `https://wellfound.com/jobs/${job.id}`),
        salaryMin: job.salary_min as number | undefined,
        salaryMax: job.salary_max as number | undefined,
        location: String(job.location ?? ""),
        isRemote: Boolean(job.remote),
        tags: (job.tags as string[]) ?? [],
        postedAt: job.created_at ? new Date(String(job.created_at)) : undefined,
        rawData: job,
      }));
    } catch {
      return [];
    }
  }
}
