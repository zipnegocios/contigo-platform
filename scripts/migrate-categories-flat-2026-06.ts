/**
 * Migración: aplanar taxonomía de categorías a 4 raíces únicas
 *
 * Ejecutar UNA SOLA VEZ contra la BD:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/migrate-categories-flat-2026-06.ts
 *
 * Qué hace (en una transacción):
 *   1. Marca las 4 raíces como type='shared', isActive=true
 *   2. Re-apunta services.categoryId: leaf → root (para los servicios que apuntan a un leaf)
 *   3. Elimina TODOS los leaf categories (parentId IS NOT NULL)
 *   4. Elimina raíces que no son las 4 que queremos (legacy project-type, etc.)
 *
 * Idempotente: puede re-ejecutarse sin daño si ya se ejecutó antes.
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and, isNull, isNotNull, inArray, not } from 'drizzle-orm'
import * as schema from '../src/infrastructure/db/schema'

const SHARED_ROOT_SLUGS = [
  'carpentry',
  'cladding',
  'gyprock-fixing-flushing',
  'additional-services',
]

async function run() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 })
  const db = drizzle(client, { schema })

  console.log('=== migrate-categories-flat: START ===\n')

  await db.transaction(async (tx) => {
    // ── 1. Verify & update the 4 root categories ────────────────────────────
    const roots = await tx
      .select()
      .from(schema.categories)
      .where(
        and(
          inArray(schema.categories.slug, SHARED_ROOT_SLUGS),
          isNull(schema.categories.parentId),
        ),
      )

    if (roots.length !== 4) {
      throw new Error(
        `Expected 4 root categories, found ${roots.length}. ` +
        `Run scripts/seed-services-taxonomy-2026-06.ts first.`,
      )
    }

    const rootIds = new Set(roots.map((r) => r.id))

    for (const root of roots) {
      await tx
        .update(schema.categories)
        .set({ type: 'shared', isActive: true, isSystem: true, updatedAt: new Date() })
        .where(eq(schema.categories.id, root.id))
      console.log(`✓ Root updated: ${root.slug} → type=shared`)
    }

    // ── 2. Load all leaf categories ─────────────────────────────────────────
    const leaves = await tx
      .select()
      .from(schema.categories)
      .where(isNotNull(schema.categories.parentId))

    const leafById = new Map(leaves.map((l) => [l.id, l]))
    console.log(`\nFound ${leaves.length} leaf categories to remove.`)

    // ── 3. Migrate services.categoryId: leaf → root ──────────────────────────
    const services = await tx.select({ id: schema.services.id, categoryId: schema.services.categoryId }).from(schema.services)
    let migrated = 0

    for (const svc of services) {
      if (!svc.categoryId) continue
      if (rootIds.has(svc.categoryId)) continue // already points to root

      const leaf = leafById.get(svc.categoryId)
      if (!leaf || !leaf.parentId) continue

      if (!rootIds.has(leaf.parentId)) {
        console.warn(`  ⚠ Service ${svc.id}: leaf ${svc.categoryId} has parentId ${leaf.parentId} not in root set — skipping`)
        continue
      }

      await tx
        .update(schema.services)
        .set({ categoryId: leaf.parentId, updatedAt: new Date() })
        .where(eq(schema.services.id, svc.id))
      migrated++
    }

    console.log(`✓ Migrated ${migrated} services from leaf → root categoryId`)

    // ── 4. Delete all leaf categories ────────────────────────────────────────
    const deleted = await tx
      .delete(schema.categories)
      .where(isNotNull(schema.categories.parentId))
      .returning({ slug: schema.categories.slug })

    console.log(`✓ Deleted ${deleted.length} leaf categories`)

    // ── 5. Delete all OTHER root categories (legacy) ─────────────────────────
    const deletedLegacy = await tx
      .delete(schema.categories)
      .where(
        and(
          isNull(schema.categories.parentId),
          not(inArray(schema.categories.slug, SHARED_ROOT_SLUGS)),
        ),
      )
      .returning({ slug: schema.categories.slug })

    if (deletedLegacy.length > 0) {
      console.log(`✓ Deleted ${deletedLegacy.length} legacy root categories:`)
      deletedLegacy.forEach((c) => console.log(`    - ${c.slug}`))
    } else {
      console.log('  (no legacy roots found)')
    }
  })

  // ── Verification ─────────────────────────────────────────────────────────
  const finalCats = await db.select().from(schema.categories)
  const finalSvcs = await db
    .select({ id: schema.services.id, categoryId: schema.services.categoryId })
    .from(schema.services)

  console.log(`\n=== RESULT ===`)
  console.log(`Categories: ${finalCats.length} (expected 4)`)
  finalCats.forEach((c) => console.log(`  ✓ ${c.slug} [${c.type}]`))

  const unlinked = finalSvcs.filter((s) => s.categoryId === null)
  const linked = finalSvcs.filter((s) => s.categoryId !== null)
  console.log(`Services: ${finalSvcs.length} total, ${linked.length} with categoryId, ${unlinked.length} without`)

  await client.end()
  console.log('\nDone.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
