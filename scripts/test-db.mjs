import postgres from 'postgres'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envConfig = config({ path: path.resolve(__dirname, '..', '.env.local') })
expand(envConfig)

const DATABASE_URL = process.env.DATABASE_URL
console.log('Database URL:', DATABASE_URL ? '✓ Set' : '✗ Not set')

const client = postgres(DATABASE_URL)

async function test() {
  try {
    console.log('\n📊 Testing Database Connection...\n')

    // Test basic connection
    const result = await client`SELECT 1 as connection_test`
    console.log('✅ Connection: SUCCESS')

    // Check tables
    const tables = await client`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('\n📋 Tables Created:')
    tables.forEach(t => console.log(`   • ${t.table_name}`))

    // Check extensions
    const extensions = await client`
      SELECT extname FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp')
    `
    console.log('\n🔧 Extensions:')
    if (extensions.length === 0) {
      console.log('   ℹ️  pgvector not available (using JSONB for embeddings)')
    } else {
      extensions.forEach(e => console.log(`   • ${e.extname}`))
    }

    console.log('\n✅ Database is ready!\n')
    await client.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    await client.end()
    process.exit(1)
  }
}

test()
