CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    fullName VARCHAR(50) NOT NULL check (fullName ~ '^[A-Za-z ]+$'),
    profile_pic VARCHAR(255) check (profile_pic ~ '^(https?://|/)?[A-Za-z0-9._%+-]+\\.[A-Za-z]{2,}(/.*)?$'),
    email VARCHAR(100) UNIQUE NOT NULL check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password VARCHAR(255) NOT NULL check (length(password) >= 8 and password ~ '[A-Z]' and password ~ '[a-z]' and password ~ '[0-9]'),
    phone VARCHAR(20) check (phone ~ '^\+?[0-9]{7,15}$'),
    role_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    reports_to INTEGER NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_users_reports_to FOREIGN KEY (reports_to) REFERENCES users(id) ON DELETE SET NULL
);