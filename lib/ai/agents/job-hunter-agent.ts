import { BaseAgent } from "./base-agent";
import { createDefaultProviders } from "@/lib/jobs/providers";
import { jobRepository } from "@/lib/repositories/job-repository";
import type { JobSearchResult } from "@/types";
import type { Profile } from "@/lib/db/schema";

interface JobHunterInput {
  profile: Profile;
  query?: string;
}

interface JobHunterOutput {
  found: number;
  saved: number;
  duplicates: number;
  byProvider: Record<string, number>;
}

function buildSearchQuery(profile: Profile): string {
  const skills = profile.skills ?? [];
  if (skills.length > 0) {
    return skills.slice(0, 5).join(" ");
  }
  return "software engineer developer";
}

function dedupeKey(job: JobSearchResult): string {
  return `${job.company.toLowerCase()}:${job.title.toLowerCase()}`;
}

export class JobHunterAgent extends BaseAgent<JobHunterInput, JobHunterOutput> {
  readonly type = "job_hunter" as const;
  readonly name = "Job Hunter Agent";

  protected async execute({ profile, query }: JobHunterInput): Promise<JobHunterOutput> {
    const searchQuery = query ?? buildSearchQuery(profile);
    const providers = createDefaultProviders();
    const seen = new Set<string>();
    let found = 0;
    let saved = 0;
    let duplicates = 0;
    const byProvider: Record<string, number> = {};

    for (const provider of providers) {
      const results = await provider.search(searchQuery, {
        remote: profile.remotePreference === "remote",
        location: profile.preferredLocations?.[0],
        limit: 30,
      });

      byProvider[provider.name] = results.length;

      for (const job of results) {
        found++;
        const key = dedupeKey(job);
        if (seen.has(key)) {
          duplicates++;
          continue;
        }
        seen.add(key);

        const existing = await jobRepository.findByExternalId(job.provider, job.externalId);
        if (existing) {
          seen.add(key);
          continue;
        }

        await jobRepository.upsert(job);
        saved++;
      }
    }

    return { found, saved, duplicates, byProvider };
  }
}

export const jobHunterAgent = new JobHunterAgent();
