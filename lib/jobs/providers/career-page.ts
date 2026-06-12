import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";

export interface CareerPageConfig {
  companyName: string;
  careersUrl: string;
  /** CSS selector or JSON endpoint for job listings */
  apiEndpoint?: string;
}

/**
 * Generic career page adapter — uses a configurable JSON endpoint
 * when companies expose structured job data, otherwise returns empty.
 */
export class CareerPageProvider implements JobProviderAdapter {
  readonly name = "career_page" as const;
  readonly displayName = "Company Career Page";

  constructor(private readonly config: CareerPageConfig) {}

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    if (!this.config.apiEndpoint) return [];

    const limit = options.limit ?? 20;
    const res = await fetch(this.config.apiEndpoint, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json();
    const listings = Array.isArray(data) ? data : (data.jobs ?? data.postings ?? []);
    const q = query.toLowerCase();

    return (listings as Array<Record<string, unknown>>)
      .filter((job) => {
        const title = String(job.title ?? job.name ?? "");
        return title.toLowerCase().includes(q);
      })
      .slice(0, limit)
      .map((job) => ({
        externalId: String(job.id ?? job.slug ?? crypto.randomUUID()),
        provider: "career_page" as const,
        company: this.config.companyName,
        title: String(job.title ?? job.name ?? "Open Position"),
        description: String(job.description ?? job.summary ?? ""),
        url: String(job.url ?? job.applyUrl ?? this.config.careersUrl),
        location: String(job.location ?? ""),
        isRemote: Boolean(job.remote ?? job.isRemote),
        tags: [],
        rawData: job,
      }));
  }
}
