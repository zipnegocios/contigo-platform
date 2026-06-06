import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import bcryptjs from 'bcryptjs'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'path'
import { fileURLToPath } from 'url'
import * as schema from '../src/infrastructure/db/schema.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envConfig = config({
  path: path.resolve(__dirname, '..', '.env.local'),
})
expand(envConfig)

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

async function seedAdmin() {
  const client = postgres(DATABASE_URL)
  const db = drizzle(client, { schema })

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
    console.log('   Local: http://localhost:3000/admin/login')
    console.log('   Production: https://contigoconstructions.com.au/admin/login\n')
    console.log('⚠️  IMPORTANT: Change this password after first login!')
    console.log('   Go to /admin/settings → Change Password\n')

    await client.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding admin user:')
    if (error.code === '23505') {
      // Unique constraint violation
      console.error('   Admin user already exists in database')
      console.error('   Use existing credentials or delete from admin_users table')
    } else {
      console.error('  ', error.message)
    }
    await client.end()
    process.exit(1)
  }
}

seedAdmin()
