// One-off verification for Task 4.2.2 (`buildZodValidator`). Not part of the
// permanent test suite — there is no test harness in this repo yet. Run with:
//   npx tsx scripts/verify-form-validator.mjs
//
// Loads the EXACT seeded `form_versions.schema` JSON from
// src/infrastructure/db/migrations/20260622193729_seed_request_a_quote_form.sql
// (the "Request a Quote" form) and confirms:
//   (a) buildZodValidator does NOT throw (schema already has a required
//       consent_checkbox)
//   (b) parsing a valid-looking payload succeeds
//   (c) parsing a payload missing the required `consent` field fails

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildZodValidator } from '../src/core/form-schema/FormSchema.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const migrationPath = path.join(
  __dirname,
  '..',
  'src/infrastructure/db/migrations/20260622193729_seed_request_a_quote_form.sql'
)
const migrationSql = readFileSync(migrationPath, 'utf8')

// Extract the JSON literal between '...'::jsonb in the form_versions INSERT.
const match = migrationSql.match(/SELECT\s+gen_random_uuid\(\),\s+forms\.id,\s+'([\s\S]*?)'::jsonb/)
if (!match) {
  throw new Error('Could not extract seeded schema JSON from migration file')
}
const seededSchema = JSON.parse(match[1])

console.log('Seeded schema field ids:', seededSchema.steps[0].fields.map((f) => f.id).join(', '))

let allPassed = true

// (a) buildZodValidator does NOT throw
let validator
try {
  validator = buildZodValidator(seededSchema)
  console.log('[PASS] (a) buildZodValidator did not throw for the seeded schema')
} catch (err) {
  allPassed = false
  console.error('[FAIL] (a) buildZodValidator threw unexpectedly:', err.message)
}

// (b) parsing a valid-looking payload succeeds
if (validator) {
  const validPayload = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    service: 'Home Renovations',
    message: 'We want to renovate our kitchen and bathroom.',
    consent: true,
  }
  const result = validator.safeParse(validPayload)
  if (result.success) {
    console.log('[PASS] (b) valid payload parsed successfully')
  } else {
    allPassed = false
    console.error('[FAIL] (b) valid payload failed to parse:', result.error.issues)
  }
}

// (c) parsing a payload missing the required `consent` field fails
if (validator) {
  const missingConsentPayload = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    service: 'Home Renovations',
    message: 'We want to renovate our kitchen and bathroom.',
    // consent omitted
  }
  const result = validator.safeParse(missingConsentPayload)
  if (!result.success) {
    console.log('[PASS] (c) payload missing required consent field correctly failed validation')
    console.log('       issue path(s):', result.error.issues.map((i) => i.path.join('.')).join(', '))
  } else {
    allPassed = false
    console.error('[FAIL] (c) payload missing consent unexpectedly passed validation')
  }
}

console.log('\n' + (allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'))
process.exit(allPassed ? 0 : 1)
