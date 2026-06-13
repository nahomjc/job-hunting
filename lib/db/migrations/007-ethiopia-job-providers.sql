-- Ethiopia-local job board providers

ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'ethiojobs';
ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'afriwork';
ALTER TYPE job_provider ADD VALUE IF NOT EXISTS 'hahujobs';
