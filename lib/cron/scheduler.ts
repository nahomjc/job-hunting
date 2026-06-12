import type { CronJobName } from "./jobs";

/** All schedules use UTC. Set CRON_TIMEZONE in docs if you need local offsets. */

const SEARCH_HOURS_UTC = [0, 6, 12, 18];
const RECALCULATE_HOUR_UTC = 2;
const WEEKLY_REPORT_DAY_UTC = 1; // Monday
const WEEKLY_REPORT_HOUR_UTC = 9;

export function getScheduledJobs(now = new Date()): CronJobName[] {
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
  search_jobs: "Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)",
  recalculate_scores: "Daily at 02:00 UTC",
  weekly_report: "Mondays at 09:00 UTC",
  vercel: "Single hourly tick at :00 — runs due jobs internally",
} as const;
