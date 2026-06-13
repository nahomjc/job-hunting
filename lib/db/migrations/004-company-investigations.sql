-- Company investigations for gap analysis and service pitch letters

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
