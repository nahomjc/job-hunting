# Cron jobs (Vercel & external)

JobHunter uses **one Vercel cron** to stay within plan limits. An hourly tick runs only the jobs that are due.

## Vercel (recommended)

`vercel.json` defines a single cron:

| Trigger | Endpoint | Schedule |
|---------|----------|----------|
| Hourly tick | `/api/cron/tick` | `0 * * * *` (every hour, UTC) |

Inside each tick, these run when due:

| Job | When (UTC) | What it does |
|-----|------------|--------------|
| `search_jobs` | 00:00, 06:00, 12:00, 18:00 | Full job-hunter pipeline per user |
| `recalculate_scores` | 02:00 daily | Re-score existing jobs |
| `weekly_report` | Monday 09:00 | Email/Telegram weekly stats |

**Required env:** `CRON_SECRET`

Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically when the cron invokes your route.

### Manual run (deployed)

```bash
# Run whatever is due this hour
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/tick

# Force a specific job
curl -H "Authorization: Bearer $CRON_SECRET" "https://your-app.vercel.app/api/cron/tick?job=search_jobs"

# Run all jobs (testing only)
curl -H "Authorization: Bearer $CRON_SECRET" "https://your-app.vercel.app/api/cron/tick?job=all"
```

## Vercel plan limits

| Plan | Cron jobs | Notes |
|------|-----------|--------|
| Hobby | 2 | This project uses **1** slot |
| Pro | 40 | Increase `maxDuration` on routes if pipelines timeout |

If you outgrow serverless timeouts, split users into batches or move heavy work to a queue (Upstash QStash, Inngest, etc.).

## External cron (free alternative)

If you cannot use Vercel Cron (or want separate schedules), use [cron-job.org](https://cron-job.org), GitHub Actions, or Uptime Robot to `GET` these endpoints with the same `Authorization` header:

| URL | Suggested schedule |
|-----|-------------------|
| `/api/cron/search-jobs` | `0 */6 * * *` |
| `/api/cron/recalculate-scores` | `0 2 * * *` |
| `/api/cron/weekly-report` | `0 9 * * 1` |

Remove or disable the Vercel cron in `vercel.json` if you use external triggers only.

## Local testing

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/tick?job=search_jobs"
```
