-- Add secure publishable inbound_lead_key to organizations for public form & webhook ingestion
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS inbound_lead_key VARCHAR(64) UNIQUE;

-- Populate existing organizations with secure random tokens
UPDATE organizations
SET inbound_lead_key = md5(random()::text || clock_timestamp()::text || id::text)
WHERE inbound_lead_key IS NULL;

-- Set default for newly created organizations
ALTER TABLE organizations
ALTER COLUMN inbound_lead_key SET DEFAULT md5(random()::text || clock_timestamp()::text);
