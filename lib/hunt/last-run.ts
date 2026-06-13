import type { AgentExecution } from "@/lib/db/schema";
import { agentExecutionRepository } from "@/lib/repositories/agent-execution-repository";

export interface LastHuntSummary {
  completedAt: string | null;
  durationMs: number | null;
  status: "completed" | "failed";
  found: number;
  saved: number;
  scored: number;
  highMatches: number;
  error?: string;
}

function readHunterOutput(execution: AgentExecution | null) {
  if (!execution?.output || typeof execution.output !== "object") {
    return { found: 0, saved: 0 };
  }
  const o = execution.output as Record<string, unknown>;
  return {
    found: typeof o.found === "number" ? o.found : 0,
    saved: typeof o.saved === "number" ? o.saved : 0,
  };
}

function readMatchOutput(execution: AgentExecution | null) {
  if (!execution?.output || typeof execution.output !== "object") {
    return { scored: 0, highMatches: 0 };
  }
  const o = execution.output as Record<string, unknown>;
  return {
    scored: typeof o.scored === "number" ? o.scored : 0,
    highMatches: typeof o.highMatches === "number" ? o.highMatches : 0,
  };
}

export async function getLastHuntSummary(userId: string): Promise<LastHuntSummary | null> {
  const [hunter, matcher] = await Promise.all([
    agentExecutionRepository.findLatestByType(userId, "job_hunter"),
    agentExecutionRepository.findLatestByType(userId, "job_match"),
  ]);

  if (!hunter || (hunter.status !== "completed" && hunter.status !== "failed")) {
    return null;
  }

  const hunterStats = readHunterOutput(hunter);
  const matchStats = readMatchOutput(matcher);
  const useMatch =
    matcher &&
    matcher.startedAt.getTime() >= hunter.startedAt.getTime() - 120_000;

  return {
    completedAt: (matcher?.completedAt ?? hunter.completedAt)?.toISOString() ?? null,
    durationMs: (hunter.durationMs ?? 0) + (useMatch ? (matcher?.durationMs ?? 0) : 0) || null,
    status: hunter.status === "failed" ? "failed" : "completed",
    found: hunterStats.found,
    saved: hunterStats.saved,
    scored: useMatch ? matchStats.scored : 0,
    highMatches: useMatch ? matchStats.highMatches : 0,
    error: hunter.error ?? undefined,
  };
}
