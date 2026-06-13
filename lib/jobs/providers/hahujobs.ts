import { parseJobPostedDate } from "@/lib/jobs/parse-posted-date";
import type { JobProviderAdapter, SearchOptions } from "./types";
import type { JobSearchResult } from "@/types";
import { matchesQuery } from "./utils";
import {
  defaultEthiopiaLocation,
  fetchJson,
  mapEthiopiaJob,
} from "./ethiopia-utils";

const HAHU_GRAPHQL = "https://graph.aggregator.hahu.jobs/v1/graphql";

interface HaHuJob {
  id: string;
  title: string;
  location?: string | null;
  url?: string | null;
  summary?: string | null;
  posted_on?: string | null;
  entity?: { name?: string | null } | null;
  job_application_city?: { name?: string | null } | null;
}

interface HaHuSearchResponse {
  data?: { search_jobs?: HaHuJob[] };
  errors?: unknown[];
}

export class HaHuJobsProvider implements JobProviderAdapter {
  readonly name = "hahujobs" as const;
  readonly displayName = "HaHu Jobs";

  async search(query: string, options: SearchOptions = {}): Promise<JobSearchResult[]> {
    const limit = options.limit ?? 25;
    const searchTerm = query.trim() || "software";

    const response = await fetchJson<HaHuSearchResponse>(HAHU_GRAPHQL, {
      query: `query SearchJobs($search: String!, $limit: Int!) {
        search_jobs(limit: $limit, args: { search: $search }) {
          id
          title
          location
          url
          summary
          posted_on
          entity { name }
          job_application_city { name }
        }
      }`,
      variables: { search: searchTerm, limit: Math.min(limit, 50) },
    });

    const listings = response?.data?.search_jobs ?? [];

    return listings
      .filter((job) =>
        matchesQuery(
          [job.title, job.entity?.name, job.location, job.job_application_city?.name, job.summary],
          query
        )
      )
      .slice(0, limit)
      .map((job) => {
        const city = job.job_application_city?.name ?? job.location;
        const jobUrl =
          job.url ??
          (job.id ? `https://www.hahujobs.co/jobs/${job.id}` : "https://www.hahujobs.co/jobs");

        return mapEthiopiaJob(
          {
            externalId: job.id,
            company: job.entity?.name ?? "Unknown company",
            title: job.title,
            description: job.summary ?? "",
            url: jobUrl,
            location: defaultEthiopiaLocation(city),
            isRemote: /remote|online/i.test(`${job.location ?? ""} ${job.summary ?? ""}`),
            tags: ["hahujobs"],
            postedAt: parseJobPostedDate(job.posted_on),
            rawData: job as unknown as Record<string, unknown>,
          },
          "hahujobs"
        );
      });
  }
}
