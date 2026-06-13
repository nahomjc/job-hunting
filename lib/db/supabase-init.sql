-- JobHunter AI — initial schema for Supabase SQL Editor
-- Run once on a fresh database. Safe to re-run only if you add the exception blocks below.

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE remote_preference AS ENUM ('remote', 'hybrid', 'onsite', 'any');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE application_status AS ENUM (
  'discovered', 'saved', 'applied', 'recruiter_contacted',
  'interview_scheduled', 'offer_received', 'rejected'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE interview_stage AS ENUM (
  'phone_screen', 'technical', 'behavioral', 'onsite', 'final', 'other'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE notification_channel AS ENUM ('email', 'telegram', 'in_app');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE notification_type AS ENUM (
  'high_match_job', 'recruiter_response', 'interview_scheduled', 'weekly_report', 'system'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE agent_type AS ENUM (
  'manager', 'job_hunter', 'job_match', 'resume', 'cover_letter', 'outreach', 'interview'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE agent_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE job_provider AS ENUM (
  'remoteok', 'wellfound', 'remotive', 'arbeitnow',
  'remotejobs', 'himalayas', 'jobsbase', 'remnavi',
  'jobicy', 'landing_jobs', 'weworkremotely',
  'greenhouse', 'lever', 'career_page', 'manual',
  'ethiojobs', 'afriwork', 'hahujobs'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'team');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Run on existing databases:
-- ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'remotive';
-- ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'arbeitnow';
-- ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'remotejobs';
-- ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'himalayas';
-- ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'jobsbase';
-- ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'remnavi';
-- ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'jobicy';
-- ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'landing_jobs';
-- ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'weworkremotely';

-- ─── Users (synced from Supabase Auth) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  role            user_role NOT NULL DEFAULT 'user',
  blocked         BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_at      TIMESTAMPTZ,
  blocked_reason  TEXT,
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Run on existing databases:
-- DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
-- ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS telegram_link_code TEXT;
-- ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS telegram_link_expires_at TIMESTAMPTZ;

-- ─── Subscriptions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan                 subscription_plan NOT NULL DEFAULT 'free',
  status               subscription_status NOT NULL DEFAULT 'active',
  mrr_cents            INTEGER NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  canceled_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);

-- ─── AI Usage Logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  model             TEXT NOT NULL,
  agent_type        agent_type,
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER NOT NULL DEFAULT 0,
  cost_usd          REAL NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_idx ON ai_usage_logs (user_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_created_at_idx ON ai_usage_logs (created_at);
CREATE INDEX IF NOT EXISTS ai_usage_logs_model_idx ON ai_usage_logs (model);

-- ─── Login Events ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  email       TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  success     BOOLEAN NOT NULL DEFAULT TRUE,
  suspicious  BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS login_events_user_id_idx ON login_events (user_id);
CREATE INDEX IF NOT EXISTS login_events_created_at_idx ON login_events (created_at);
CREATE INDEX IF NOT EXISTS login_events_suspicious_idx ON login_events (suspicious);

-- Optional: keep public.users in sync with auth.users
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.users (id, email)
--   VALUES (NEW.id, NEW.email)
--   ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name             TEXT,
  skills                JSONB NOT NULL DEFAULT '[]'::JSONB,
  years_of_experience   INTEGER,
  preferred_salary_min  INTEGER,
  preferred_salary_max  INTEGER,
  preferred_locations   JSONB NOT NULL DEFAULT '[]'::JSONB,
  remote_preference     remote_preference NOT NULL DEFAULT 'any',
  linkedin_url          TEXT,
  github_url            TEXT,
  portfolio_url         TEXT,
  resume_text           TEXT,
  preferences           JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Jobs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     TEXT,
  provider        job_provider NOT NULL,
  company         TEXT NOT NULL,
  title           TEXT NOT NULL,
  dedupe_key      TEXT,
  description     TEXT,
  url             TEXT NOT NULL,
  salary_min      INTEGER,
  salary_max      INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  location        TEXT,
  is_remote       BOOLEAN NOT NULL DEFAULT FALSE,
  tags            JSONB NOT NULL DEFAULT '[]'::JSONB,
  raw_data        JSONB,
  posted_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS jobs_provider_external_id_idx ON jobs (provider, external_id);
CREATE UNIQUE INDEX IF NOT EXISTS jobs_dedupe_key_idx ON jobs (dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_company_idx ON jobs (company);

-- ─── Resumes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id     UUID REFERENCES jobs(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS resumes_user_id_idx ON resumes (user_id);

-- ─── Job Matches ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  score       REAL NOT NULL,
  reasons     JSONB NOT NULL DEFAULT '[]'::JSONB,
  explanation TEXT,
  scored_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS job_matches_user_job_idx ON job_matches (user_id, job_id);
CREATE INDEX IF NOT EXISTS job_matches_score_idx ON job_matches (score);

-- ─── Applications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id            UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_match_id      UUID REFERENCES job_matches(id) ON DELETE SET NULL,
  status            application_status NOT NULL DEFAULT 'discovered',
  cover_letter      TEXT,
  outreach_email    TEXT,
  outreach_linkedin TEXT,
  follow_up_message TEXT,
  notes             TEXT,
  applied_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS applications_user_job_idx ON applications (user_id, job_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status);

CREATE TABLE IF NOT EXISTS application_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  from_status     application_status,
  to_status       application_status,
  message         TEXT NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS application_events_application_id_idx ON application_events (application_id);
CREATE INDEX IF NOT EXISTS application_events_user_id_idx ON application_events (user_id);

-- ─── Interviews ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id    UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  stage             interview_stage NOT NULL DEFAULT 'other',
  scheduled_at      TIMESTAMPTZ,
  prep_notes        TEXT,
  likely_questions  JSONB NOT NULL DEFAULT '[]'::JSONB,
  feedback          TEXT,
  completed         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interviews_user_id_idx ON interviews (user_id);

-- ─── Company investigations ─────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE website_status AS ENUM ('found', 'missing', 'unreachable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS company_investigations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company         TEXT NOT NULL,
  country         TEXT,
  website_url     TEXT,
  website_status  website_status NOT NULL DEFAULT 'missing',
  gaps            JSONB NOT NULL DEFAULT '[]'::JSONB,
  intel_summary   TEXT,
  pitch_letter    TEXT,
  pitch_service   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS company_investigations_user_job_idx
  ON company_investigations (user_id, job_id);
CREATE INDEX IF NOT EXISTS company_investigations_user_id_idx
  ON company_investigations (user_id);

-- ─── User Business Leads ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_business_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  country_code    TEXT NOT NULL,
  category        TEXT NOT NULL,
  website_status  website_status NOT NULL DEFAULT 'missing',
  source          TEXT NOT NULL DEFAULT 'osm',
  analysis_note   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_business_leads_user_job_idx
  ON user_business_leads (user_id, job_id);
CREATE INDEX IF NOT EXISTS user_business_leads_user_country_idx
  ON user_business_leads (user_id, country_code);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  channel    notification_channel NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  metadata   JSONB,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);

-- ─── Notification Settings ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled             BOOLEAN NOT NULL DEFAULT TRUE,
  telegram_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  telegram_chat_id          TEXT,
  telegram_link_code        TEXT,
  telegram_link_expires_at  TIMESTAMPTZ,
  high_match_threshold      INTEGER NOT NULL DEFAULT 80,
  notify_high_match         BOOLEAN NOT NULL DEFAULT TRUE,
  notify_recruiter_response BOOLEAN NOT NULL DEFAULT TRUE,
  notify_interview_scheduled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Agent Executions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_executions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_type   agent_type NOT NULL,
  status       agent_status NOT NULL DEFAULT 'pending',
  input        JSONB,
  output       JSONB,
  error        TEXT,
  duration_ms  INTEGER,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS agent_executions_user_id_idx ON agent_executions (user_id);

CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_type   agent_type NOT NULL,
  message      TEXT NOT NULL,
  progress     INTEGER,
  level        TEXT NOT NULL DEFAULT 'info',
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_execution_logs_execution_id_idx ON agent_execution_logs (execution_id);
CREATE INDEX IF NOT EXISTS agent_execution_logs_user_id_idx ON agent_execution_logs (user_id);
CREATE INDEX IF NOT EXISTS agent_execution_logs_created_at_idx ON agent_execution_logs (created_at);

-- ─── Prompt Templates ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompt_templates (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                  TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  description          TEXT,
  system_prompt        TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  model                TEXT,
  version              INTEGER NOT NULL DEFAULT 1,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT,
  resource_id TEXT,
  metadata    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs (user_id);
