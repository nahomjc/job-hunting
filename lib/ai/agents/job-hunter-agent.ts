import { BaseAgent, type AgentRunContext } from "./base-agent";
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

  protected async execute(
    { profile, query }: JobHunterInput,
    ctx: AgentRunContext
  ): Promise<JobHunterOutput> {
    const searchQuery = query ?? buildSearchQuery(profile);
    const providers = createDefaultProviders();
    const seen = new Set<string>();
    let found = 0;
    let saved = 0;
    let duplicates = 0;
    const byProvider: Record<string, number> = {};

    await ctx.log(`Building search query: "${searchQuery}"`, { progress: 10 });
    await ctx.log(`Scanning ${providers.length} job board sources…`, { progress: 15 });

    const totalProviders = providers.length;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const progressBase = 15 + Math.floor((i / totalProviders) * 70);

      await ctx.log(`Scanning ${provider.displayName}…`, {
        progress: progressBase,
        metadata: { provider: provider.name },
      });

      const results = await provider.search(searchQuery, {
        remote: profile.remotePreference === "remote",
        location: profile.preferredLocations?.[0],
        limit: 25,
      });

      byProvider[provider.name] = results.length;
      const uniqueCompanies = new Set(results.map((r) => r.company.toLowerCase())).size;

      await ctx.log(
        `Found ${results.length} listings (${uniqueCompanies} companies) on ${provider.displayName}`,
        { progress: progressBase + 5, metadata: { count: results.length, uniqueCompanies } }
      );

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
          continue;
        }

        await jobRepository.upsert(job);
        saved++;
      }
    }

    await ctx.log(
      `Scan complete — ${found} found, ${saved} new saved, ${duplicates} duplicates skipped`,
      { progress: 95, level: "success" }
    );

    return { found, saved, duplicates, byProvider };
  }
}

export const jobHunterAgent = new JobHunterAgent();
