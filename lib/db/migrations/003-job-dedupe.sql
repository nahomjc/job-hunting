-- Cross-source job deduplication key (same role at same company across boards)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_dedupe_key_idx
  ON jobs (dedupe_key)
  WHERE dedupe_key IS NOT NULL;
