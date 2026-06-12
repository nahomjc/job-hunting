import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";

interface RemoteOKJob {
  id: string;
  url: string;
  position: string;
  company: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  tags: string[];
  date: string;
}

export class RemoteOKProvider implements JobProviderAdapter {
  readonly name = "remoteok" as const;
  readonly displayName = "RemoteOK";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 50;
    const url = `https://remoteok.com/api?tags=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as RemoteOKJob[];
    const jobs = Array.isArray(data) ? data.slice(1, limit + 1) : [];

    return jobs.map((job) => ({
      externalId: job.id,
      provider: "remoteok" as const,
      company: job.company,
      title: job.position,
      description: job.description ?? "",
      url: job.url,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      location: job.location,
      isRemote: true,
      tags: job.tags ?? [],
      postedAt: job.date ? new Date(job.date) : undefined,
      rawData: job as unknown as Record<string, unknown>,
    }));
  }
}
