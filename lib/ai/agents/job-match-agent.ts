import { BaseAgent } from "./base-agent";
import { chatJson } from "../openrouter";
import { getPrompt, interpolateTemplate } from "../prompts/prompt-service";
import type { Job, Profile } from "@/lib/db/schema";
import type { MatchScoreResult } from "@/types";
import { formatSalary } from "@/lib/utils";

interface JobMatchInput {
  profile: Profile;
  job: Job;
}

export class JobMatchAgent extends BaseAgent<JobMatchInput, MatchScoreResult> {
  readonly type = "job_match" as const;
  readonly name = "Job Match Agent";

  protected async execute({
    profile,
    job,
  }: JobMatchInput): Promise<MatchScoreResult> {
    const prompt = await getPrompt("job_match");

    const salaryRange = formatSalary(
      job.salaryMin,
      job.salaryMax,
      job.salaryCurrency ?? "USD",
    );
    const profileSalary = formatSalary(
      profile.preferredSalaryMin,
      profile.preferredSalaryMax,
    );

    const userPrompt = interpolateTemplate(prompt.userPromptTemplate, {
      fullName: profile.fullName ?? "Candidate",
      skills: (profile.skills ?? []).join(", "),
      yearsOfExperience: profile.yearsOfExperience ?? 0,
      salaryRange: profileSalary,
      locations: (profile.preferredLocations ?? []).join(", ") || "Any",
      remotePreference: profile.remotePreference ?? "any",
      resumeText: profile.resumeText?.slice(0, 3000) ?? "",
      company: job.company,
      title: job.title,
      location: job.location ?? "Not specified",
      isRemote: job.isRemote ? "Yes" : "No",
      description: job.description?.slice(0, 4000) ?? "",
    });

    return chatJson<MatchScoreResult>({
      systemPrompt: prompt.systemPrompt,
      userPrompt,
      model: prompt.model ?? undefined,
      jsonMode: true,
    });
  }
}

export const jobMatchAgent = new JobMatchAgent();
