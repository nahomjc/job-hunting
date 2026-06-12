import type { AgentExecution, AgentExecutionLog } from "@/lib/db/schema";
import type { AgentType } from "@/lib/ai/agents/base-agent";
import {
  AGENT_DISPLAY,
  FEATURED_AGENT_TYPES,
  getIdleMessage,
  type AgentDisplayConfig,
} from "@/lib/agents/activity-display";

export interface AgentActivityItem {
  type: AgentType;
  config: AgentDisplayConfig;
  execution: AgentExecution | null;
  progress: number;
  status: "idle" | "running" | "completed" | "failed" | "pending";
  latestMessage: string;
  logs: AgentExecutionLog[];
}

export function getProgressFromLogs(
  logs: AgentExecutionLog[],
  execution: AgentExecution | null
): number {
  if (!execution) return 0;
  if (execution.status === "completed") return 100;
  if (execution.status === "failed") {
    const last = logs.filter((l) => l.progress != null).pop();
    return last?.progress ?? 30;
  }
  if (execution.status === "running") {
    const last = logs.filter((l) => l.progress != null).pop();
    if (last?.progress != null) return last.progress;
    const elapsed = Date.now() - new Date(execution.startedAt).getTime();
    return Math.min(85, 15 + Math.floor(elapsed / 1000) * 2);
  }
  return 0;
}

export function buildAgentActivity(
  executionsByType: Map<AgentType, AgentExecution | null>,
  logsByExecution: Map<string, AgentExecutionLog[]>
): AgentActivityItem[] {
  return FEATURED_AGENT_TYPES.map((type) => {
    const config = AGENT_DISPLAY[type];
    const execution = executionsByType.get(type) ?? null;
    const logs = execution ? logsByExecution.get(execution.id) ?? [] : [];
    const status = execution?.status ?? "idle";
    const progress = getProgressFromLogs(logs, execution);

    let latestMessage = getIdleMessage(type);
    if (logs.length > 0) {
      latestMessage = logs[logs.length - 1]!.message;
    } else if (execution?.status === "failed" && execution.error) {
      latestMessage = execution.error;
    } else if (execution?.status === "running") {
      latestMessage = `${config.name} is running…`;
    }

    return {
      type,
      config,
      execution,
      progress,
      status: status as AgentActivityItem["status"],
      latestMessage,
      logs,
    };
  });
}
