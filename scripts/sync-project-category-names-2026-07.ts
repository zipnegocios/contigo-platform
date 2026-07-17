/**
 * Sync `projects.category` (legacy denormalized text) from the real
 * `categories.name` via `projects.category_id`.
 *
 * Root cause: the legacy text field only re-synced on project edit when
 * `categoryId` itself changed (see app/api/admin/projects/[id]/route.ts).
 * A category rename, or a project's category text set independently of its
 * FK, leaves it stale — this breaks the public category filter (which was
 * comparing against this text) and mislabels the category badge on project
 * cards. The filter itself is fixed separately to compare `categoryId`
 * directly; this script is a one-time backfill so the display text matches.
 *
 * Idempotente: solo actualiza filas donde el texto difiere del nombre real.
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/sync-project-category-names-2026-07.ts
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, isNotNull } from 'drizzle-orm'
import * as schema from '../src/infrastructure/db/schema'

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

async function run() {
  console.log('=== Sync projects.category from categories.name (via categoryId) ===\n')

  const rows = await db
    .select({
      id: schema.projects.id,
      title: schema.projects.title,
      category: schema.projects.category,
      categoryId: schema.projects.categoryId,
      categoryName: schema.categories.name,
    })
    .from(schema.projects)
    .innerJoin(schema.categories, eq(schema.projects.categoryId, schema.categories.id))
    .where(isNotNull(schema.projects.categoryId))

  const stale = rows.filter((r) => r.category !== r.categoryName)

  if (stale.length === 0) {
    console.log('No stale category text found — nothing to do.')
    await client.end()
    return
  }

  console.log(`Found ${stale.length} project(s) with stale category text:`)
  for (const row of stale) {
    console.log(`  "${row.title}": "${row.category}" → "${row.categoryName}"`)
    await db
      .update(schema.projects)
      .set({ category: row.categoryName, updatedAt: new Date() })
      .where(eq(schema.projects.id, row.id))
  }

  console.log('\nDone.')
  await client.end()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
