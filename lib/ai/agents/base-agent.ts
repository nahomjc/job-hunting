import { eq } from "drizzle-orm";
import { requireDb, agentExecutions, agentExecutionLogs } from "@/lib/db";
import type { AgentResult } from "@/types";

export type AgentType =
  | "manager"
  | "job_hunter"
  | "job_match"
  | "resume"
  | "cover_letter"
  | "outreach"
  | "interview";

export type AgentLogLevel = "info" | "success" | "warn" | "error";

export interface AgentRunContext {
  executionId: string;
  userId?: string;
  log: (
    message: string,
    options?: { progress?: number; level?: AgentLogLevel; metadata?: Record<string, unknown> }
  ) => Promise<void>;
}

export abstract class BaseAgent<TInput, TOutput> {
  abstract readonly type: AgentType;
  abstract readonly name: string;

  protected abstract execute(input: TInput, ctx: AgentRunContext): Promise<TOutput>;

  async run(input: TInput, userId?: string): Promise<AgentResult<TOutput>> {
    const db = requireDb();
    const start = Date.now();

    const [execution] = await db
      .insert(agentExecutions)
      .values({
        userId: userId ?? null,
        agentType: this.type,
        status: "running",
        input: input as Record<string, unknown>,
      })
      .returning();

    const ctx: AgentRunContext = {
      executionId: execution.id,
      userId,
      log: async (message, options) => {
        await db.insert(agentExecutionLogs).values({
          executionId: execution.id,
          userId: userId ?? null,
          agentType: this.type,
          message,
          progress: options?.progress,
          level: options?.level ?? "info",
          metadata: options?.metadata,
        });
      },
    };

    await ctx.log(`${this.name} initialized`, { progress: 5, level: "info" });

    try {
      const data = await this.execute(input, ctx);
      const durationMs = Date.now() - start;

      await ctx.log(`${this.name} completed successfully`, {
        progress: 100,
        level: "success",
        metadata: { durationMs },
      });

      await db
        .update(agentExecutions)
        .set({
          status: "completed",
          output: data as Record<string, unknown>,
          durationMs,
          completedAt: new Date(),
        })
        .where(eq(agentExecutions.id, execution.id));

      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await ctx.log(message, { level: "error" });
      await db
        .update(agentExecutions)
        .set({
          status: "failed",
          error: message,
          durationMs: Date.now() - start,
          completedAt: new Date(),
        })
        .where(eq(agentExecutions.id, execution.id));

      return { success: false, error: message };
    }
  }
}
