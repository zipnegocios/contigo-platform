/**
 * Fase 3 — Asignación de íconos SVG a las 30 categorías hoja de la nueva
 * taxonomía pública de servicios.
 *
 * Fase 1 creó las 30 categorías hoja (Carpentry/Cladding/Gyprock Fixing &
 * Flushing/Additional Services) con `icon: null`. Fase 3 dibujó los 28
 * glifos nuevos en `src/presentation/components/ServiceIcons.tsx` (más 2
 * reusados — `painting` y `landscaping`, que ya existían para el mismo
 * concepto). Este script asigna el `icon` key correspondiente a cada una
 * de las 30 filas, por slug+type.
 *
 * Ver .superpowers/sdd/svc-taxonomy-task-3-brief.md para la tabla de mapeo
 * completa (fuente de verdad) y el detalle de la corrección de viewBox.
 *
 * IMPORTANTE: este script NO debe ejecutarse contra la base de datos de
 * producción sin confirmación explícita del usuario. Verificar solo con
 * `npx tsc --noEmit`.
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/assign-service-icons-2026-06.ts
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and } from 'drizzle-orm'
import * as schema from '../src/infrastructure/db/schema'

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[™®©]/g, '')
    .replace(/\s*&\s*/g, '-')
    .replace(/[/\\]/g, '-')
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ============ Mapeo icon key -> nombre de categoría (= services.name) ============
// Fuente de verdad: tabla del brief Fase 3. 30 filas: 28 íconos nuevos +
// 2 reusados (painting, landscaping) — ambos ya existían en ICONS antes de
// esta fase, para el mismo concepto real.

type IconAssignment = {
  iconKey: string
  categoryName: string
  root: string
}

const ICON_ASSIGNMENTS: IconAssignment[] = [
  // Carpentry (11)
  { iconKey: '1st-2nd-fix', categoryName: '1st Fix & 2nd Fix', root: 'Carpentry' },
  { iconKey: 'architraves-skirting', categoryName: 'Architraves & Skirting', root: 'Carpentry' },
  { iconKey: 'deck', categoryName: 'Deck', root: 'Carpentry' },
  { iconKey: 'pergola', categoryName: 'Pergola', root: 'Carpentry' },
  { iconKey: 'eaves-fencing', categoryName: 'Eaves & Fencing', root: 'Carpentry' },
  { iconKey: 'general-repairs', categoryName: 'General Repairs & Maintenance', root: 'Carpentry' },
  { iconKey: 'interior-exterior-doors', categoryName: 'Interior & Exterior Doors', root: 'Carpentry' },
  { iconKey: 'renovations-extensions', categoryName: 'Renovations & Extensions', root: 'Carpentry' },
  { iconKey: 'shop-fitouts', categoryName: 'Shop Fitouts', root: 'Carpentry' },
  { iconKey: 'staircases-studwork', categoryName: 'Staircases & Studwork', root: 'Carpentry' },
  { iconKey: 'verandahs', categoryName: 'Verandahs', root: 'Carpentry' },

  // Cladding (4)
  { iconKey: 'axon', categoryName: 'Axon', root: 'Cladding' },
  { iconKey: 'blueboard', categoryName: 'Blueboard', root: 'Cladding' },
  { iconKey: 'hebel', categoryName: 'Hebel', root: 'Cladding' },
  { iconKey: 'weatherboard', categoryName: 'Weatherboard', root: 'Cladding' },

  // Gyprock Fixing & Flushing (4)
  { iconKey: 'acoustic-ceilings', categoryName: 'Acoustic & Suspended Ceilings', root: 'Gyprock Fixing & Flushing' },
  { iconKey: 'bulkheads-pelmet', categoryName: 'Bulkheads & Pelmet Boxes', root: 'Gyprock Fixing & Flushing' },
  {
    iconKey: 'plasterboard-fixing',
    categoryName: 'Residential Plasterboard Fixing',
    root: 'Gyprock Fixing & Flushing',
  },
  {
    iconKey: 'water-resistant-boarding',
    categoryName: 'Water-Resistant Boarding',
    root: 'Gyprock Fixing & Flushing',
  },

  // Additional Services (11, incl. 2 reused keys)
  { iconKey: 'design-drafting', categoryName: 'Design & Drafting', root: 'Additional Services' },
  { iconKey: 'electrical-plumbing', categoryName: 'Electrical & Plumbing', root: 'Additional Services' },
  { iconKey: 'engineering', categoryName: 'Engineering', root: 'Additional Services' },
  { iconKey: 'painting', categoryName: 'Painting', root: 'Additional Services' }, // REUSADO
  { iconKey: 'roofing-guttering', categoryName: 'Roofing & Guttering', root: 'Additional Services' },
  { iconKey: 'windows-glazing', categoryName: 'Windows & Glazing', root: 'Additional Services' },
  { iconKey: 'landscaping', categoryName: 'Landscaping', root: 'Additional Services' }, // REUSADO
  { iconKey: 'bathroom-renovation', categoryName: 'Bathroom Renovation', root: 'Additional Services' },
  { iconKey: 'demolition', categoryName: 'Demolition', root: 'Additional Services' },
  { iconKey: 'grouting', categoryName: 'Grouting', root: 'Additional Services' },
  { iconKey: 'timber-framing', categoryName: 'Timber Framing', root: 'Additional Services' },
]

let updatedCount = 0
let unchangedCount = 0
let notFoundCount = 0
const notFoundNames: string[] = []

/**
 * Idempotent: sets categories.icon for the leaf category matching
 * slug(name)+type='service'. No-ops if the icon is already set to the same
 * value. Does not touch rows it can't find — logs them instead of throwing,
 * so a partial taxonomy state (e.g. re-run before Fase 1 fully lands) does
 * not abort the whole batch.
 */
async function assignIcon(assignment: IconAssignment): Promise<void> {
  const slug = makeSlug(assignment.categoryName)

  const existing = await db
    .select()
    .from(schema.categories)
    .where(and(eq(schema.categories.slug, slug), eq(schema.categories.type, 'service')))
    .limit(1)

  if (existing.length === 0) {
    notFoundCount++
    notFoundNames.push(`${assignment.categoryName} (slug: ${slug})`)
    console.warn(`  ! Not found: "${assignment.categoryName}" (slug ${slug}) — skipping`)
    return
  }

  const row = existing[0]
  if (row.icon === assignment.iconKey) {
    unchangedCount++
    console.log(`  = ${assignment.categoryName} already has icon "${assignment.iconKey}"`)
    return
  }

  await db
    .update(schema.categories)
    .set({ icon: assignment.iconKey, updatedAt: new Date() })
    .where(eq(schema.categories.id, row.id))

  updatedCount++
  console.log(`  ✓ ${assignment.categoryName} -> icon "${assignment.iconKey}"`)
}

async function main() {
  console.log('=== Fase 3: Assigning service icons (30 leaf categories) ===\n')

  if (ICON_ASSIGNMENTS.length !== 30) {
    throw new Error(`Expected exactly 30 icon assignments, got ${ICON_ASSIGNMENTS.length}`)
  }

  for (const assignment of ICON_ASSIGNMENTS) {
    await assignIcon(assignment)
  }

  console.log('\n=== Summary ===')
  console.log(`Total assignments in mapping table: ${ICON_ASSIGNMENTS.length}`)
  console.log(`Updated: ${updatedCount}`)
  console.log(`Unchanged (already correct): ${unchangedCount}`)
  console.log(`Not found: ${notFoundCount}`)
  if (notFoundNames.length > 0) {
    console.log('Not found list:')
    for (const name of notFoundNames) {
      console.log(`  - ${name}`)
    }
  }

  await client.end()
}

main().catch((err) => {
  console.error('Icon assignment failed:', err)
  process.exit(1)
})
