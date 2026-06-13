-- Per-user local business lead scans (persisted across reloads)

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
