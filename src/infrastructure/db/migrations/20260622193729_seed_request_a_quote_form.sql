-- Custom SQL migration file, put your code below! --

-- Seed: the "Request a Quote" form (Fase 4.2 Form Builder) as a real
-- starting point before any admin ever touches the drag-and-drop builder.
-- The form_versions.schema below reconstructs TODAY's actual public quote
-- form (src/presentation/components/QuoteForm.tsx) field-for-field: name
-- (min 2 chars), email, phone (optional), service (select, 8 hardcoded
-- options), message (min 10 chars) — each locked + mapped to the matching
-- CreateQuoteUseCase param — plus a consent_checkbox that is locked +
-- required but has no mapsToSystemField (it's a gate, not a Quote column).
-- This satisfies the Task 4.2.2 rule that every form schema must carry at
-- least one required consent-type field.
INSERT INTO forms (id, name, slug)
VALUES (
  gen_random_uuid(),
  'Request a Quote',
  'request-a-quote'
)
ON CONFLICT (slug) DO NOTHING;

-- Guarded by WHERE NOT EXISTS on form_versions for this form's id, so
-- re-running this migration never inserts a duplicate version 1 row (the
-- forms insert above is itself a no-op on re-run thanks to ON CONFLICT).
INSERT INTO form_versions (id, form_id, schema, version)
SELECT
  gen_random_uuid(),
  forms.id,
  '{
    "steps": [
      {
        "fields": [
          { "id": "name", "type": "text", "label": "Your Name", "required": true, "validation": { "minLength": 2 }, "mapsToSystemField": "name", "locked": true },
          { "id": "email", "type": "email", "label": "Email Address", "required": true, "mapsToSystemField": "email", "locked": true },
          { "id": "phone", "type": "phone", "label": "Phone Number", "required": false, "mapsToSystemField": "phone", "locked": true },
          { "id": "service", "type": "select", "label": "Service", "required": true, "options": ["New Home Building", "Home Extensions", "Home Renovations", "Carpentry", "Cladding", "Painting", "Landscaping", "Other"], "mapsToSystemField": "service", "locked": true },
          { "id": "message", "type": "textarea", "label": "Tell us about your project", "required": true, "validation": { "minLength": 10 }, "mapsToSystemField": "message", "locked": true },
          { "id": "consent", "type": "consent_checkbox", "label": "I agree to be contacted about my enquiry", "required": true, "locked": true }
        ]
      }
    ]
  }'::jsonb,
  1
FROM forms
WHERE forms.slug = 'request-a-quote'
  AND NOT EXISTS (
    SELECT 1 FROM form_versions WHERE form_versions.form_id = forms.id
  );

-- Point the form at the version row just inserted (or already present from
-- a prior run) so the public form renderer (a later task) has an
-- active_version_id to resolve immediately.
UPDATE forms
SET active_version_id = form_versions.id
FROM form_versions
WHERE forms.slug = 'request-a-quote'
  AND form_versions.form_id = forms.id
  AND form_versions.version = 1
  AND forms.active_version_id IS NULL;
