import { BaseAgent, type AgentRunContext } from "./base-agent";
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

  protected async execute(
    input: OutreachInput,
    ctx: AgentRunContext
  ): Promise<OutreachOutput> {
    const { profile, job, type, daysAgo = 7 } = input;
    const profileJson = JSON.stringify(profile, null, 2);

    if (type === "email") {
      await ctx.log(`Generating recruiter email for ${job.company}`, { progress: 20 });
      const prompt = await getPrompt("outreach_email");
      await ctx.log("Crafting personalized subject line and body…", { progress: 55 });

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
        userId: ctx.userId,
        agentType: this.type,
      });

      await ctx.log("Recruiter outreach message ready", { progress: 95, level: "success" });
      return { email };
    }

    if (type === "linkedin") {
      await ctx.log(`Drafting LinkedIn message for ${job.company}`, { progress: 30 });
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
        userId: ctx.userId,
        agentType: this.type,
      });
      await ctx.log("LinkedIn outreach drafted", { progress: 95, level: "success" });
      return { linkedin };
    }

    await ctx.log(`Writing follow-up message (${daysAgo} days since application)`, { progress: 40 });
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
      userId: ctx.userId,
      agentType: this.type,
    });
    await ctx.log("Follow-up message generated", { progress: 95, level: "success" });
    return { followUp };
  }
}

export const outreachAgent = new OutreachAgent();
