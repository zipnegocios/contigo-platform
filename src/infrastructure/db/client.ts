import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let dbInstance: ReturnType<typeof drizzle> | null = null
let clientInstance: ReturnType<typeof postgres> | null = null

function getDatabase() {
  if (dbInstance) return dbInstance

  if (!process.env.DATABASE_URL) {
    // During build time when DATABASE_URL is not available,
    // return a dummy drizzle instance that won't actually connect
    // This allows code to be compiled without errors
    console.warn('[DB] DATABASE_URL not available, using stub database client')
    return {} as ReturnType<typeof drizzle>
  }

  clientInstance = postgres(process.env.DATABASE_URL, {
    prepare: true,
    max: 20,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  })

  dbInstance = drizzle(clientInstance, {
    schema,
    logger: process.env.NODE_ENV === 'development',
  })

  return dbInstance
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (target, prop) => {
    const database = getDatabase()
    return (database as any)[prop]
  },
})

export async function testConnection() {
  try {
    const database = getDatabase()
    await database.execute('SELECT 1')
    console.log('✓ Database connection successful')
    return true
  } catch (error) {
    console.error('✗ Database connection failed:', error)
    return false
  }
}

export default db
