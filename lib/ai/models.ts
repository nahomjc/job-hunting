import type { PromptKey } from "@/lib/ai/prompts/defaults";

/**
 * Fast/cheap model for high-volume structured tasks (job scoring, CV parsing).
 * DeepSeek V3 on OpenRouter: ~$0.20/M input, ~$0.77/M output
 * vs Claude Sonnet: ~$3/M input, ~$15/M output
 */
export const FAST_MODEL =
  process.env.OPENROUTER_MODEL_FAST ?? "deepseek/deepseek-chat-v3-0324";

/** Quality model for writing tasks (resumes, cover letters, outreach). */
export const QUALITY_MODEL =
  process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4";

/** Tasks that run often in batch — use FAST_MODEL to save cost. */
const FAST_TASKS = new Set<PromptKey>(["job_match", "resume_analysis"]);

export function resolveModelForTask(
  key: PromptKey,
  override?: string | null
): string {
  if (override) return override;
  return FAST_TASKS.has(key) ? FAST_MODEL : QUALITY_MODEL;
}

export function isFastTask(key: PromptKey): boolean {
  return FAST_TASKS.has(key);
}
