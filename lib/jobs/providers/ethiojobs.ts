import { parseJobPostedDate } from "@/lib/jobs/parse-posted-date";
import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";
import { matchesQuery, stripHtml } from "./utils";
import {
  defaultEthiopiaLocation,
  fetchText,
  mapEthiopiaJob,
  parseNextData,
} from "./ethiopia-utils";

interface EthioJob {
  id: string;
  title: string;
  slug: string;
  state?: string;
  location_type?: string;
  description?: string;
  date_published?: string;
  company?: { name?: string };
  catalogs?: { name?: string }[];
}

interface EthioJobsNextData {
  props?: {
    pageProps?: {
      jobs?: { data?: EthioJob[] };
    };
  };
}

export class EthioJobsProvider implements JobProviderAdapter {
  readonly name = "ethiojobs" as const;
  readonly displayName = "EthioJobs";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 25;
    const q = encodeURIComponent(query.trim() || "software");
    const html = await fetchText(`https://ethiojobs.net/jobs?search=${q}`);
    if (!html) return [];

    const data = parseNextData<EthioJobsNextData>(html);
    const listings = data?.props?.pageProps?.jobs?.data ?? [];

    return listings
      .filter((job) =>
        matchesQuery(
          [job.title, job.company?.name, job.state, job.catalogs?.map((c) => c.name).join(" ")],
          query
        )
      )
      .slice(0, limit)
      .map((job) =>
        mapEthiopiaJob(
          {
            externalId: job.id,
            company: job.company?.name ?? "Unknown company",
            title: job.title,
            description: stripHtml(job.description ?? "", 4000),
            url: `https://ethiojobs.net/jobs/${job.slug}`,
            location: defaultEthiopiaLocation(job.state),
            isRemote: /remote/i.test(job.location_type ?? ""),
            tags: (job.catalogs?.map((c) => c.name).filter((n): n is string => Boolean(n)) ?? []),
            postedAt: parseJobPostedDate(job.date_published),
            rawData: job as unknown as Record<string, unknown>,
          },
          "ethiojobs"
        )
      );
  }
}
