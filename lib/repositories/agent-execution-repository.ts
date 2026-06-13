import { eq, and, desc, inArray } from "drizzle-orm";
import { requireDb, agentExecutions, agentExecutionLogs } from "@/lib/db";
import type { AgentExecution, AgentExecutionLog } from "@/lib/db/schema";
import type { AgentType } from "@/lib/ai/agents/base-agent";
import { FEATURED_AGENT_TYPES } from "@/lib/agents/activity-display";
import {
  PIPELINE_AGENT_TYPES,
  PIPELINE_CANCEL_MESSAGE,
} from "@/lib/agents/cancellation";

export { FEATURED_AGENT_TYPES };

export const agentExecutionRepository = {
  async findRecentForUser(userId: string, limit = 50) {
    const db = requireDb();
    return db
      .select()
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.userId, userId),
          inArray(agentExecutions.agentType, [...FEATURED_AGENT_TYPES])
        )
      )
      .orderBy(desc(agentExecutions.startedAt))
      .limit(limit);
  },

  async findLatestByType(userId: string, agentType: AgentType) {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(agentExecutions)
      .where(
        and(eq(agentExecutions.userId, userId), eq(agentExecutions.agentType, agentType))
      )
      .orderBy(desc(agentExecutions.startedAt))
      .limit(1);
    return row ?? null;
  },

  async findRunning(userId: string) {
    const db = requireDb();
    return db
      .select()
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.userId, userId),
          eq(agentExecutions.status, "running"),
          inArray(agentExecutions.agentType, [...FEATURED_AGENT_TYPES])
        )
      )
      .orderBy(desc(agentExecutions.startedAt));
  },

  async findPipelineRunning(userId: string) {
    const db = requireDb();
    return db
      .select()
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.userId, userId),
          eq(agentExecutions.status, "running"),
          inArray(agentExecutions.agentType, [...PIPELINE_AGENT_TYPES])
        )
      )
      .orderBy(desc(agentExecutions.startedAt));
  },

  async isExecutionRunning(executionId: string) {
    const db = requireDb();
    const [row] = await db
      .select({ status: agentExecutions.status })
      .from(agentExecutions)
      .where(eq(agentExecutions.id, executionId))
      .limit(1);
    return row?.status === "running";
  },

  async cancelPipelineRunning(userId: string) {
    const db = requireDb();
    const running = await agentExecutionRepository.findPipelineRunning(userId);
    if (running.length === 0) return 0;

    const now = Date.now();
    await Promise.all(
      running.map((execution) =>
        db
          .update(agentExecutions)
          .set({
            status: "failed",
            error: PIPELINE_CANCEL_MESSAGE,
            completedAt: new Date(),
            durationMs: now - new Date(execution.startedAt).getTime(),
          })
          .where(eq(agentExecutions.id, execution.id))
      )
    );

    return running.length;
  },

  async findLatestPipelineManager(userId: string) {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(agentExecutions)
      .where(
        and(eq(agentExecutions.userId, userId), eq(agentExecutions.agentType, "manager"))
      )
      .orderBy(desc(agentExecutions.startedAt))
      .limit(1);

    if (!row || row.input?.task !== "full_pipeline") return null;
    return row;
  },

  async findLogsForUser(userId: string, limit = 100) {
    const db = requireDb();
    return db
      .select()
      .from(agentExecutionLogs)
      .where(
        and(
          eq(agentExecutionLogs.userId, userId),
          inArray(agentExecutionLogs.agentType, [...FEATURED_AGENT_TYPES])
        )
      )
      .orderBy(desc(agentExecutionLogs.createdAt))
      .limit(limit);
  },

  async findLogsForExecution(executionId: string) {
    const db = requireDb();
    return db
      .select()
      .from(agentExecutionLogs)
      .where(eq(agentExecutionLogs.executionId, executionId))
      .orderBy(agentExecutionLogs.createdAt);
  },
};

export type { AgentExecution, AgentExecutionLog };
