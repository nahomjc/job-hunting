-- Run in Supabase SQL Editor if notification_settings queries fail
-- (missing telegram_link_code / telegram_link_expires_at after app update)

ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS telegram_link_code TEXT;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS telegram_link_expires_at TIMESTAMPTZ;

-- Optional: other recent columns/tables (safe to re-run)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

DO $$ BEGIN CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'team');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
