import postgres from 'postgres'
import bcryptjs from 'bcryptjs'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set - skipping initialization')
  process.exit(0)
}

async function seedAdmin() {
  const client = postgres(DATABASE_URL)

  try {
    console.log('🌱 Seeding admin user...\n')

    // Hash password
    const password = 'admin123'
    const passwordHash = await bcryptjs.hash(password, 10)

    // Insert admin user using raw SQL
    const adminEmail = 'admin@contigoconstructions.com.au'
    const adminName = 'Admin Contigo'
    const adminRole = 'owner'

    await client`
      INSERT INTO admin_users (email, password_hash, name, role, is_active, created_at, updated_at)
      VALUES (${adminEmail}, ${passwordHash}, ${adminName}, ${adminRole}, true, now(), now())
      ON CONFLICT (email) DO NOTHING
    `

    console.log('✅ Admin user ready!\n')
    console.log('📋 Login Credentials:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${password}\n`)
    console.log('🔐 Access admin portal:')
    console.log('   https://contigoconstructions.com.au/admin/login\n')
    console.log('⚠️  IMPORTANT: Change this password after first login!')
    console.log('   Go to /admin/settings → Change Password\n')

    await client.end()
    process.exit(0)
  } catch (error) {
    if (error.message.includes('admin_users') || error.message.includes('does not exist')) {
      // Table doesn't exist yet - migrations haven't run
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
