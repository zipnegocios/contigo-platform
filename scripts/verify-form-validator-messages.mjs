// One-off verification for the Task 4.2.3 fix-up (custom error messages on
// `FieldValidation`). Not part of the permanent test suite — there is no
// test harness in this repo yet. Run with:
//   npx tsx scripts/verify-form-validator-messages.mjs
//
// Loads the UPDATED `form_versions.schema` JSON from the new migration
// src/infrastructure/db/migrations/20260623055744_update_request_a_quote_messages.sql
// (not the original seed migration's JSON) and confirms the 3 branded
// error messages from today's real public quote form survive the
// schema-driven validator:
//   (a) name: 1 char -> 'Name must be at least 2 characters'
//   (b) service: '' or omitted -> 'Please select a service'
//   (c) message: < 10 chars -> 'Message must be at least 10 characters'
// Also confirms email/phone are unaffected (no custom message, sensible
// Zod defaults still apply).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildZodValidator } from '../src/core/form-schema/FormSchema.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const migrationPath = path.join(
  __dirname,
  '..',
  'src/infrastructure/db/migrations/20260623055744_update_request_a_quote_messages.sql'
)
const migrationSql = readFileSync(migrationPath, 'utf8')

// Extract the JSON literal between '...'::jsonb in the UPDATE statement.
const match = migrationSql.match(/SET\s+schema\s*=\s*'([\s\S]*?)'::jsonb/)
if (!match) {
  throw new Error('Could not extract updated schema JSON from migration file')
}
const updatedSchema = JSON.parse(match[1])

console.log('Updated schema field ids:', updatedSchema.steps[0].fields.map((f) => f.id).join(', '))

let allPassed = true

function expectMessage(label, payload, fieldId, expectedMessage) {
  const validator = buildZodValidator(updatedSchema)
  const result = validator.safeParse(payload)
  if (result.success) {
    allPassed = false
    console.error(`[FAIL] ${label}: payload unexpectedly passed validation`)
    return
  }
  const issue = result.error.issues.find((i) => i.path.join('.') === fieldId)
  if (!issue) {
    allPassed = false
    console.error(
      `[FAIL] ${label}: no issue found for field '${fieldId}'. Issues:`,
      JSON.stringify(result.error.issues)
    )
    return
  }
  if (issue.message === expectedMessage) {
    console.log(`[PASS] ${label}: got exact message "${issue.message}"`)
  } else {
    allPassed = false
    console.error(`[FAIL] ${label}: expected "${expectedMessage}", got "${issue.message}"`)
  }
}

const basePayload = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-1234',
  service: 'Home Renovations',
  message: 'We want to renovate our kitchen and bathroom.',
  consent: true,
}

// (a) name: 1 char
expectMessage(
  '(a) name min length',
  { ...basePayload, name: 'A' },
  'name',
  'Name must be at least 2 characters'
)

// (b) service: empty string
expectMessage(
  '(b) service empty string',
  { ...basePayload, service: '' },
  'service',
  'Please select a service'
)

// (b) service: omitted entirely
{
  const payload = { ...basePayload }
  delete payload.service
  expectMessage('(b) service omitted', payload, 'service', 'Please select a service')
}

// (c) message: under 10 chars
expectMessage(
  '(c) message min length',
  { ...basePayload, message: 'short' },
  'message',
  'Message must be at least 10 characters'
)

// Confirm email/phone are UNCHANGED (no custom message — generic Zod
// defaults still apply, not the 3 branded messages above).
{
  const validator = buildZodValidator(updatedSchema)
  const result = validator.safeParse({ ...basePayload, email: 'not-an-email' })
  if (result.success) {
    allPassed = false
    console.error('[FAIL] email: invalid email unexpectedly passed validation')
  } else {
    const issue = result.error.issues.find((i) => i.path.join('.') === 'email')
    const isGenericDefault = issue && !['Name must be at least 2 characters', 'Please select a service', 'Message must be at least 10 characters'].includes(issue.message)
    if (issue && isGenericDefault) {
      console.log(`[PASS] email: unaffected, generic Zod message preserved: "${issue.message}"`)
    } else {
      allPassed = false
      console.error('[FAIL] email: unexpected message or missing issue:', JSON.stringify(issue))
    }
  }
}

{
  // phone is optional with no validation at all — omitting it should still
  // pass, confirming its behavior is untouched by this fix.
  const validator = buildZodValidator(updatedSchema)
  const payload = { ...basePayload }
  delete payload.phone
  const result = validator.safeParse(payload)
  if (result.success) {
    console.log('[PASS] phone: optional field with no validation still parses fine when omitted')
  } else {
    allPassed = false
    console.error('[FAIL] phone: omitting optional phone unexpectedly failed:', JSON.stringify(result.error.issues))
  }
}

// Sanity: a fully valid payload still passes.
{
  const validator = buildZodValidator(updatedSchema)
  const result = validator.safeParse(basePayload)
  if (result.success) {
    console.log('[PASS] sanity: fully valid payload still parses successfully')
  } else {
    allPassed = false
    console.error('[FAIL] sanity: valid payload failed to parse:', JSON.stringify(result.error.issues))
  }
}

console.log('\n' + (allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'))
process.exit(allPassed ? 0 : 1)
