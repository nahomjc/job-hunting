import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/security/rate-limit";
import {
  runCronJob,
  runCronJobs,
  type CronJobName,
} from "@/lib/cron/jobs";
import { getScheduledJobs, parseCronJobParam } from "@/lib/cron/scheduler";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobParam = parseCronJobParam(searchParams.get("job"));

  let jobs: CronJobName[];

  if (jobParam === "all") {
    jobs = ["search_jobs", "recalculate_scores", "weekly_report"];
  } else if (jobParam) {
    jobs = [jobParam];
  } else {
    jobs = getScheduledJobs();
  }

  if (jobs.length === 0) {
    return NextResponse.json({
      ok: true,
      ran: [],
      message: "No jobs scheduled for this hour (UTC)",
      utc: new Date().toISOString(),
    });
  }

  const results = await runCronJobs(jobs);

  return NextResponse.json({
    ok: results.every((r) => r.ok),
    ran: jobs,
    utc: new Date().toISOString(),
    results,
  });
}

/** POST supports manual trigger with body `{ "job": "search_jobs" }` */
export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let jobParam: ReturnType<typeof parseCronJobParam> = null;
  try {
    const body = (await request.json()) as { job?: string };
    jobParam = parseCronJobParam(body.job ?? null);
  } catch {
    // empty body — run scheduled jobs
  }

  if (jobParam && jobParam !== "all") {
    const result = await runCronJob(jobParam);
    return NextResponse.json({ ok: result.ok, results: [result] });
  }

  const jobs =
    jobParam === "all"
      ? (["search_jobs", "recalculate_scores", "weekly_report"] as CronJobName[])
      : getScheduledJobs();

  if (jobs.length === 0) {
    return NextResponse.json({ ok: true, ran: [], message: "Nothing scheduled" });
  }

  const results = await runCronJobs(jobs);
  return NextResponse.json({ ok: results.every((r) => r.ok), ran: jobs, results });
}
