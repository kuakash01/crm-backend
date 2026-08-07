
CREATE TABLE customers(
  id SERIAL PRIMARY KEY,
  fname VARCHAR(100) NOT NULL
    CHECK (fname ~ '^[A-Za-z]+$'),
  lname VARCHAR(100)
    CHECK (
      lname IS NULL
      OR lname ~ '^[A-Za-z]+$'
    ),
  email VARCHAR(100) UNIQUE NOT NULL
    CHECK (
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
  phone1 VARCHAR(20) NOT NULL
    CHECK (
      phone1 ~ '^\+?[0-9]{7,15}$'
    ),
  phone2 VARCHAR(20)
    CHECK (
      phone2 ~ '^\+?[0-9]{7,15}$'
    ),
  company VARCHAR(255),
  status customer_status NOT NULL
    DEFAULT 'ACTIVE',
  created_from customer_created_from NOT NULL
    DEFAULT 'LEAD',
  lead_id INTEGER UNIQUE,
  assigned_to INTEGER,
  organization_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_customers_lead_id
    FOREIGN KEY (lead_id)
    REFERENCES leads(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_customers_assigned_to
    FOREIGN KEY (assigned_to)
    REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_customers_to_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE
);