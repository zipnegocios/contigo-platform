import postgres from 'postgres'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'path'

// Load .env.local
const envConfig = config({
  path: path.resolve(process.cwd(), '.env.local'),
})
expand(envConfig)

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

async function setupPgVector() {
  const client = postgres(DATABASE_URL!)

  try {
    console.log('🔄 Creating pgvector extension...')
    await client`CREATE EXTENSION IF NOT EXISTS vector`
    console.log('✅ pgvector extension created successfully')

    await client.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error setting up pgvector:', error)
    await client.end()
    process.exit(1)
  }
}

setupPgVector()
