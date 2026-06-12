import { chatJson } from "@/lib/ai/openrouter";
import {
  getPrompt,
  interpolateTemplate,
} from "@/lib/ai/prompts/prompt-service";

export interface ParsedCvResult {
  fullName: string;
  skills: string[];
  yearsOfExperience: number;
  summary: string;
  resumeContent: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
}

export async function parseCvWithAi(rawText: string): Promise<ParsedCvResult> {
  const prompt = await getPrompt("resume_analysis");

  const userPrompt = interpolateTemplate(prompt.userPromptTemplate, {
    resumeText: rawText,
  });

  const result = await chatJson<ParsedCvResult>({
    systemPrompt: prompt.systemPrompt,
    userPrompt,
    model: prompt.model ?? undefined,
    jsonMode: true,
    maxTokens: 8192,
  });

  return {
    fullName: result.fullName ?? "",
    skills: Array.isArray(result.skills) ? result.skills : [],
    yearsOfExperience: Number(result.yearsOfExperience) || 0,
    summary: result.summary ?? "",
    resumeContent: result.resumeContent ?? rawText,
    linkedinUrl: result.linkedinUrl ?? "",
    githubUrl: result.githubUrl ?? "",
    portfolioUrl: result.portfolioUrl ?? "",
  };
}
