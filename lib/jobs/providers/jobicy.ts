import { parseJobPostedDate } from "@/lib/jobs/parse-posted-date";
import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";
import { jobicyGeoForCountry } from "@/lib/jobs/country-match";
import { stripHtml } from "./utils";

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry?: string[] | string;
  jobType?: string[] | string;
  jobGeo?: string;
  jobLevel?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
  annualSalaryMin?: number | null;
  annualSalaryMax?: number | null;
  salaryCurrency?: string | null;
}

function toTagList(value?: string[] | string): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export class JobicyProvider implements JobProviderAdapter {
  readonly name = "jobicy" as const;
  readonly displayName = "Jobicy";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = Math.min(options.limit ?? 50, 50);
    const params = new URLSearchParams({
      count: String(limit),
    });

    if (query.trim()) {
      params.set("tag", query.trim());
    }

    const geo = jobicyGeoForCountry(options.country);
    if (geo) {
      params.set("geo", geo);
    }

    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?${params}`, {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { jobs?: JobicyJob[] };
    const listings = data.jobs ?? [];

    return listings.slice(0, limit).map((job) => ({
      externalId: String(job.id),
      provider: "jobicy" as const,
      company: job.companyName,
      title: job.jobTitle,
      description: stripHtml(job.jobDescription ?? job.jobExcerpt ?? ""),
      url: job.url,
      salaryMin: job.annualSalaryMin ?? undefined,
      salaryMax: job.annualSalaryMax ?? undefined,
      salaryCurrency: job.salaryCurrency ?? "USD",
      location: job.jobGeo,
      isRemote: true,
      tags: [
        ...toTagList(job.jobIndustry),
        ...toTagList(job.jobType),
        job.jobLevel,
        job.jobGeo,
      ].filter((tag): tag is string => Boolean(tag)),
      postedAt: parseJobPostedDate(job.pubDate),
      rawData: job as unknown as Record<string, unknown>,
    }));
  }
}
