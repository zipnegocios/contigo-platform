-- Custom SQL migration file, put your code below! --

-- Ensure form_builder.manage permission key exists (idempotent)
INSERT INTO permissions (key, label)
VALUES ('form_builder.manage', 'Manage Form Builder')
ON CONFLICT (key) DO NOTHING;

-- Grant form_builder.manage to ALL admin users regardless of role.
-- The backfill in 20260622152709 only covered 'owner' role users;
-- this migration also covers 'staff' role admins so they can reach
-- the form builder hub without hitting a 403.
INSERT INTO staff_user_permissions (user_id, permission_key)
SELECT admin_users.id, 'form_builder.manage'
FROM admin_users
ON CONFLICT (user_id, permission_key) DO NOTHING;
