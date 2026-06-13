import { BaseAgent, type AgentRunContext } from "./base-agent";
import { chatJson } from "../openrouter";
import { getPrompt, interpolateTemplate } from "../prompts/prompt-service";
import type { Job, Profile } from "@/lib/db/schema";
import type { CompanyGap } from "@/lib/repositories/company-investigation-repository";
import type { WebsiteStatus } from "@/lib/services/company-web-probe";
import type { ServiceOffered } from "@/lib/jobs/hunt-preferences";

interface CompanyInvestigatorInput {
  profile: Profile;
  job: Job;
  websiteStatus: WebsiteStatus;
  websiteUrl?: string;
  signals: string[];
  pitchService?: ServiceOffered;
}

interface InvestigationAnalysis {
  gaps: CompanyGap[];
  intelSummary: string;
  applyRecommendation: "yes" | "caution" | "no";
}

interface PitchOutput {
  subject: string;
  body: string;
}

interface CompanyInvestigatorOutput {
  analysis: InvestigationAnalysis;
  pitch?: PitchOutput;
}

const SERVICE_LABELS: Record<ServiceOffered, string> = {
  website: "website development",
  marketing: "marketing strategy",
  accounting: "accounting and bookkeeping",
  branding: "branding and design",
  seo: "SEO optimization",
  social_media: "social media management",
};

export class CompanyInvestigatorAgent extends BaseAgent<
  CompanyInvestigatorInput,
  CompanyInvestigatorOutput
> {
  readonly type = "outreach" as const;
  readonly name = "Company Investigator Agent";

  protected async execute(
    input: CompanyInvestigatorInput,
    ctx: AgentRunContext
  ): Promise<CompanyInvestigatorOutput> {
    const { profile, job, websiteStatus, websiteUrl, signals, pitchService } = input;

    await ctx.log(`Investigating ${job.company}`, { progress: 15 });

    const investigatePrompt = await getPrompt("company_investigation");
    const analysis = await chatJson<InvestigationAnalysis>({
      systemPrompt: investigatePrompt.systemPrompt,
      userPrompt: interpolateTemplate(investigatePrompt.userPromptTemplate, {
        company: job.company,
        title: job.title,
        location: job.location ?? "Not specified",
        description: job.description?.slice(0, 4000) ?? "",
        websiteStatus,
        websiteUrl: websiteUrl ?? "None detected",
        signals: signals.join("; ") || "None",
      }),
      model: investigatePrompt.model ?? undefined,
      jsonMode: true,
      userId: ctx.userId,
      agentType: this.type,
    });

    await ctx.log("Company intel analysis complete", { progress: 60 });

    let pitch: PitchOutput | undefined;
    if (pitchService) {
      const pitchPrompt = await getPrompt("service_pitch_letter");
      pitch = await chatJson<PitchOutput>({
        systemPrompt: pitchPrompt.systemPrompt,
        userPrompt: interpolateTemplate(pitchPrompt.userPromptTemplate, {
          profileJson: JSON.stringify(profile, null, 2),
          company: job.company,
          title: job.title,
          service: SERVICE_LABELS[pitchService],
          gaps: JSON.stringify(analysis.gaps),
          intelSummary: analysis.intelSummary,
        }),
        model: pitchPrompt.model ?? undefined,
        jsonMode: true,
        userId: ctx.userId,
        agentType: this.type,
      });
      await ctx.log(`Pitch letter drafted for ${SERVICE_LABELS[pitchService]}`, {
        progress: 90,
      });
    }

    return { analysis, pitch };
  }
}

export const companyInvestigatorAgent = new CompanyInvestigatorAgent();
