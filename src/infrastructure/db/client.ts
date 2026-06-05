import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined')
}

// Create postgres client with connection pooling
const client = postgres(process.env.DATABASE_URL, {
  prepare: true,
  max: 20,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})

// Export Drizzle instance
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
})

// Test connection function (use in health checks)
export async function testConnection() {
  try {
    await client`SELECT 1`
    console.log('✓ Database connection successful')
    return true
  } catch (error) {
    console.error('✗ Database connection failed:', error)
    return false
  }
}

export default db
