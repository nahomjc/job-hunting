import { BaseAgent } from "./base-agent";
import { chat } from "../openrouter";
import { getPrompt, interpolateTemplate } from "../prompts/prompt-service";
import type { Job, Profile } from "@/lib/db/schema";

interface ResumeInput {
  profile: Profile;
  job: Job;
}

interface ResumeOutput {
  content: string;
  title: string;
}

export class ResumeAgent extends BaseAgent<ResumeInput, ResumeOutput> {
  readonly type = "resume" as const;
  readonly name = "Resume Agent";

  protected async execute({ profile, job }: ResumeInput): Promise<ResumeOutput> {
    const prompt = await getPrompt("resume_tailor");

    const userPrompt = interpolateTemplate(prompt.userPromptTemplate, {
      profileJson: JSON.stringify(profile, null, 2),
      company: job.company,
      title: job.title,
      description: job.description?.slice(0, 4000) ?? "",
    });

    const content = await chat({
      systemPrompt: prompt.systemPrompt,
      userPrompt,
      model: prompt.model ?? undefined,
    });

    return {
      content,
      title: `Resume — ${job.title} at ${job.company}`,
    };
  }
}

export const resumeAgent = new ResumeAgent();
