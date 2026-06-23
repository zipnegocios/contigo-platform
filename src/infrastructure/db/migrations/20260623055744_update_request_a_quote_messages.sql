-- Custom SQL migration file, put your code below! --

-- Fix-up for Task 4.2.3: the dynamic Zod validator built by
-- `buildZodValidator` (src/core/form-schema/FormSchema.ts) had no way to
-- carry a custom error message per field, so it fell back to Zod's generic
-- default messages. The real public "Request a Quote" form
-- (src/presentation/components/QuoteForm.tsx) has 3 branded error messages
-- that would otherwise silently regress to generic English defaults:
--   - name (min 2 chars): "Name must be at least 2 characters"
--   - service (required select): "Please select a service"
--   - message (textarea, min 10 chars): "Message must be at least 10 characters"
--
-- `FieldValidation.message` is a TS-level addition to the jsonb `schema`
-- column's logical shape (no new DB column needed). This migration
-- reconstructs the entire seeded schema JSON (same field set/order as
-- 20260622193729_seed_request_a_quote_form.sql) with the 3 messages added,
-- and adds a `validation: { message: ... }` object to the `service` field
-- (which previously had no `validation` key at all).
--
-- Does NOT edit the original seed migration in place — per this codebase's
-- convention, already-committed migrations are superseded by new ones, not
-- modified. Idempotent: this is a full UPDATE ... SET schema = <literal>,
-- not an incremental jsonb_set patch, so running it twice yields the same
-- end state.
UPDATE form_versions
SET schema = '{
    "steps": [
      {
        "fields": [
          { "id": "name", "type": "text", "label": "Your Name", "required": true, "validation": { "minLength": 2, "message": "Name must be at least 2 characters" }, "mapsToSystemField": "name", "locked": true },
          { "id": "email", "type": "email", "label": "Email Address", "required": true, "mapsToSystemField": "email", "locked": true },
          { "id": "phone", "type": "phone", "label": "Phone Number", "required": false, "mapsToSystemField": "phone", "locked": true },
          { "id": "service", "type": "select", "label": "Service", "required": true, "validation": { "message": "Please select a service" }, "options": ["New Home Building", "Home Extensions", "Home Renovations", "Carpentry", "Cladding", "Painting", "Landscaping", "Other"], "mapsToSystemField": "service", "locked": true },
          { "id": "message", "type": "textarea", "label": "Tell us about your project", "required": true, "validation": { "minLength": 10, "message": "Message must be at least 10 characters" }, "mapsToSystemField": "message", "locked": true },
          { "id": "consent", "type": "consent_checkbox", "label": "I agree to be contacted about my enquiry", "required": true, "locked": true }
        ]
      }
    ]
  }'::jsonb
WHERE id = (
  SELECT form_versions.id
  FROM form_versions
  JOIN forms ON forms.id = form_versions.form_id
  WHERE forms.slug = 'request-a-quote'
    AND form_versions.version = 1
);
