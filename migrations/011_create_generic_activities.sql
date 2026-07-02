
CREATE TYPE activity_type AS ENUM (
  'CREATED',
  'UPDATED',
  'STATUS_CHANGED',
  'ASSIGNED',
  'NOTE_ADDED',
  'TASK_CREATED',
  'TASK_COMPLETED',
  'CONVERTED',
  'WON',
  'LOST'
);

-- create table using enum activity_type
CREATE TABLE
  activities (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER NOT NULL,
    entity_type entity_type NOT NULL,
    activity_type activity_type NOT NULL,
    description TEXT,
    organization_id INTEGER NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users (id),
    created_at TIMESTAMP DEFAULT NOW ()
  );