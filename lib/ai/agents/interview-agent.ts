import { BaseAgent } from "./base-agent";
import { chatJson } from "../openrouter";
import { getPrompt, interpolateTemplate } from "../prompts/prompt-service";
import type { Job, Profile } from "@/lib/db/schema";

interface InterviewInput {
  profile: Profile;
  job: Job;
  stage: string;
}

interface InterviewOutput {
  prepNotes: string;
  likelyQuestions: string[];
}

export class InterviewAgent extends BaseAgent<InterviewInput, InterviewOutput> {
  readonly type = "interview" as const;
  readonly name = "Interview Agent";

  protected async execute({ profile, job, stage }: InterviewInput): Promise<InterviewOutput> {
    const prompt = await getPrompt("interview_prep");

    const userPrompt = interpolateTemplate(prompt.userPromptTemplate, {
      profileJson: JSON.stringify(profile, null, 2),
      company: job.company,
      title: job.title,
      description: job.description?.slice(0, 4000) ?? "",
      stage,
    });

    return chatJson<InterviewOutput>({
      systemPrompt: prompt.systemPrompt,
      userPrompt,
      model: prompt.model ?? undefined,
      jsonMode: true,
    });
  }
}

export const interviewAgent = new InterviewAgent();
