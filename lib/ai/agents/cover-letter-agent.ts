import { BaseAgent } from "./base-agent";
import { chat } from "../openrouter";
import { getPrompt, interpolateTemplate } from "../prompts/prompt-service";
import type { Job, Profile } from "@/lib/db/schema";

interface CoverLetterInput {
  profile: Profile;
  job: Job;
}

interface CoverLetterOutput {
  content: string;
}

export class CoverLetterAgent extends BaseAgent<CoverLetterInput, CoverLetterOutput> {
  readonly type = "cover_letter" as const;
  readonly name = "Cover Letter Agent";

  protected async execute({ profile, job }: CoverLetterInput): Promise<CoverLetterOutput> {
    const prompt = await getPrompt("cover_letter");

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

    return { content };
  }
}

export const coverLetterAgent = new CoverLetterAgent();
