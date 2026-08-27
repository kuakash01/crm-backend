CREATE TABLE leads(
  id SERIAL PRIMARY KEY,
  fname VARCHAR(100) NOT NULL check (fname ~ '^[A-Za-z]+$'),
  lname VARCHAR(100) NOT NULL check (lname ~ '^[A-Za-z]+$'),
  email VARCHAR(100) UNIQUE NOT NULL check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone1 VARCHAR(20) NOT NULL check (phone1 ~ '^\+?[0-9]{7,15}$'),
  phone2 VARCHAR(20) check (phone2 ~ '^\+?[0-9]{7,15}$'),
  company VARCHAR(100),
  status lead_status NOT NULL DEFAULT 'NEW',
  source lead_source NOT NULL,
  assigned_to INTEGER,
  organization_id INTEGER NOT NULL,
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
   CONSTRAINT fk_leads_assigned_to_users 
    FOREIGN KEY (assigned_to)
REFERENCES users(id)
ON DELETE SET NULL
);