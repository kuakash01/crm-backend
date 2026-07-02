CREATE TABLE
    notes (
        id SERIAL PRIMARY KEY,
        entity_id INTEGER NOT NULL,
        entity_type entity_type NOT NULL,
        note TEXT NOT NULL,
        organization_id INTEGER NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
        created_by INTEGER NOT NULL REFERENCES users (id),
        created_at TIMESTAMP DEFAULT NOW (),
        updated_at TIMESTAMP DEFAULT NOW ()
    );