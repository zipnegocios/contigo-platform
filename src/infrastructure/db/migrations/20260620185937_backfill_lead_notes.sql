-- Custom SQL migration file, put your code below! --

-- Backfill: copy any existing non-null Lead.adminNotes into lead_notes as each
-- lead's first note, before the admin_notes column is dropped.
INSERT INTO lead_notes (id, lead_id, body, created_by, created_at, updated_at)
SELECT gen_random_uuid(), id, admin_notes, NULL, updated_at, updated_at
FROM leads
WHERE admin_notes IS NOT NULL AND admin_notes <> '';
