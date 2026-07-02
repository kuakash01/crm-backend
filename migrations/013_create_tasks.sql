CREATE TYPE task_status AS ENUM ('PENDING', 'COMPLETED');

CREATE TABLE
  tasks (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    entity_type entity_type NOT NULL,
    entity_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    status task_status NOT NULL DEFAULT 'PENDING',
    assigned_to INTEGER NOT NULL REFERENCES users (id),
    created_by INTEGER NOT NULL REFERENCES users (id),
    created_at TIMESTAMP DEFAULT NOW (),
    updated_at TIMESTAMP DEFAULT NOW ()
  );