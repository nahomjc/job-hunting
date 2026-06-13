import { chatJson } from "@/lib/ai/openrouter";
import {
  getPrompt,
  interpolateTemplate,
} from "@/lib/ai/prompts/prompt-service";
import { normalizeProfileUrl } from "@/lib/utils";

export interface CvImprovementHint {
  area: string;
  issue: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export interface CvReview {
  overallGrade: number;
  gradeLabel: string;
  readinessSummary: string;
  strengths: string[];
  improvements: CvImprovementHint[];
}

export interface ParsedCvResult {
  fullName: string;
  skills: string[];
  yearsOfExperience: number;
  summary: string;
  resumeContent: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  review: CvReview;
}

function normalizePriority(value: unknown): "high" | "medium" | "low" {
  const p = String(value).toLowerCase();
  if (p === "high" || p === "medium" || p === "low") return p;
  return "medium";
}

function normalizeReview(raw: Partial<CvReview> | undefined): CvReview {
  const grade = Math.min(100, Math.max(0, Math.round(Number(raw?.overallGrade) || 0)));
  const improvements = Array.isArray(raw?.improvements)
    ? raw.improvements
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          area: String(item.area ?? "General"),
          issue: String(item.issue ?? ""),
          suggestion: String(item.suggestion ?? ""),
          priority: normalizePriority(item.priority),
        }))
        .filter((item) => item.issue || item.suggestion)
    : [];

  return {
    overallGrade: grade,
    gradeLabel: String(raw?.gradeLabel ?? "Needs review"),
    readinessSummary: String(
      raw?.readinessSummary ?? "Upload a CV to get a professional readiness grade."
    ),
    strengths: Array.isArray(raw?.strengths)
      ? raw.strengths.map(String).filter(Boolean)
      : [],
    improvements,
  };
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
    linkedinUrl: normalizeProfileUrl(result.linkedinUrl),
    githubUrl: normalizeProfileUrl(result.githubUrl),
    portfolioUrl: normalizeProfileUrl(result.portfolioUrl),
    review: normalizeReview(result.review),
  };
}
