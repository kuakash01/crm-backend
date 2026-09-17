-- 029_add_oauth_and_login_otp.sql
-- Add LOGIN_OTP to auth_otp_purpose enum and add OAuth columns to users table

ALTER TYPE auth_otp_purpose ADD VALUE IF NOT EXISTS 'LOGIN_OTP';

ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
