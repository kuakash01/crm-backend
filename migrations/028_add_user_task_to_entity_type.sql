-- Add USER and TASK to entity_type enum for notifications and activity tracking
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'USER';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'TASK';
