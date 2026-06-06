#!/usr/bin/env node

/**
 * Check Environment Variables
 * Simple validation of required credentials
 */

const checks = {
  DATABASE_URL: { required: true, pattern: /postgresql:\/\// },
  NEXTAUTH_SECRET: { required: true, minLength: 32 },
  NEXTAUTH_URL: { required: true, pattern: /^https?:\/\// },
  RESEND_API_KEY: { required: true, pattern: /^re_/ },
  NEXT_PUBLIC_SITE_URL: { required: true, pattern: /^https?:\/\// },
  OPENAI_API_KEY: { required: false, pattern: /^sk-/ },
  R2_ACCOUNT_ID: { required: false },
}

console.log('\n🔐 Contigo Platform — Environment Check\n')

let passed = 0
let failed = 0
let warnings = 0

for (const [key, config] of Object.entries(checks)) {
  const value = process.env[key]

  if (!value) {
    if (config.required) {
      console.log(`❌ ${key} — MISSING (required)`)
      failed++
    } else {
      console.log(`⚠️  ${key} — not configured (optional)`)
      warnings++
    }
    continue
  }

  let isValid = true

  if (config.minLength && value.length < config.minLength) {
    isValid = false
  }

  if (config.pattern && !config.pattern.test(value)) {
    isValid = false
  }

  if (isValid) {
    console.log(`✅ ${key}`)
    passed++
  } else {
    console.log(`❌ ${key} — invalid format`)
    failed++
  }
}

console.log('\n' + '='.repeat(50))
console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | ⚠️  Warnings: ${warnings}\n`)

if (failed > 0) {
  console.log('❌ Some required variables are missing or invalid')
  console.log('📝 See CREDENTIALS.md for setup instructions\n')
  process.exit(1)
}

console.log('✅ Environment check passed!\n')
process.exit(0)
