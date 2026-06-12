import { eq, and, desc, inArray } from "drizzle-orm";
import { requireDb, agentExecutions, agentExecutionLogs } from "@/lib/db";
import type { AgentExecution, AgentExecutionLog } from "@/lib/db/schema";
import type { AgentType } from "@/lib/ai/agents/base-agent";
import { FEATURED_AGENT_TYPES } from "@/lib/agents/activity-display";

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
