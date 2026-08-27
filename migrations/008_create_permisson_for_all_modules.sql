INSERT INTO permissions (module_id, action)
SELECT m.id, p.action
FROM (
    VALUES
        -- Leads
        ('leads', 'create'),
        ('leads', 'read'),
        ('leads', 'update'),
        ('leads', 'delete'),
        ('leads', 'assign'),
        ('leads', 'convert'),
        ('leads', 'export'),
        ('leads', 'import'),
        ('leads', 'view_unassigned'),

        -- Customers
        ('customers', 'create'),
        ('customers', 'read'),
        ('customers', 'update'),
        ('customers', 'delete'),
        ('customers', 'assign'),
        ('customers', 'export'),
        ('customers', 'import'),

        -- Tasks
        ('tasks', 'create'),
        ('tasks', 'read'),
        ('tasks', 'update'),
        ('tasks', 'delete'),
        ('tasks', 'complete'),

        -- Notes
        ('notes', 'create'),
        ('notes', 'read'),
        ('notes', 'update'),
        ('notes', 'delete'),

        -- Calendar
        ('calendar', 'create'),
        ('calendar', 'read'),
        ('calendar', 'update'),
        ('calendar', 'delete'),

        -- Chat
        ('chat', 'read'),
        ('chat', 'send'),
        ('chat', 'delete'),
        ('chat', 'assign'),

        -- Analytics
        ('analytics', 'read'),
        ('analytics', 'export'),

        -- Roles
        ('roles', 'create'),
        ('roles', 'read'),
        ('roles', 'update'),
        ('roles', 'delete'),
        ('roles', 'manage_permissions'),

        -- Users
        ('users', 'create'),
        ('users', 'read'),
        ('users', 'update'),
        ('users', 'delete'),
        ('users', 'invite'),
        ('users', 'activate'),
        ('users', 'deactivate'),
        ('users', 'reset_password'),

        -- Deals
        ('deals', 'create'),
        ('deals', 'read'),
        ('deals', 'update'),
        ('deals', 'delete'),
        ('deals', 'assign'),

        -- Services
        ('services', 'create'),
        ('services', 'read'),
        ('services', 'update'),
        ('services', 'delete')
) AS p(module_name, action)
JOIN modules m
    ON m.name = p.module_name
ON CONFLICT (module_id, action) DO NOTHING;