/**
 * Fase 2 — Unificación de tipos de categoría: service + project → shared
 *
 * Las 4 categorías raíz (Carpentry, Cladding, Gyprock Fixing & Flushing,
 * Additional Services) pasan de type='service' a type='shared', lo que las
 * hace disponibles para AMBOS contextos: servicios y proyectos.
 *
 * También desactiva las categorías raíz de tipo 'project' heredadas del seed
 * original (new-home-building, home-extensions, home-renovations,
 * internal-external-painting, venetian-plastering) ya que quedan obsoletas.
 *
 * Idempotente: puede re-ejecutarse sin efectos secundarios.
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/unify-category-types-2026-06.ts
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and, inArray, isNull } from 'drizzle-orm'
import * as schema from '../src/infrastructure/db/schema'

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

const SHARED_ROOT_SLUGS = [
  'carpentry',
  'cladding',
  'gyprock-fixing-flushing',
  'additional-services',
]

const LEGACY_PROJECT_ROOT_SLUGS = [
  'new-home-building',
  'home-extensions',
  'home-renovations',
  'internal-external-painting',
  'venetian-plastering',
]

async function run() {
  console.log('=== Unify category types: service+project → shared ===\n')

  // 1. Promote 4 root service categories to type='shared'
  const promoted = await db
    .update(schema.categories)
    .set({ type: 'shared', updatedAt: new Date() })
    .where(
      and(
        inArray(schema.categories.slug, SHARED_ROOT_SLUGS),
        isNull(schema.categories.parentId),
      )
    )
    .returning({ slug: schema.categories.slug, type: schema.categories.type })

  console.log(`Promoted ${promoted.length} categories to type='shared':`)
  promoted.forEach((c) => console.log(`  ✓ ${c.slug} → ${c.type}`))

  // 2. Deactivate legacy project-type root categories
  const deactivated = await db
    .update(schema.categories)
    .set({ status: 'inactive', updatedAt: new Date() })
    .where(
      and(
        inArray(schema.categories.slug, LEGACY_PROJECT_ROOT_SLUGS),
        isNull(schema.categories.parentId),
        eq(schema.categories.type, 'project'),
      )
    )
    .returning({ slug: schema.categories.slug })

  if (deactivated.length > 0) {
    console.log(`\nDeactivated ${deactivated.length} legacy project roots:`)
    deactivated.forEach((c) => console.log(`  ✗ ${c.slug}`))
  } else {
    console.log('\nNo legacy project roots found to deactivate (already done or never existed).')
  }

  console.log('\nDone.')
  await client.end()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
