# JobHunter AI — Implementation Plan

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 16 App Router                       │
├──────────────┬──────────────────────┬───────────────────────────┤
│   Dashboard  │   Server Actions     │   API Routes (Cron)       │
│   (shadcn)   │   /app/actions/*     │   /api/cron/*             │
├──────────────┴──────────────────────┴───────────────────────────┤
│                        Service Layer                               │
│   analytics · notifications · user-sync                           │
├─────────────────────────────────────────────────────────────────┤
│                     AI Agent Layer                                 │
│   Manager → JobHunter · JobMatch · Resume · CoverLetter ·        │
│             Outreach · Interview                                   │
├─────────────────────────────────────────────────────────────────┤
│                   Repository Layer                                 │
│   profile · job · jobMatch · application · resume · interview    │
├─────────────────────────────────────────────────────────────────┤
│   Drizzle ORM  │  Supabase Auth  │  OpenRouter  │  Job Providers │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
job-hunting/
├── app/
│   ├── (auth)/login, signup
│   ├── dashboard/          # Protected SaaS dashboard
│   │   ├── page.tsx        # Overview + analytics
│   │   ├── jobs/           # Job matches with filters
│   │   ├── applications/   # Application tracking
│   │   ├── interviews/     # Interview prep
│   │   ├── notifications/
│   │   ├── resumes/
│   │   └── settings/       # Profile + preferences
│   ├── actions/            # Server Actions
│   └── api/cron/           # Scheduled jobs
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── dashboard/          # Dashboard components
├── lib/
│   ├── ai/
│   │   ├── agents/         # Specialized AI agents
│   │   ├── prompts/        # Prompt management
│   │   └── openrouter.ts   # OpenRouter client
│   ├── db/                 # Drizzle schema + client
│   ├── jobs/providers/     # Extensible job source adapters
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic
│   ├── security/           # Rate limiting + audit logs
│   └── supabase/           # Auth clients
└── types/
```

## Setup Steps

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Enable Email auth in Authentication → Providers
3. Copy URL, anon key, and service role key to `.env`
4. Get the Postgres connection string from Settings → Database

### 2. Environment

```bash
cp .env.example .env.local
# Fill in all values
```

### 3. Database

```bash
npm run db:push      # Push schema to Supabase Postgres
npm run db:seed      # Seed prompt templates
```

### 4. OpenRouter

1. Get an API key from [openrouter.ai](https://openrouter.ai)
2. Set `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL`

### 5. Run

```bash
npm run dev
```

## Agent Pipeline

| Agent | Responsibility | Trigger |
|-------|---------------|---------|
| **Manager** | Orchestrates all agents | Manual / Cron |
| **Job Hunter** | Searches providers, dedupes, saves jobs | Every 6h |
| **Job Match** | Scores jobs 0–100 with reasons | After search / daily |
| **Resume** | ATS-friendly tailored resume | On demand |
| **Cover Letter** | Personalized cover letter | On demand |
| **Outreach** | Email, LinkedIn, follow-up drafts | On demand |
| **Interview** | Prep notes + likely questions | On demand |

## Job Providers

| Provider | Env Vars | Notes |
|----------|----------|-------|
| RemoteOK | — | Public API, enabled by default |
| Wellfound | — | Public API, enabled by default |
| Greenhouse | `GREENHOUSE_BOARD_TOKEN`, `GREENHOUSE_COMPANY_NAME` | Per-company board |
| Lever | `LEVER_COMPANY_SLUG`, `LEVER_COMPANY_NAME` | Per-company |
| Career Page | `CAREER_PAGE_*` | Custom JSON endpoint |

Add new providers by implementing `JobProviderAdapter` in `lib/jobs/providers/`.

## Cron Schedule

Vercel **Hobby** allows **once-per-day** crons only (hourly deploys fail). Default: one daily tick at **06:00 UTC**.

| Job | Hobby (daily tick) | Pro (`CRON_INTERVAL=hourly`) |
|-----|-------------------|------------------------------|
| Search jobs | Every day | Every 6 hours |
| Recalculate scores | Every day | Daily 02:00 UTC |
| Weekly report | Mondays | Monday 09:00 UTC |

Endpoint: `/api/cron/tick` · Set `CRON_SECRET` · See [docs/CRON.md](docs/CRON.md).

## Security

- Supabase Auth with middleware session refresh
- User isolation via `userId` on all queries
- Rate limiting on server actions (in-memory; use Redis in production)
- Audit logs for profile updates
- Cron routes protected by `CRON_SECRET`

## Phase 2 Roadmap

- [ ] Redis rate limiting (Upstash)
- [x] Telegram bot webhook for chat ID linking
- [ ] Preference learning from user actions (save/reject/apply)
- [ ] PDF resume export
- [ ] Real-time notifications (Supabase Realtime)
- [ ] Admin panel for prompt template editing
- [ ] More job providers (LinkedIn, Indeed via official APIs)
