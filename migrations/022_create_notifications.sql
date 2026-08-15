CREATE TABLE
    notifications (
        id SERIAL PRIMARY KEY,
        organization_id INT NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        type notification_type NOT NULL,
        action notification_action NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        entity_type entity_type,
        entity_id INT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW ()
    );