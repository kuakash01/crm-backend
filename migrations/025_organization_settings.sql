-- Organization profile fields + permissions for the settings page.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo VARCHAR(500);

INSERT INTO modules (name)
VALUES ('organizations')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (module_id, action)
SELECT m.id, p.action
FROM modules m
CROSS JOIN (
  VALUES
    ('read'),
    ('update')
) AS p(action)
WHERE m.name = 'organizations'
ON CONFLICT (module_id, action) DO NOTHING;

-- Every role can view organization details.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
JOIN modules m ON m.id = p.module_id
WHERE m.name = 'organizations'
  AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Admin roles can update organization details.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
JOIN modules m ON m.id = p.module_id
WHERE m.name = 'organizations'
  AND p.action = 'update'
  AND LOWER(r.name) = 'admin'
ON CONFLICT DO NOTHING;
