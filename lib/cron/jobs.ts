import { requireDb, profiles } from "@/lib/db";
import { managerAgent } from "@/lib/ai/agents/manager-agent";
import { analyticsService } from "@/lib/services/analytics-service";
import { notificationService } from "@/lib/services/notification-service";
import { profileHasCv } from "@/lib/profile/has-cv";
import { resumeRepository } from "@/lib/repositories/resume-repository";

export type CronJobName = "search_jobs" | "recalculate_scores" | "weekly_report";

export interface CronJobResult {
  job: CronJobName;
  processed: number;
  ok: boolean;
  error?: string;
}

export async function runSearchJobs(): Promise<CronJobResult> {
  try {
    const db = requireDb();
    const allProfiles = await db.select().from(profiles);
    const results = [];

    for (const profile of allProfiles) {
      if (!(await profileReadyForHunt(profile))) continue;

      const result = await managerAgent.run(
        { userId: profile.userId, task: "full_pipeline" },
        profile.userId
      );
      results.push({ userId: profile.userId, ...result });
    }

    return { job: "search_jobs", processed: results.length, ok: true };
  } catch (error) {
    return {
      job: "search_jobs",
      processed: 0,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function runRecalculateScores(): Promise<CronJobResult> {
  try {
    const db = requireDb();
    const allProfiles = await db.select().from(profiles);
    const results = [];

    for (const profile of allProfiles) {
      const result = await managerAgent.run(
        { userId: profile.userId, task: "score_jobs" },
        profile.userId
      );
      results.push({ userId: profile.userId, ...result });
    }

    return { job: "recalculate_scores", processed: results.length, ok: true };
  } catch (error) {
    return {
      job: "recalculate_scores",
      processed: 0,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function runWeeklyReport(): Promise<CronJobResult> {
  try {
    const db = requireDb();
    const allProfiles = await db.select().from(profiles);
    const reports = [];

    for (const profile of allProfiles) {
      const stats = await analyticsService.getDashboardStats(profile.userId, "all_time");
      await notificationService.notifyWeeklyReport(profile.userId, stats);
      reports.push({ userId: profile.userId, stats });
    }

    return { job: "weekly_report", processed: reports.length, ok: true };
  } catch (error) {
    return {
      job: "weekly_report",
      processed: 0,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const RUNNERS: Record<CronJobName, () => Promise<CronJobResult>> = {
  search_jobs: runSearchJobs,
  recalculate_scores: runRecalculateScores,
  weekly_report: runWeeklyReport,
};

export async function runCronJob(name: CronJobName): Promise<CronJobResult> {
  return RUNNERS[name]();
}

async function profileReadyForHunt(profile: (typeof profiles.$inferSelect)) {
  if (profileHasCv(profile)) return true;
  const resume = await resumeRepository.findDefault(profile.userId);
  return Boolean(resume?.content?.trim());
}

export async function runCronJobs(names: CronJobName[]): Promise<CronJobResult[]> {
  const results: CronJobResult[] = [];
  for (const name of names) {
    results.push(await RUNNERS[name]());
  }
  return results;
}
