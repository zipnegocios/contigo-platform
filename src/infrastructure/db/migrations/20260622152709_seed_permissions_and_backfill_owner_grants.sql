-- Custom SQL migration file, put your code below! --

-- Seed: the 9 granular permission scopes from the staff permissions system
-- (Fase 4.1, §7.1). Each row is a stable key the admin UI checks against;
-- labels are the human-readable names shown in the "edit permissions" screen.
INSERT INTO permissions (key, label)
VALUES
  ('leads.view', 'View Leads'),
  ('leads.edit', 'Edit Leads'),
  ('leads.archive', 'Archive Leads'),
  ('pipeline.manage', 'Manage Pipeline'),
  ('tasks.manage', 'Manage Tasks'),
  ('form_builder.manage', 'Manage Form Builder'),
  ('users.manage', 'Manage Users'),
  ('media.manage', 'Manage Media'),
  ('settings.manage', 'Manage Settings')
ON CONFLICT (key) DO NOTHING;

-- Backfill: existing admin_users with role = 'owner' get every permission
-- key granted explicitly. Owners already bypass granular checks in app
-- logic, but seeding the join rows lets the "edit permissions" UI show
-- their real (full-access) state instead of an empty grant list.
INSERT INTO staff_user_permissions (user_id, permission_key)
SELECT admin_users.id, permissions.key
FROM admin_users
CROSS JOIN permissions
WHERE admin_users.role = 'owner'
ON CONFLICT (user_id, permission_key) DO NOTHING;