CREATE TABLE
    permissions (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
        UNIQUE (module_id, action)
    );