CREATE TABLE
  modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
  );

-- bare minimum data to run application
INSERT INTO modules(name)
VALUES
    ('leads'),
    ('customers'),
    ('tasks'),
    ('notes'),
    ('calendar'),
    ('chat'),
    ('analytics'),
    ('roles'),
    ('users'),
    ('deals'),
    ('services');

