import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { mediaMetadata } from '../src/infrastructure/db/schema'
import { or, like } from 'drizzle-orm'

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL env variable is not set')
  process.exit(1)
}

const client = postgres(process.env.DATABASE_URL, { max: 1 })
const db = drizzle(client)

async function main() {
  console.log('🔄 Migrating existing media metadata rows to optimized = true for images...')
  await db
    .update(mediaMetadata)
    .set({ optimized: true })
    .where(
      or(
        like(mediaMetadata.key, '%.jpg'),
        like(mediaMetadata.key, '%.jpeg'),
        like(mediaMetadata.key, '%.png'),
        like(mediaMetadata.key, '%.gif'),
        like(mediaMetadata.key, '%.webp'),
        like(mediaMetadata.key, '%.avif'),
        like(mediaMetadata.key, '%.svg')
      )
    )
  console.log('✅ Migration completed successfully!')
  await client.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
