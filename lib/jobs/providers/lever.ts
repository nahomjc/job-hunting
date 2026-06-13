import { parseJobPostedDate } from "@/lib/jobs/parse-posted-date";
import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  categories: { location?: string; team?: string; commitment?: string };
  descriptionPlain: string;
  createdAt: number;
}

export class LeverProvider implements JobProviderAdapter {
  readonly name = "lever" as const;
  readonly displayName = "Lever";

  constructor(private readonly companySlug: string, private readonly companyName: string) {}

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 50;
    const url = `https://api.lever.co/v0/postings/${this.companySlug}?mode=json`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = (await res.json()) as LeverPosting[];
    const q = query.toLowerCase();

    return data
      .filter(
        (job) =>
          job.text.toLowerCase().includes(q) ||
          job.descriptionPlain?.toLowerCase().includes(q)
      )
      .slice(0, limit)
      .map((job) => ({
        externalId: job.id,
        provider: "lever" as const,
        company: this.companyName,
        title: job.text,
        description: job.descriptionPlain ?? "",
        url: job.hostedUrl,
        location: job.categories?.location,
        isRemote: job.categories?.location?.toLowerCase().includes("remote") ?? false,
        tags: [job.categories?.team, job.categories?.commitment].filter(Boolean) as string[],
        postedAt: parseJobPostedDate(job.createdAt),
        rawData: job as unknown as Record<string, unknown>,
      }));
  }
}
