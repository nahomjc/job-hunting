import { requireDb, aiUsageLogs } from "@/lib/db";
import type { AgentType } from "@/lib/ai/agents/base-agent";
import { FAST_MODEL, QUALITY_MODEL } from "@/lib/ai/models";

const MODEL_RATES: Record<string, { inputPerM: number; outputPerM: number }> = {
  [FAST_MODEL]: { inputPerM: 0.2, outputPerM: 0.77 },
  [QUALITY_MODEL]: { inputPerM: 3, outputPerM: 15 },
  "deepseek/deepseek-chat-v3-0324": { inputPerM: 0.2, outputPerM: 0.77 },
  "anthropic/claude-sonnet-4": { inputPerM: 3, outputPerM: 15 },
};

const DEFAULT_RATES = { inputPerM: 1, outputPerM: 3 };

export function estimateTokenCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = MODEL_RATES[model] ?? DEFAULT_RATES;
  return (
    (promptTokens / 1_000_000) * rates.inputPerM +
    (completionTokens / 1_000_000) * rates.outputPerM
  );
}

export async function logAiUsage(data: {
  userId?: string;
  model: string;
  agentType?: AgentType;
  promptTokens: number;
  completionTokens: number;
}) {
  try {
    const db = requireDb();
    const totalTokens = data.promptTokens + data.completionTokens;
    const costUsd = estimateTokenCost(data.model, data.promptTokens, data.completionTokens);

    await db.insert(aiUsageLogs).values({
      userId: data.userId ?? null,
      model: data.model,
      agentType: data.agentType ?? null,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens,
      costUsd,
    });
  } catch {
    // Non-blocking — usage logging must not break AI calls
  }
}
