CREATE TABLE
  deals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    customer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    stage deal_stage NOT NULL DEFAULT 'OPEN',
    price NUMERIC(12, 2) NOT NULL,
    expected_close_date DATE,
    assigned_to INTEGER,
    organization_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW (),
    CONSTRAINT fk_deals_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT fk_deals_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT,
    CONSTRAINT fk_deals_assigned_to FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_deals_organization FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
  );