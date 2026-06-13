-- Add new job board providers (Jobicy, Landing.jobs)
-- Run in Supabase SQL Editor on existing databases.

ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'jobicy';
ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'landing_jobs';
ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'weworkremotely';
