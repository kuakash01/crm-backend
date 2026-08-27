CREATE TYPE auth_otp_purpose AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

CREATE TABLE
  auth_otp_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose auth_otp_purpose NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    last_sent_at TIMESTAMP NOT NULL DEFAULT NOW (),
    consumed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW ()
  );