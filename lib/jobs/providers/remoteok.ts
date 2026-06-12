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

function matchesQuery(job: RemoteOKJob, query: string): boolean {
  const terms = query
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  if (terms.length === 0) return true;

  const haystack = [
    job.position,
    job.company,
    job.description,
    job.location,
    ...(job.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return terms.some((term) => haystack.includes(term));
}

function mapJob(job: RemoteOKJob): JobSearchResult {
  return {
    externalId: String(job.id),
    provider: "remoteok",
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
  };
}

export class RemoteOKProvider implements JobProviderAdapter {
  readonly name = "remoteok" as const;
  readonly displayName = "RemoteOK";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 50;

    // RemoteOK tag API only works with single tags — fetch all and filter locally.
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "JobHunter-AI/1.0" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as RemoteOKJob[];
    if (!Array.isArray(data)) return [];

    const listings = data.slice(1).filter((job) => job?.id && job.position);

    const filtered = query.trim()
      ? listings.filter((job) => matchesQuery(job, query))
      : listings;

    // Prefer dev/engineering roles when query is generic
    const ranked = filtered.sort((a, b) => {
      const dev = (j: RemoteOKJob) =>
        /engineer|developer|dev|software|frontend|backend|fullstack|react|node/i.test(
          `${j.position} ${(j.tags ?? []).join(" ")}`
        );
      return Number(dev(b)) - Number(dev(a));
    });

    return ranked.slice(0, limit).map(mapJob);
  }
}
