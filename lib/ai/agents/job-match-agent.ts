import { BaseAgent, type AgentRunContext } from "./base-agent";
import { chatJson } from "../openrouter";
import { getPrompt, interpolateTemplate } from "../prompts/prompt-service";
import type { Job, Profile } from "@/lib/db/schema";
import { getHuntPreferences, getCountryLabel, getHuntModeLabel } from "@/lib/jobs/hunt-preferences";
import type { MatchScoreResult } from "@/types";
import { formatSalary } from "@/lib/utils";

interface JobMatchInput {
  profile: Profile;
  job: Job;
}

export class JobMatchAgent extends BaseAgent<JobMatchInput, MatchScoreResult> {
  readonly type = "job_match" as const;
  readonly name = "Match Analyzer Agent";

  protected async execute(
    { profile, job }: JobMatchInput,
    ctx: AgentRunContext
  ): Promise<MatchScoreResult> {
    await ctx.log(`Analyzing fit for ${job.title} at ${job.company}`, { progress: 20 });

    const prompt = await getPrompt("job_match");

    const profileSalary = formatSalary(
      profile.preferredSalaryMin,
      profile.preferredSalaryMax
    );

    await ctx.log("Comparing skills, experience, and salary expectations…", { progress: 45 });

    const huntPrefs = getHuntPreferences(profile.preferences);

    const userPrompt = interpolateTemplate(prompt.userPromptTemplate, {
      fullName: profile.fullName ?? "Candidate",
      skills: (profile.skills ?? []).join(", "),
      yearsOfExperience: profile.yearsOfExperience ?? 0,
      salaryRange: profileSalary,
      locations: (profile.preferredLocations ?? []).join(", ") || "Any",
      remotePreference: profile.remotePreference ?? "any",
      huntCountry: huntPrefs.huntCountry ? getCountryLabel(huntPrefs.huntCountry) : "Any",
      huntMode: getHuntModeLabel(huntPrefs.huntMode),
      resumeText: profile.resumeText?.slice(0, 3000) ?? "",
      company: job.company,
      title: job.title,
      location: job.location ?? "Not specified",
      isRemote: job.isRemote ? "Yes" : "No",
      description: job.description?.slice(0, 4000) ?? "",
    });

    await ctx.log("Running AI match analysis…", { progress: 70 });

    const result = await chatJson<MatchScoreResult>({
      systemPrompt: prompt.systemPrompt,
      userPrompt,
      model: prompt.model ?? undefined,
      jsonMode: true,
      userId: ctx.userId,
      agentType: this.type,
    });

    await ctx.log(`Match score: ${Math.round(result.score)}%`, {
      progress: 95,
      level: "success",
      metadata: { score: result.score },
    });

    return result;
  }
}

export const jobMatchAgent = new JobMatchAgent();
