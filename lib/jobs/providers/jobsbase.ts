import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";

interface JobsBaseJob {
  id: string;
  title: string;
  company: string;
  display_location?: string;
  type?: string;
  workplace?: string;
  seniority_level?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  skills?: string[];
  job_url: string;
  posted_at?: string;
}

export class JobsBaseProvider implements JobProviderAdapter {
  readonly name = "jobsbase" as const;
  readonly displayName = "Jobs Base";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 40;
    const params = new URLSearchParams({
      q: query.trim() || "software engineer",
      limit: String(Math.min(limit, 50)),
      sort: "posted_at",
    });

    if (options.remote !== false) {
      params.set("workplace", "remote");
    }

    const res = await fetch(`https://jobsbase.io/api/v1/jobs?${params}`, {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { jobs?: JobsBaseJob[] };
    const listings = data.jobs ?? [];

    return listings.slice(0, limit).map((job) => ({
      externalId: job.id,
      provider: "jobsbase" as const,
      company: job.company,
      title: job.title,
      description: [
        job.seniority_level ? `Seniority: ${job.seniority_level}` : "",
        job.skills?.length ? `Skills: ${job.skills.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      url: job.job_url,
      salaryMin: job.salary_min ?? undefined,
      salaryMax: job.salary_max ?? undefined,
      salaryCurrency: job.currency ?? "USD",
      location: job.display_location,
      isRemote: job.workplace === "remote",
      tags: job.skills ?? [],
      postedAt: job.posted_at ? new Date(job.posted_at) : undefined,
      rawData: job as unknown as Record<string, unknown>,
    }));
  }
}
