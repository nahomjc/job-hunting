import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";
import { stripHtml } from "./utils";

interface HimalayasJob {
  title: string;
  excerpt?: string;
  description?: string;
  companyName: string;
  companySlug: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string;
  employmentType?: string;
  seniority?: string[];
  categories?: string[];
  locationRestrictions?: string[];
  applicationLink?: string;
  guid: string;
  pubDate?: string;
}

export class HimalayasProvider implements JobProviderAdapter {
  readonly name = "himalayas" as const;
  readonly displayName = "Himalayas";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 40;
    const params = new URLSearchParams({
      q: query.trim() || "software engineer",
      sort: "recent",
    });

    if (options.country) {
      params.set("country", options.country);
    }

    const res = await fetch(`https://himalayas.app/jobs/api/search?${params}`, {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { jobs?: HimalayasJob[] };
    const listings = data.jobs ?? [];

    return listings.slice(0, limit).map((job) => ({
      externalId: job.guid,
      provider: "himalayas" as const,
      company: job.companyName,
      title: job.title,
      description: stripHtml(job.description ?? job.excerpt ?? ""),
      url:
        job.applicationLink ??
        `https://himalayas.app/companies/${job.companySlug}/jobs/${encodeURIComponent(job.title.toLowerCase().replace(/\s+/g, "-"))}`,
      salaryMin: job.minSalary ?? undefined,
      salaryMax: job.maxSalary ?? undefined,
      salaryCurrency: job.currency ?? "USD",
      location: job.locationRestrictions?.join(", "),
      isRemote: true,
      tags: [...(job.categories ?? []), ...(job.seniority ?? [])],
      postedAt: job.pubDate ? new Date(job.pubDate) : undefined,
      rawData: job as unknown as Record<string, unknown>,
    }));
  }
}
