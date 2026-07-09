-- Custom SQL migration file, put your code below! --

-- Seed: granular permission scope for the Compliance & Legal Pages module.
INSERT INTO permissions (key, label)
VALUES
  ('legal.manage', 'Manage Legal Documents')
ON CONFLICT (key) DO NOTHING;

-- Backfill: existing 'owner' admin_users get legal.manage granted explicitly,
-- mirroring the original permissions seed migration (owners bypass granular
-- checks in app logic regardless).
INSERT INTO staff_user_permissions (user_id, permission_key)
SELECT admin_users.id, permissions.key
FROM admin_users
CROSS JOIN permissions
WHERE admin_users.role = 'owner'
  AND permissions.key = 'legal.manage'
ON CONFLICT (user_id, permission_key) DO NOTHING;
