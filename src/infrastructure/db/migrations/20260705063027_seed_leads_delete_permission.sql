-- Custom SQL migration file, put your code below! --

-- Seed: new granular permission for permanently deleting a trashed lead
-- (distinct from leads.archive, which only covers trash/restore).
INSERT INTO permissions (key, label)
VALUES
  ('leads.delete', 'Delete Leads Permanently')
ON CONFLICT (key) DO NOTHING;

-- Backfill: existing 'owner' admin_users get this permission granted
-- explicitly too, mirroring the original permissions seed migration
-- (owners bypass granular checks in app logic regardless).
INSERT INTO staff_user_permissions (user_id, permission_key)
SELECT admin_users.id, 'leads.delete'
FROM admin_users
WHERE admin_users.role = 'owner'
ON CONFLICT (user_id, permission_key) DO NOTHING;
