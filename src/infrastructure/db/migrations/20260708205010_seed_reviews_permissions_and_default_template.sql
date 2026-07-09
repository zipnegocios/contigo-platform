-- Custom SQL migration file, put your code below! --

-- Seed: granular permission scopes for the Google Business reputation
-- module (work order Phase 1, §Phase 0 catalog decision).
INSERT INTO permissions (key, label)
VALUES
  ('reviews.view', 'View Reviews'),
  ('reviews.moderate', 'Moderate Reviews'),
  ('reviews.reply', 'Reply to Reviews'),
  ('reviews.requests', 'Manage Review Requests'),
  ('reviews.settings', 'Manage Review Settings')
ON CONFLICT (key) DO NOTHING;

-- Backfill: existing 'owner' admin_users get every reviews.* key granted
-- explicitly, mirroring the original permissions seed migration (owners
-- bypass granular checks in app logic regardless).
INSERT INTO staff_user_permissions (user_id, permission_key)
SELECT admin_users.id, permissions.key
FROM admin_users
CROSS JOIN permissions
WHERE admin_users.role = 'owner'
  AND permissions.key IN ('reviews.view', 'reviews.moderate', 'reviews.reply', 'reviews.requests', 'reviews.settings')
ON CONFLICT (user_id, permission_key) DO NOTHING;

-- Seed: default review request template (Phase 5 dispatcher reads this row
-- when no other template is selected). Placeholders {{contactName}} and
-- {{reviewLink}} are substituted by the dispatcher at send time.
-- No unique constraint on name, so guard idempotency with NOT EXISTS.
INSERT INTO review_request_templates (name, subject, body_html, is_default)
SELECT
  'Default review request',
  'How did we do, {{contactName}}?',
  '<p>Hi {{contactName}},</p><p>Thanks for choosing Contigo Constructions for your project. We would really appreciate a moment of your time to share your experience on Google.</p><p><a href="{{reviewLink}}">Leave a review</a></p><p>Thank you,<br />Contigo Constructions</p>',
  true
WHERE NOT EXISTS (SELECT 1 FROM review_request_templates WHERE is_default = true);
