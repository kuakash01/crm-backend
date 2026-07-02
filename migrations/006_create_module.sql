CREATE TABLE
  modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
  );

INSERT INTO
  modules(name)
VALUES
  ('leads'),
  ('customers'),
  ('tasks'),
  ('notes'),
  ('calendar'),
  ('chat'),
  ('analytics')