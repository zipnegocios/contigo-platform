import { hash } from 'bcryptjs'
import { db } from '../src/infrastructure/db/client'
import { adminUsers } from '../src/infrastructure/db/schema'

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...')

    // Hash password
    const passwordHash = await hash('admin123', 10)

    // Insert admin user
    const result = await db
      .insert(adminUsers)
      .values({
        email: 'admin@contigo.com',
        passwordHash,
        name: 'Admin User',
        role: 'owner',
        isActive: true,
      })
      .onConflictDoNothing()
      .returning()

    if (result.length > 0) {
      console.log('✅ Admin user created successfully')
      console.log(`   Email: admin@contigo.com`)
      console.log(`   Password: admin123`)
      console.log(`   Role: owner`)
    } else {
      console.log('ℹ️  Admin user already exists')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seedAdmin()
