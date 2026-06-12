import {
  requireDb,
  users,
  subscriptions,
  aiUsageLogs,
  loginEvents,
  auditLogs,
  agentExecutions,
} from "@/lib/db";
import {
  count,
  sql,
  eq,
  and,
  gte,
  desc,
  sum,
  lt,
  isNotNull,
  or,
} from "drizzle-orm";
import { ACTIVE_USER_DAYS, PLAN_MRR_CENTS } from "@/lib/admin/constants";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function emptyUserMetrics() {
  return {
    totalUsers: 0,
    activeUsers: 0,
    activeRate: 0,
    subscriptionsByPlan: [] as { plan: string; count: number }[],
    subscriptionsByStatus: [] as { status: string; count: number }[],
    recentUsers: [] as {
      id: string;
      email: string;
      plan: string | null;
      status: string | null;
      lastActiveAt: Date | null;
      createdAt: Date;
    }[],
  };
}

function emptyRevenueMetrics() {
  return {
    mrrCents: 0,
    mrrFormatted: "$0",
    churnRate: 0,
    activeSubscriptions: 0,
    canceledLast30Days: 0,
    planBreakdown: [] as { plan: string; count: number; mrrCents: number }[],
    mrrTrend: [] as { label: string; mrrCents: number }[],
  };
}

function emptyAiMetrics() {
  return {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalCostUsd: 0,
    requestsLast30Days: 0,
    modelUsage: [] as { model: string; requests: number; tokens: number; costUsd: number }[],
    dailyUsage: [] as { label: string; tokens: number; costUsd: number }[],
    recentLogs: [] as {
      id: string;
      model: string;
      agentType: string | null;
      totalTokens: number;
      costUsd: number;
      createdAt: Date;
      email: string | null;
    }[],
  };
}

function emptyAgentMetrics() {
  return {
    runningCount: 0,
    failedLast24h: 0,
    completedLast24h: 0,
    runningAgents: [] as {
      id: string;
      agentType: string;
      userId: string | null;
      email: string | null;
      startedAt: Date;
    }[],
    failedTasks: [] as {
      id: string;
      agentType: string;
      error: string | null;
      email: string | null;
      startedAt: Date;
      completedAt: Date | null;
    }[],
    executionHistory: [] as {
      id: string;
      agentType: string;
      status: string;
      durationMs: number | null;
      email: string | null;
      startedAt: Date;
      completedAt: Date | null;
    }[],
  };
}

function emptySecurityMetrics() {
  return {
    loginsLast24h: 0,
    failedLoginsLast24h: 0,
    suspiciousCount: 0,
    auditCountLast7Days: 0,
    loginActivity: [] as {
      id: string;
      email: string | null;
      ipAddress: string | null;
      success: boolean;
      suspicious: boolean;
      createdAt: Date;
    }[],
    suspiciousEvents: [] as {
      id: string;
      email: string | null;
      ipAddress: string | null;
      userAgent: string | null;
      createdAt: Date;
    }[],
    auditLogs: [] as {
      id: string;
      action: string;
      resource: string | null;
      email: string | null;
      ipAddress: string | null;
      createdAt: Date;
    }[],
  };
}

export const adminRepository = {
  async getUserMetrics() {
    try {
      const db = requireDb();
      const activeSince = daysAgo(ACTIVE_USER_DAYS);

      const [totalRow] = await db.select({ value: count() }).from(users);
      const [activeRow] = await db
        .select({ value: count() })
        .from(users)
        .where(
          or(
            gte(users.lastActiveAt, activeSince),
            and(sql`${users.lastActiveAt} IS NULL`, gte(users.createdAt, activeSince))
          )
        );

      const subsByPlan = await db
        .select({ plan: subscriptions.plan, value: count() })
        .from(subscriptions)
        .groupBy(subscriptions.plan);

      const subsByStatus = await db
        .select({ status: subscriptions.status, value: count() })
        .from(subscriptions)
        .groupBy(subscriptions.status);

      const recentUsers = await db
        .select({
          id: users.id,
          email: users.email,
          plan: subscriptions.plan,
          status: subscriptions.status,
          lastActiveAt: users.lastActiveAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
        .orderBy(desc(users.createdAt))
        .limit(25);

      const totalUsers = totalRow?.value ?? 0;
      const activeUsers = activeRow?.value ?? 0;

      return {
        totalUsers,
        activeUsers,
        activeRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        subscriptionsByPlan: subsByPlan.map((r) => ({
          plan: r.plan,
          count: r.value,
        })),
        subscriptionsByStatus: subsByStatus.map((r) => ({
          status: r.status,
          count: r.value,
        })),
        recentUsers,
      };
    } catch {
      return emptyUserMetrics();
    }
  },

  async getRevenueMetrics() {
    try {
      const db = requireDb();
      const thirtyDaysAgo = daysAgo(30);

      const [mrrRow] = await db
        .select({ value: sum(subscriptions.mrrCents) })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active"));

      const [activeSubsRow] = await db
        .select({ value: count() })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active"));

      const [canceledRow] = await db
        .select({ value: count() })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, "canceled"),
            isNotNull(subscriptions.canceledAt),
            gte(subscriptions.canceledAt, thirtyDaysAgo)
          )
        );

      const planBreakdown = await db
        .select({
          plan: subscriptions.plan,
          value: count(),
          mrr: sum(subscriptions.mrrCents),
        })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active"))
        .groupBy(subscriptions.plan);

      const mrrTrend = await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setMonth(monthStart.getMonth() - (5 - i));
          monthStart.setHours(0, 0, 0, 0);
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);

          const [row] = await db
            .select({ value: sum(subscriptions.mrrCents) })
            .from(subscriptions)
            .where(
              and(
                eq(subscriptions.status, "active"),
                lt(subscriptions.createdAt, monthEnd)
              )
            );

          return {
            label: monthStart.toLocaleDateString("en-US", { month: "short" }),
            mrrCents: Number(row?.value ?? 0),
          };
        })
      );

      const mrrCents = Number(mrrRow?.value ?? 0);
      const activeSubscriptions = activeSubsRow?.value ?? 0;
      const canceledLast30Days = canceledRow?.value ?? 0;
      const churnBase = activeSubscriptions + canceledLast30Days;
      const churnRate = churnBase > 0 ? (canceledLast30Days / churnBase) * 100 : 0;

      return {
        mrrCents,
        mrrFormatted: `$${(mrrCents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
        churnRate,
        activeSubscriptions,
        canceledLast30Days,
        planBreakdown: planBreakdown.map((r) => ({
          plan: r.plan,
          count: r.value,
          mrrCents: Number(r.mrr ?? 0),
        })),
        mrrTrend,
      };
    } catch {
      return emptyRevenueMetrics();
    }
  },

  async getAiUsageMetrics() {
    try {
      const db = requireDb();
      const thirtyDaysAgo = daysAgo(30);

      const [totals] = await db
        .select({
          totalTokens: sum(aiUsageLogs.totalTokens),
          promptTokens: sum(aiUsageLogs.promptTokens),
          completionTokens: sum(aiUsageLogs.completionTokens),
          totalCostUsd: sum(aiUsageLogs.costUsd),
        })
        .from(aiUsageLogs);

      const [requestsRow] = await db
        .select({ value: count() })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, thirtyDaysAgo));

      const modelUsage = await db
        .select({
          model: aiUsageLogs.model,
          requests: count(),
          tokens: sum(aiUsageLogs.totalTokens),
          costUsd: sum(aiUsageLogs.costUsd),
        })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, thirtyDaysAgo))
        .groupBy(aiUsageLogs.model)
        .orderBy(desc(sum(aiUsageLogs.totalTokens)));

      const dailyUsage = await Promise.all(
        Array.from({ length: 14 }, async (_, i) => {
          const dayStart = daysAgo(13 - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);

          const [row] = await db
            .select({
              tokens: sum(aiUsageLogs.totalTokens),
              costUsd: sum(aiUsageLogs.costUsd),
            })
            .from(aiUsageLogs)
            .where(
              and(
                gte(aiUsageLogs.createdAt, dayStart),
                lt(aiUsageLogs.createdAt, dayEnd)
              )
            );

          return {
            label: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            tokens: Number(row?.tokens ?? 0),
            costUsd: Number(row?.costUsd ?? 0),
          };
        })
      );

      const recentLogs = await db
        .select({
          id: aiUsageLogs.id,
          model: aiUsageLogs.model,
          agentType: aiUsageLogs.agentType,
          totalTokens: aiUsageLogs.totalTokens,
          costUsd: aiUsageLogs.costUsd,
          createdAt: aiUsageLogs.createdAt,
          email: users.email,
        })
        .from(aiUsageLogs)
        .leftJoin(users, eq(aiUsageLogs.userId, users.id))
        .orderBy(desc(aiUsageLogs.createdAt))
        .limit(30);

      return {
        totalTokens: Number(totals?.totalTokens ?? 0),
        promptTokens: Number(totals?.promptTokens ?? 0),
        completionTokens: Number(totals?.completionTokens ?? 0),
        totalCostUsd: Number(totals?.totalCostUsd ?? 0),
        requestsLast30Days: requestsRow?.value ?? 0,
        modelUsage: modelUsage.map((r) => ({
          model: r.model,
          requests: r.requests,
          tokens: Number(r.tokens ?? 0),
          costUsd: Number(r.costUsd ?? 0),
        })),
        dailyUsage,
        recentLogs,
      };
    } catch {
      return emptyAiMetrics();
    }
  },

  async getAgentMetrics() {
    try {
      const db = requireDb();
      const oneDayAgo = daysAgo(1);

      const [runningRow] = await db
        .select({ value: count() })
        .from(agentExecutions)
        .where(eq(agentExecutions.status, "running"));

      const [failedRow] = await db
        .select({ value: count() })
        .from(agentExecutions)
        .where(
          and(
            eq(agentExecutions.status, "failed"),
            gte(agentExecutions.startedAt, oneDayAgo)
          )
        );

      const [completedRow] = await db
        .select({ value: count() })
        .from(agentExecutions)
        .where(
          and(
            eq(agentExecutions.status, "completed"),
            gte(agentExecutions.startedAt, oneDayAgo)
          )
        );

      const runningAgents = await db
        .select({
          id: agentExecutions.id,
          agentType: agentExecutions.agentType,
          userId: agentExecutions.userId,
          email: users.email,
          startedAt: agentExecutions.startedAt,
        })
        .from(agentExecutions)
        .leftJoin(users, eq(agentExecutions.userId, users.id))
        .where(eq(agentExecutions.status, "running"))
        .orderBy(desc(agentExecutions.startedAt))
        .limit(20);

      const failedTasks = await db
        .select({
          id: agentExecutions.id,
          agentType: agentExecutions.agentType,
          error: agentExecutions.error,
          email: users.email,
          startedAt: agentExecutions.startedAt,
          completedAt: agentExecutions.completedAt,
        })
        .from(agentExecutions)
        .leftJoin(users, eq(agentExecutions.userId, users.id))
        .where(eq(agentExecutions.status, "failed"))
        .orderBy(desc(agentExecutions.startedAt))
        .limit(25);

      const executionHistory = await db
        .select({
          id: agentExecutions.id,
          agentType: agentExecutions.agentType,
          status: agentExecutions.status,
          durationMs: agentExecutions.durationMs,
          email: users.email,
          startedAt: agentExecutions.startedAt,
          completedAt: agentExecutions.completedAt,
        })
        .from(agentExecutions)
        .leftJoin(users, eq(agentExecutions.userId, users.id))
        .orderBy(desc(agentExecutions.startedAt))
        .limit(50);

      return {
        runningCount: runningRow?.value ?? 0,
        failedLast24h: failedRow?.value ?? 0,
        completedLast24h: completedRow?.value ?? 0,
        runningAgents,
        failedTasks,
        executionHistory,
      };
    } catch {
      return emptyAgentMetrics();
    }
  },

  async getSecurityMetrics() {
    try {
      const db = requireDb();
      const oneDayAgo = daysAgo(1);
      const sevenDaysAgo = daysAgo(7);

      const [loginsRow] = await db
        .select({ value: count() })
        .from(loginEvents)
        .where(and(gte(loginEvents.createdAt, oneDayAgo), eq(loginEvents.success, true)));

      const [failedRow] = await db
        .select({ value: count() })
        .from(loginEvents)
        .where(and(gte(loginEvents.createdAt, oneDayAgo), eq(loginEvents.success, false)));

      const [suspiciousRow] = await db
        .select({ value: count() })
        .from(loginEvents)
        .where(eq(loginEvents.suspicious, true));

      const [auditRow] = await db
        .select({ value: count() })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, sevenDaysAgo));

      const loginActivity = await db
        .select({
          id: loginEvents.id,
          email: loginEvents.email,
          ipAddress: loginEvents.ipAddress,
          success: loginEvents.success,
          suspicious: loginEvents.suspicious,
          createdAt: loginEvents.createdAt,
        })
        .from(loginEvents)
        .orderBy(desc(loginEvents.createdAt))
        .limit(40);

      const suspiciousEvents = await db
        .select({
          id: loginEvents.id,
          email: loginEvents.email,
          ipAddress: loginEvents.ipAddress,
          userAgent: loginEvents.userAgent,
          createdAt: loginEvents.createdAt,
        })
        .from(loginEvents)
        .where(eq(loginEvents.suspicious, true))
        .orderBy(desc(loginEvents.createdAt))
        .limit(20);

      const auditLogRows = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          resource: auditLogs.resource,
          email: users.email,
          ipAddress: auditLogs.ipAddress,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(40);

      return {
        loginsLast24h: loginsRow?.value ?? 0,
        failedLoginsLast24h: failedRow?.value ?? 0,
        suspiciousCount: suspiciousRow?.value ?? 0,
        auditCountLast7Days: auditRow?.value ?? 0,
        loginActivity,
        suspiciousEvents,
        auditLogs: auditLogRows,
      };
    } catch {
      return emptySecurityMetrics();
    }
  },

  async getOverviewMetrics() {
    const [users, revenue, ai, agents, security] = await Promise.all([
      this.getUserMetrics(),
      this.getRevenueMetrics(),
      this.getAiUsageMetrics(),
      this.getAgentMetrics(),
      this.getSecurityMetrics(),
    ]);

    return { users, revenue, ai, agents, security };
  },
};

export { PLAN_MRR_CENTS };
