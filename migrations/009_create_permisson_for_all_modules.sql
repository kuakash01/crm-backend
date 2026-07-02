INSERT INTO permissions (module_id, action)
SELECT
    m.id,
    a.action
FROM modules m
CROSS JOIN (
    VALUES
        ('create'),
        ('read'),
        ('update'),
        ('delete')
) AS a(action);