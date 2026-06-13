import { BaseAgent, type AgentRunContext } from "./base-agent";
import { createDefaultProviders } from "@/lib/jobs/providers";
import { buildJobDedupeKey } from "@/lib/jobs/dedupe";
import { filterJobsByHunt } from "@/lib/jobs/country-match";
import { getHuntPreferences, getCountryLabel, getHuntModeLabel } from "@/lib/jobs/hunt-preferences";
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
  return buildJobDedupeKey({
    company: job.company,
    title: job.title,
    location: job.location,
  });
}

export class JobHunterAgent extends BaseAgent<JobHunterInput, JobHunterOutput> {
  readonly type = "job_hunter" as const;
  readonly name = "Job Hunter Agent";

  protected async execute(
    { profile, query }: JobHunterInput,
    ctx: AgentRunContext
  ): Promise<JobHunterOutput> {
    const searchQuery = query ?? buildSearchQuery(profile);
    const huntPrefs = getHuntPreferences(profile.preferences);
    const huntCountry = huntPrefs.huntCountry;
    const huntMode = huntPrefs.huntMode ?? "any";
    const providers = createDefaultProviders();
    const seen = new Set<string>();
    let found = 0;
    let saved = 0;
    let duplicates = 0;
    const byProvider: Record<string, number> = {};

    await ctx.log(`Building search query: "${searchQuery}"`, { progress: 10 });
    if (huntCountry) {
      await ctx.log(
        `Targeting ${getCountryLabel(huntCountry)} — ${getHuntModeLabel(huntMode)}`,
        { progress: 12 }
      );
    }
    await ctx.log(`Scanning ${providers.length} job board sources…`, { progress: 15 });

    const totalProviders = providers.length;

    for (let i = 0; i < providers.length; i++) {
      await ctx.assertNotCancelled();
      const provider = providers[i];
      const progressBase = 15 + Math.floor((i / totalProviders) * 70);

      await ctx.log(`Scanning ${provider.displayName}…`, {
        progress: progressBase,
        metadata: { provider: provider.name },
      });

      const rawResults = await provider.search(searchQuery, {
        remote: huntMode === "remote" || profile.remotePreference === "remote",
        location: profile.preferredLocations?.[0],
        country: huntCountry,
        huntMode,
        limit: 25,
      });

      const results = filterJobsByHunt(rawResults, huntCountry, huntMode);

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

        const existingByRole = await jobRepository.findByDedupeKey(key);
        if (existingByRole) {
          duplicates++;
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
