import { parseJobPostedDate } from "@/lib/jobs/parse-posted-date";
import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location: { name: string };
  content: string;
  updated_at: string;
}

export class GreenhouseProvider implements JobProviderAdapter {
  readonly name = "greenhouse" as const;
  readonly displayName = "Greenhouse";

  constructor(private readonly boardToken: string, private readonly companyName: string) {}

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 50;
    const url = `https://boards-api.greenhouse.io/v1/boards/${this.boardToken}/jobs?content=true`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = (await res.json()) as { jobs: GreenhouseJob[] };
    const q = query.toLowerCase();

    return (data.jobs ?? [])
      .filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.content?.toLowerCase().includes(q)
      )
      .slice(0, limit)
      .map((job) => ({
        externalId: String(job.id),
        provider: "greenhouse" as const,
        company: this.companyName,
        title: job.title,
        description: job.content ?? "",
        url: job.absolute_url,
        location: job.location?.name,
        isRemote: job.location?.name?.toLowerCase().includes("remote") ?? false,
        tags: [],
        postedAt: parseJobPostedDate(job.updated_at),
        rawData: job as unknown as Record<string, unknown>,
      }));
  }
}
