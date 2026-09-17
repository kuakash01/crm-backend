-- Expand activity types to support manual call, meeting, and email logging
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'CALL_LOGGED';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'MEETING_LOGGED';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'EMAIL_SENT';
