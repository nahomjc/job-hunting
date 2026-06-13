import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import {
  agentExecutionRepository,
  FEATURED_AGENT_TYPES,
} from "@/lib/repositories/agent-execution-repository";
import { buildAgentActivity } from "@/lib/agents/activity-server";
import type { AgentType } from "@/lib/ai/agents/base-agent";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [running, pipelineRunning, recentLogs, latestPipelineManager] = await Promise.all([
      agentExecutionRepository.findRunning(user.id),
      agentExecutionRepository.findPipelineRunning(user.id),
      agentExecutionRepository.findLogsForUser(user.id, 80),
      agentExecutionRepository.findLatestPipelineManager(user.id),
    ]);

    const executionsByType = new Map<AgentType, Awaited<
      ReturnType<typeof agentExecutionRepository.findLatestByType>
    >>();

    await Promise.all(
      FEATURED_AGENT_TYPES.map(async (type) => {
        const runningForType = running.find((e) => e.agentType === type);
        if (runningForType) {
          executionsByType.set(type, runningForType);
        } else {
          const latest = await agentExecutionRepository.findLatestByType(user.id, type);
          executionsByType.set(type, latest);
        }
      })
    );

    const logsByExecution = new Map<string, typeof recentLogs>();
    for (const log of recentLogs) {
      const list = logsByExecution.get(log.executionId) ?? [];
      list.push(log);
      logsByExecution.set(log.executionId, list);
    }

    for (const [id, logs] of logsByExecution) {
      logsByExecution.set(id, logs.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
    }

    const agents = buildAgentActivity(executionsByType, logsByExecution);

    const allLogs = recentLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)
      .map((log) => ({
        id: log.id,
        agentType: log.agentType,
        message: log.message,
        level: log.level,
        progress: log.progress,
        createdAt: log.createdAt.toISOString(),
        executionId: log.executionId,
      }));

    const stats = {
      running: running.length,
      completed: agents.filter((a) => a.status === "completed").length,
      failed: agents.filter((a) => a.status === "failed").length,
      idle: agents.filter((a) => a.status === "idle").length,
    };

    const pipelineRunningNow = pipelineRunning.length > 0;
    const managerOutput = latestPipelineManager?.output as
      | { results?: { search?: Record<string, unknown>; scoring?: Record<string, unknown> } }
      | undefined;
    const managerResults = managerOutput?.results;

    return NextResponse.json({
      agents: agents.map((a) => ({
        type: a.type,
        name: a.config.name,
        description: a.config.description,
        status: a.status,
        progress: a.progress,
        latestMessage: a.latestMessage,
        execution: a.execution
          ? {
              id: a.execution.id,
              startedAt: a.execution.startedAt.toISOString(),
              completedAt: a.execution.completedAt?.toISOString() ?? null,
              durationMs: a.execution.durationMs,
              error: a.execution.error,
            }
          : null,
        logs: a.logs.map((l) => ({
          id: l.id,
          message: l.message,
          level: l.level,
          progress: l.progress,
          createdAt: l.createdAt.toISOString(),
        })),
      })),
      feed: allLogs,
      stats,
      pipeline: {
        running: pipelineRunningNow,
        manager: latestPipelineManager
          ? {
              id: latestPipelineManager.id,
              status: latestPipelineManager.status,
              error: latestPipelineManager.error,
              startedAt: latestPipelineManager.startedAt.toISOString(),
              completedAt: latestPipelineManager.completedAt?.toISOString() ?? null,
              results:
                latestPipelineManager.status === "completed" && managerResults
                  ? {
                      search: managerResults.search ?? null,
                      scoring: managerResults.scoring ?? null,
                    }
                  : null,
            }
          : null,
      },
      polledAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
