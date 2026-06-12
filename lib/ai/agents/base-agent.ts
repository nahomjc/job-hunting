import { eq } from "drizzle-orm";
import { requireDb, agentExecutions } from "@/lib/db";
import type { AgentResult } from "@/types";

export type AgentType =
  | "manager"
  | "job_hunter"
  | "job_match"
  | "resume"
  | "cover_letter"
  | "outreach"
  | "interview";

export abstract class BaseAgent<TInput, TOutput> {
  abstract readonly type: AgentType;
  abstract readonly name: string;

  protected abstract execute(input: TInput): Promise<TOutput>;

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

    try {
      const data = await this.execute(input);
      const durationMs = Date.now() - start;

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
