/**
 * Seeds hierarchical service categories from the Contigo services document.
 * Also tags existing project categories with type='project'.
 *
 * Usage: npx tsx scripts/seed-categories.ts
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
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function upsertCategory(params: {
  name: string
  type: 'service' | 'project'
  parentId?: string | null
  description?: string | null
  orderIndex?: number
  isSystem?: boolean
}): Promise<string> {
  const slug = makeSlug(params.name)

  // Check if it already exists (slug + type + parent match)
  const existing = await db
    .select()
    .from(schema.categories)
    .where(
      and(
        eq(schema.categories.slug, slug),
        eq(schema.categories.type, params.type),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    console.log(`  Skip (exists): ${params.name}`)
    return existing[0].id
  }

  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(schema.categories).values({
    id,
    name: params.name,
    slug,
    parentId: params.parentId ?? null,
    type: params.type,
    description: params.description ?? null,
    orderIndex: params.orderIndex ?? 0,
    isActive: true,
    isSystem: params.isSystem ?? false,
    createdAt: now,
    updatedAt: now,
  })

  console.log(`  Created: ${params.name} (${params.type})`)
  return id
}

const SERVICE_CATEGORIES: Array<{
  name: string
  subServices?: string[]
}> = [
  {
    name: 'New Home Building',
    subServices: [
      'Design & Planning Consultation',
      'Site Preparation & Earthworks',
      'Concreting (Slab, Footings, Driveways)',
      'Structural Framing',
      'Roof Construction',
      'External Cladding & Rendering',
      'Internal Fit-Out',
      'Carpentry & Joinery',
      'Gyprock Fixing & Flushing',
      'Painting',
      'Landscaping & Outdoor Areas',
    ],
  },
  {
    name: 'Home Extensions',
    subServices: [
      'Design & Planning Consultation',
      'Site Preparation',
      'Concreting',
      'Framing & Structural Work',
      'Roofing Integration',
      'Cladding & Rendering',
      'Internal Fit-Out',
      'Carpentry',
      'Gyprock',
      'Painting',
      'Landscaping Integration',
    ],
  },
  {
    name: 'Home Renovations',
    subServices: [
      'Kitchen Renovations',
      'Bathroom Renovations',
      'Laundry Renovations',
      'Bedroom & Living Area Updates',
      'Structural Alterations',
      'Window & Door Replacements',
      'Flooring',
      'Painting & Finishing',
    ],
  },
  {
    name: 'Carpentry',
    subServices: [
      'Custom Cabinetry & Joinery',
      'Door & Window Frames',
      'Decking & Pergola Structures',
      'Staircase Construction',
      'Skirting Boards, Architraves & Cornices',
      'Structural Carpentry',
      'Feature Walls & Decorative Timber Work',
    ],
  },
  {
    name: 'Cladding',
    subServices: [
      'Fiber Cement Cladding',
      'Timber Cladding',
      'Metal Cladding',
      'Composite Cladding',
      'Weatherboard',
      'Brick Veneer',
      'Cladding Repairs & Replacement',
    ],
  },
  {
    name: 'Gyprock Fixing & Flushing',
    subServices: [
      'Standard Wall & Ceiling Sheeting',
      'Curved & Feature Ceilings',
      'Bulkheads & Soffits',
      'Fire-Rated Lining Systems',
      'Acoustic Partition Systems',
      'Wet Area Sheeting',
      'Cornice Installation',
      'Stopping & Finishing (Levels 1–5)',
    ],
  },
  {
    name: 'Landscaping',
    subServices: [
      'Garden Design & Planning',
      'Lawn Installation & Turfing',
      'Retaining Walls',
      'Paths & Paving',
      'Pergolas & Outdoor Structures',
      'Irrigation Systems',
      'Planting & Garden Beds',
      'Drainage Solutions',
    ],
  },
  {
    name: 'Painting',
    subServices: [
      'Interior Painting',
      'Exterior Painting',
      'Feature Walls',
      'Texture Coating',
      'Epoxy Flooring',
      'Deck Staining & Sealing',
      'Commercial Painting',
    ],
  },
  {
    name: 'Render & Solid Plastering',
    subServices: [
      'Acrylic Render',
      'Cement Render',
      'Texture Coatings',
      'Bagging',
      'Solid Plastering (Internal)',
      'Foam Cornice & Decorative Details',
      'Repair & Patching',
    ],
  },
  {
    name: 'Venetian Plastering',
    subServices: [
      'Traditional Venetian Plaster',
      'Polished Plaster',
      'Marmorino',
      'Grassello',
      'Feature Wall Applications',
      'Restoration & Repair of Heritage Plasterwork',
    ],
  },
]

async function main() {
  console.log('Seeding service categories...\n')

  // Ensure existing project categories are tagged correctly
  console.log('Tagging existing project categories...')
  const projectSlugs = ['new-home', 'extension', 'renovation', 'commercial', 'restoration', 'uncategorized']
  for (const slug of projectSlugs) {
    await db
      .update(schema.categories)
      .set({ type: 'project', updatedAt: new Date() })
      .where(eq(schema.categories.slug, slug))
  }
  console.log('Done tagging project categories.\n')

  // Insert service categories
  for (let i = 0; i < SERVICE_CATEGORIES.length; i++) {
    const { name, subServices } = SERVICE_CATEGORIES[i]
    console.log(`[${i + 1}/${SERVICE_CATEGORIES.length}] ${name}`)

    const parentId = await upsertCategory({
      name,
      type: 'service',
      orderIndex: i,
    })

    if (subServices) {
      for (let j = 0; j < subServices.length; j++) {
        await upsertCategory({
          name: subServices[j],
          type: 'service',
          parentId,
          orderIndex: j,
        })
      }
    }
  }

  console.log('\nDone! Service categories seeded successfully.')
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
