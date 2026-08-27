CREATE TABLE
  user_invitations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    full_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role_id INTEGER NOT NULL REFERENCES roles (id) ON DELETE RESTRICT,
    reports_to INTEGER NULL REFERENCES users (id) ON DELETE SET NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW ()
  );