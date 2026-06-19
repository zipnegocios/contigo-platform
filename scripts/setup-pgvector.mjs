import postgres from 'postgres'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'path'
import { fileURLToPath } from 'url'

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

async function setupPgVector() {
  const client = postgres(DATABASE_URL)

  try {
    console.log('🔄 Testing database connection...')
    await client`SELECT 1`
    console.log('✅ Database connection successful')

    console.log('ℹ️  Note: Vector embeddings stored in JSONB format (pgvector not available)')
    console.log('✅ Database is ready for migrations')

    await client.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error connecting to database:', error)
    await client.end()
    process.exit(1)
  }
}

setupPgVector()
