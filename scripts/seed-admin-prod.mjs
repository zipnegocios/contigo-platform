import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import bcryptjs from 'bcryptjs'
import * as schema from '../src/infrastructure/db/schema.ts'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set - skipping initialization (will run at first deploy)')
  process.exit(0)
}

async function seedAdmin() {
  const client = postgres(DATABASE_URL)
  const db = drizzle(client, { schema })

  try {
    // Apply migrations first
    console.log('📦 Running database migrations...\n')
    await migrate(db, { migrationsFolder: path.resolve(__dirname, '../drizzle') })
    console.log('✅ Migrations completed\n')
  } catch (error) {
    console.warn('⚠️  Migrations skipped or already applied:', error.message)
  }

  try {
    console.log('🌱 Seeding admin user...\n')

    // Hash password
    const password = 'admin123'
    const passwordHash = await bcryptjs.hash(password, 10)

    // Insert admin user
    const adminUser = {
      email: 'admin@contigoconstructions.com.au',
      passwordHash,
      name: 'Admin Contigo',
      role: 'owner',
      isActive: true,
    }

    const result = await db.insert(schema.adminUsers).values(adminUser).returning()

    console.log('✅ Admin user created successfully!\n')
    console.log('📋 Login Credentials:')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Password: ${password}\n`)
    console.log('🔐 Access admin portal:')
    console.log('   Production: https://contigoconstructions.com.au/admin/login\n')
    console.log('⚠️  IMPORTANT: Change this password after first login!')
    console.log('   Go to /admin/settings → Change Password\n')

    await client.end()
    process.exit(0)
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation - user already exists
      console.log('ℹ️  Admin user already exists in database')
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
