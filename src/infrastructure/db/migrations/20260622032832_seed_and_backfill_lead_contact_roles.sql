-- Custom SQL migration file, put your code below! --

-- Seed: the 4 roles that previously existed as fixed values of the
-- lead_contact_role Postgres enum, now as rows in lead_contact_roles so
-- admins can add more from the UI. Marked isDefault so the app can
-- distinguish "built-in" roles from user-created ones later if needed.
INSERT INTO lead_contact_roles (id, key, label, is_default)
VALUES
  (gen_random_uuid(), 'owner', 'Owner', true),
  (gen_random_uuid(), 'site_manager', 'Site Manager', true),
  (gen_random_uuid(), 'spouse', 'Spouse', true),
  (gen_random_uuid(), 'other', 'Other', true)
ON CONFLICT (key) DO NOTHING;

-- Backfill: populate lead_contacts.role_id from the legacy role enum value,
-- matched by key, for every existing contact that had a role set. The old
-- `role` enum column itself is left in place — dropping it is deferred to a
-- separate, later migration (see plan's "no combinar add+drop" rule).
UPDATE lead_contacts
SET role_id = lead_contact_roles.id
FROM lead_contact_roles
WHERE lead_contacts.role IS NOT NULL
  AND lead_contacts.role::text = lead_contact_roles.key
  AND lead_contacts.role_id IS NULL;
