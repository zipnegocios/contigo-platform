import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'path'

// Load .env.local for drizzle-kit
const envConfig = config({
  path: path.resolve(process.cwd(), '.env.local'),
})
expand(envConfig)

export default {
  schema: './src/infrastructure/db/schema.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    prefix: 'timestamp',
  },
  verbose: true,
  strict: true,
} satisfies Config
