import { BaseAgent } from "./base-agent";
import { chat, chatJson } from "../openrouter";
import { getPrompt, interpolateTemplate } from "../prompts/prompt-service";
import type { Job, Profile } from "@/lib/db/schema";

interface OutreachInput {
  profile: Profile;
  job: Job;
  type: "email" | "linkedin" | "follow_up";
  daysAgo?: number;
}

interface OutreachOutput {
  email?: { subject: string; body: string };
  linkedin?: { message: string };
  followUp?: string;
}

export class OutreachAgent extends BaseAgent<OutreachInput, OutreachOutput> {
  readonly type = "outreach" as const;
  readonly name = "Outreach Agent";

  protected async execute(input: OutreachInput): Promise<OutreachOutput> {
    const { profile, job, type, daysAgo = 7 } = input;
    const profileJson = JSON.stringify(profile, null, 2);

    if (type === "email") {
      const prompt = await getPrompt("outreach_email");
      const userPrompt = interpolateTemplate(prompt.userPromptTemplate, {
        profileJson,
        company: job.company,
        title: job.title,
      });
      const email = await chatJson<{ subject: string; body: string }>({
        systemPrompt: prompt.systemPrompt,
        userPrompt,
        model: prompt.model ?? undefined,
        jsonMode: true,
      });
      return { email };
    }

    if (type === "linkedin") {
      const prompt = await getPrompt("outreach_linkedin");
      const userPrompt = interpolateTemplate(prompt.userPromptTemplate, {
        profileJson,
        company: job.company,
        title: job.title,
      });
      const linkedin = await chatJson<{ message: string }>({
        systemPrompt: prompt.systemPrompt,
        userPrompt,
        model: prompt.model ?? undefined,
        jsonMode: true,
      });
      return { linkedin };
    }

    const prompt = await getPrompt("follow_up");
    const userPrompt = interpolateTemplate(prompt.userPromptTemplate, {
      profileJson,
      company: job.company,
      title: job.title,
      daysAgo,
    });
    const followUp = await chat({
      systemPrompt: prompt.systemPrompt,
      userPrompt,
      model: prompt.model ?? undefined,
    });
    return { followUp };
  }
}

export const outreachAgent = new OutreachAgent();
