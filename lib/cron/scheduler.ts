import type { CronJobName } from "./jobs";

/** All schedules use UTC. */

export type CronInterval = "daily" | "hourly";

/** Hobby-safe default. Override with CRON_INTERVAL=hourly on Pro. */
export function getCronInterval(): CronInterval {
  const value = process.env.CRON_INTERVAL?.toLowerCase();
  return value === "hourly" ? "hourly" : "daily";
}

const SEARCH_HOURS_UTC = [0, 6, 12, 18];
const RECALCULATE_HOUR_UTC = 2;
const WEEKLY_REPORT_DAY_UTC = 1; // Monday
const WEEKLY_REPORT_HOUR_UTC = 9;

/** Hobby / once-per-day Vercel cron — runs everything appropriate in one invocation. */
function getDailyScheduledJobs(now: Date): CronJobName[] {
  const jobs: CronJobName[] = ["search_jobs", "recalculate_scores"];

  if (now.getUTCDay() === WEEKLY_REPORT_DAY_UTC) {
    jobs.push("weekly_report");
  }

  return jobs;
}

/** Pro — hourly Vercel cron; jobs run at their intended UTC times. */
function getHourlyScheduledJobs(now: Date): CronJobName[] {
  const hour = now.getUTCHours();
  const day = now.getUTCDay();
  const jobs: CronJobName[] = [];

  if (SEARCH_HOURS_UTC.includes(hour)) {
    jobs.push("search_jobs");
  }

  if (hour === RECALCULATE_HOUR_UTC) {
    jobs.push("recalculate_scores");
  }

  if (day === WEEKLY_REPORT_DAY_UTC && hour === WEEKLY_REPORT_HOUR_UTC) {
    jobs.push("weekly_report");
  }

  return jobs;
}

export function getScheduledJobs(now = new Date()): CronJobName[] {
  return getCronInterval() === "hourly"
    ? getHourlyScheduledJobs(now)
    : getDailyScheduledJobs(now);
}

export function parseCronJobParam(value: string | null): CronJobName | "all" | null {
  if (!value) return null;
  const normalized = value.replace(/-/g, "_");
  if (normalized === "all") return "all";
  if (
    normalized === "search_jobs" ||
    normalized === "recalculate_scores" ||
    normalized === "weekly_report"
  ) {
    return normalized;
  }
  return null;
}

export const CRON_SCHEDULE_SUMMARY = {
  daily: {
    vercel: "Once per day at 06:00 UTC (Hobby-compatible)",
    jobs: "search_jobs + recalculate_scores every day; weekly_report on Mondays",
  },
  hourly: {
    vercel: "Every hour at :00 UTC (Pro only — set CRON_INTERVAL=hourly)",
    search_jobs: "00:00, 06:00, 12:00, 18:00 UTC",
    recalculate_scores: "02:00 UTC daily",
    weekly_report: "Monday 09:00 UTC",
  },
} as const;
