import postgres from 'postgres'
import bcryptjs from 'bcryptjs'

const DATABASE_URL = process.env.DATABASE_URL
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME
const LEGACY_ADMIN_EMAIL = 'admin@contigoconstructions.com.au'
const BCRYPT_COST = 12

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set - skipping initialization')
  process.exit(0)
}

if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  console.error('❌ SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must both be set. Aborting - no default credentials will be used.')
  process.exit(1)
}

async function seedAdmin() {
  const client = postgres(DATABASE_URL)

  try {
    console.log('🌱 Checking admin user state...\n')

    await client.begin(async (tx) => {
      const [{ count }] = await tx`SELECT count(*)::int FROM admin_users`

      if (count === 0) {
        const passwordHash = await bcryptjs.hash(SEED_ADMIN_PASSWORD, BCRYPT_COST)
        const name = SEED_ADMIN_NAME || SEED_ADMIN_EMAIL.split('@')[0]
        await tx`
          INSERT INTO admin_users (email, password_hash, name, role, is_active, created_at, updated_at)
          VALUES (${SEED_ADMIN_EMAIL}, ${passwordHash}, ${name}, 'owner', true, now(), now())
        `
        console.log(`✅ No admin users existed. Provisioned ${SEED_ADMIN_EMAIL} as owner.\n`)
        return
      }

      const legacyRows = await tx`SELECT id, is_active FROM admin_users WHERE email = ${LEGACY_ADMIN_EMAIL}`
      const legacyActive = legacyRows.length > 0 && legacyRows[0].is_active

      if (!legacyActive) {
        console.log('ℹ️  Nothing to do — legacy admin already inactive or absent, and admin_users is non-empty.\n')
        return
      }

      const targetRows = await tx`SELECT id, role FROM admin_users WHERE email = ${SEED_ADMIN_EMAIL}`
      const passwordHash = await bcryptjs.hash(SEED_ADMIN_PASSWORD, BCRYPT_COST)

      if (targetRows.length === 0) {
        const name = SEED_ADMIN_NAME || SEED_ADMIN_EMAIL.split('@')[0]
        await tx`
          INSERT INTO admin_users (email, password_hash, name, role, is_active, created_at, updated_at)
          VALUES (${SEED_ADMIN_EMAIL}, ${passwordHash}, ${name}, 'owner', true, now(), now())
        `
      } else if (targetRows[0].role === 'owner') {
        await tx`
          UPDATE admin_users
          SET password_hash = ${passwordHash}, is_active = true, updated_at = now()
          WHERE id = ${targetRows[0].id}
        `
      } else {
        throw new Error(
          `${SEED_ADMIN_EMAIL} already exists with role '${targetRows[0].role}'. Refusing to silently promote it to owner - review manually.`
        )
      }

      await tx`
        UPDATE admin_users SET is_active = false, updated_at = now() WHERE email = ${LEGACY_ADMIN_EMAIL}
      `

      console.log(`✅ Migration complete: ${SEED_ADMIN_EMAIL} is now the active owner; ${LEGACY_ADMIN_EMAIL} has been deactivated.\n`)
    })

    await client.end()
    process.exit(0)
  } catch (error) {
    if (error.message?.includes('admin_users') || error.message?.includes('does not exist')) {
      console.warn('⚠️  Database not initialized - run migrations first')
      console.warn('   (Tables will be created automatically on database migrations)')
      await client.end()
      process.exit(0)
    } else {
      console.error('❌ Error seeding admin user:')
      console.error('   ', error.message)
      await client.end()
      process.exit(1)
    }
  }
}

seedAdmin()
