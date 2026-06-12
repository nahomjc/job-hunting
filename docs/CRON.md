# Cron jobs (Vercel & external)

JobHunter uses **one Vercel cron** hitting `/api/cron/tick`. The default setup works on **Vercel Hobby** (once per day only).

## Vercel plan limits (2026)

| | Hobby | Pro / Enterprise |
|---|--------|-------------------|
| Cron jobs per project | 100 | 100 |
| **Minimum interval** | **Once per day** | Once per minute |
| **Scheduling precision** | Hourly (±59 min) | Per-minute |

**Hobby:** expressions like `0 * * * *` (hourly) **fail at deploy** with *"Hobby accounts are limited to daily cron jobs"*. A daily job scheduled `0 6 * * *` may fire anywhere between 06:00 and 06:59 UTC.

**Pro:** set `CRON_INTERVAL=hourly` and change `vercel.json` to `0 * * * *` for the original 6-hour search / daily recalc / Monday report schedule.

Cron invocations use Vercel Functions — [Functions limits and pricing](https://vercel.com/docs/functions/limitations) apply.

---

## Default (Hobby-compatible)

`vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/tick", "schedule": "0 6 * * *" }]
}
```

Each daily run executes:

| Job | When |
|-----|------|
| `search_jobs` | Every day |
| `recalculate_scores` | Every day |
| `weekly_report` | Mondays only |

**Env:** `CRON_SECRET` (required), `CRON_INTERVAL=daily` (default, optional)

---

## Pro — hourly scheduling

1. Vercel env: `CRON_INTERVAL=hourly`
2. Update `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/tick", "schedule": "0 * * * *" }]
}
```

| Job | When (UTC) |
|-----|------------|
| `search_jobs` | 00:00, 06:00, 12:00, 18:00 |
| `recalculate_scores` | 02:00 daily |
| `weekly_report` | Monday 09:00 |

---

## Manual / testing

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/tick

curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-app.vercel.app/api/cron/tick?job=search_jobs"

curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-app.vercel.app/api/cron/tick?job=all"
```

Individual endpoints (for external cron):

- `/api/cron/search-jobs`
- `/api/cron/recalculate-scores`
- `/api/cron/weekly-report`

---

## External cron (more frequent search on Hobby)

Vercel Hobby cannot run job search every 6 hours. Use a free external scheduler (e.g. [cron-job.org](https://cron-job.org)) to call:

```
GET /api/cron/search-jobs
Authorization: Bearer <CRON_SECRET>
Schedule: 0 */6 * * *
```

Keep the single daily Vercel cron for recalc + weekly report, or disable Vercel cron and use external URLs for all three.

---

## Local testing

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/tick?job=search_jobs"
```
