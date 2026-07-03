/**
 * Seeds hierarchical service categories from the Contigo services document.
 * Idempotent: skips categories that already exist (matched by slug + type).
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/seed-categories.ts
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

let created = 0
let skipped = 0

async function upsertCategory(params: {
  name: string
  type: 'service' | 'project'
  parentId?: string | null
  description?: string | null
  orderIndex?: number
  isSystem?: boolean
}): Promise<string> {
  const slug = makeSlug(params.name)

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
    skipped++
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
    icon: null,
    orderIndex: params.orderIndex ?? 0,
    status: 'active',
    isSystem: params.isSystem ?? false,
    createdAt: now,
    updatedAt: now,
  })

  created++
  return id
}

const SERVICE_CATEGORIES: Array<{
  name: string
  description: string
  subServices: string[]
}> = [
  {
    name: 'New Home Building',
    description:
      "Building your future from the ground up. At Contigo Constructions, we don't just build houses; we create custom homes tailored to the unique South Australian landscape and your specific lifestyle. Our end-to-end management ensures your dream home is delivered on time, within budget, and without the stress of council complexities.",
    subServices: [
      'Approvals & Certifications',
      'Bricklaying & Cladding',
      'Carpentry',
      'Concreting & Footings',
      'Design & Drafting',
      'Electrical & Plumbing',
      'Engineering',
      'Excavation & Earthworks',
      'Framing (Timber or Steel)',
      'Landscaping',
      'Painting',
      'Render & Solid Plastering',
      'Roofing & Guttering',
      'Windows & Glazing',
    ],
  },
  {
    name: 'Home Extensions',
    description:
      'Expand your horizons without moving house. We specialize in seamless home extensions that feel like they have always been part of the original structure. From adding a sun-drenched living area to a complete second-storey addition, we handle the entire lifecycle from pre-construction planning to final handover.',
    subServices: [
      'Approvals & Certifications',
      'Carpentry',
      'Cladding',
      'Concreting',
      'Design & Drafting',
      'Electrical & Plumbing',
      'Engineering',
      'Framing (Timber or Steel)',
      'Gyprock Fixing & Flushing',
      'Painting',
      'Tiling',
      'Render & Solid Plastering',
      'Roofing',
    ],
  },
  {
    name: 'Home Renovations',
    description:
      'Elevate your everyday life. At Contigo Constructions, we transform kitchens, bathrooms, and laundries into high-performance spaces that add immediate value to your home. Our Adelaide-based team focuses on conceptual planning and space optimization, producing detailed drawings that ensure the construction phase is efficient and perfectly aligned with your vision.',
    subServices: [
      'Caulking',
      'Cladding',
      'Colour Consulting',
      'Concreting',
      'Demolition',
      'Electrical & Plumbing',
      'Grouting',
      'Gyprock Fixing & Flushing',
      'Painting',
      'Render & Solid Plastering',
      'Tiling',
      'Timber Framing',
      'Waterproofing',
    ],
  },
  {
    name: 'Carpentry',
    description:
      'Precision in every cut, soul in every finish. Our carpentry team brings structure and elegance together, working from detailed architectural drawings or helping you shape a custom brief. Whether it\'s high-performance outdoor decking or intricate interior skirting, we use materials specifically chosen to thrive in South Australian conditions.',
    subServices: [
      '1st Fix & 2nd Fix',
      'Architraves & Skirting',
      'Decking & Pergolas',
      'Eaves & Fencing',
      'General Repairs & Maintenance',
      'Interior & Exterior Doors',
      'Renovations & Extensions',
      'Shop Fitouts',
      'Staircases & Studwork',
      'Verandahs',
    ],
  },
  {
    name: 'Cladding',
    description:
      'The ultimate shield for your masterpiece. We install high-performance walling systems that ensure your home is weather-tight, thermally efficient, and visually striking. Our team coordinates every detail from substrate preparation to compliant fixings, using industry-leading systems like Hebel, Axon, and Weatherboard.',
    subServices: [
      'Axon',
      'Blueboard',
      'ExoTec Facade',
      'Foam',
      'Hebel',
      'Matrix',
      'Stria',
      'Weatherboard',
    ],
  },
  {
    name: 'Gyprock Fixing & Flushing',
    description:
      'Flawless surfaces, ready for the spotlight. We are specialists in high-speed, expert-led plasterboard installation for new builds and luxury renovations. From complex bulkheads and raked ceilings to fire-rated systems, our team ensures straight lines, tight joints, and perfectly smooth edges.',
    subServices: [
      'Acoustic & Suspended Ceilings',
      'Bulkheads & Pelmet Boxes',
      'Commercial & Retail Fitouts',
      'Fire-Rated Systems',
      'Garage & Shed Conversions',
      'Metal Stud & Track Framing',
      'Partition Walls',
      'Raked & Shadow Line Ceilings',
      'Residential Plasterboard Fixing',
      'Water-Resistant Boarding',
    ],
  },
  {
    name: 'Landscaping',
    description:
      "Living beyond the walls. Unlike many builders, Contigo Constructions views the garden as a core part of the architectural experience. We design and build outdoor spaces that thrive in Adelaide's climate, managing everything from concrete driveways and retaining walls to native drought-tolerant planting.",
    subServices: [
      'Concrete Paths & Driveways',
      'Decking',
      'Drainage',
      'Fencing',
      'Outdoor Kitchens',
      'Paving',
      'Retaining Walls',
      'Garden Borders',
      'Irrigation Systems',
      'Mulching',
      'Native & Drought Tolerant Planting',
      'Turf Supply & Laying',
    ],
  },
  {
    name: 'Internal & External Painting',
    description:
      'The final touch of perfection. We protect and beautify your investment with premium, long-lasting coating systems. Our meticulous preparation process—repairing, patching, and selecting the right primers—guarantees a sharp, even finish that looks great today and lasts for years, perfectly suited to the demanding South Australian sun.',
    subServices: [
      'ASU & PSU Sealers',
      'Gloss & Semi-Gloss Finishes',
      'Low Sheen & Matt Finishes',
      'Oil-Based & Water-Based Enamels',
      'Satin Finishes',
      'Professional Stain-Blockers',
    ],
  },
  {
    name: 'Render & Solid Plastering',
    description:
      'Durable elegance for every surface. Render and solid plastering are core capabilities at Contigo Constructions. We deliver clean, durable finishes for brick, blueboard, and Hebel. Whether you need a contemporary acrylic texture coat or a classic white set finish, we provide surfaces that are expertly prepared to handle local moisture and movement.',
    subServices: [
      'Acrylic Texture Coat',
      'Bagged Finish',
      'Float & Set',
      'Pebble Dash',
      'Sponge & Steel Trowel Finish',
      'Stucco & Tyrolean',
      'White Set',
    ],
  },
  {
    name: 'Venetian Plastering',
    description:
      'Luxury you can touch. At Contigo Constructions, we create seamless mineral finishes that transform walls, fireplaces, and benchtops into works of art. These highly durable, low-maintenance plasters are tailored to elevate any space, offering everything from matte organic textures to high-polish finishes that redefine interior luxury in Adelaide.',
    subServices: [
      'Grassello & Marmorino',
      'Micro Cement & Xbond',
      'Polished Plaster',
      'Split Stone',
      'Stuco Lava',
      'Tadelakt',
      'Travertino',
    ],
  },
]

async function main() {
  console.log('=== Seeding service categories ===\n')
  console.log(`Total root categories: ${SERVICE_CATEGORIES.length}`)
  const totalSubs = SERVICE_CATEGORIES.reduce((sum, c) => sum + c.subServices.length, 0)
  console.log(`Total sub-services: ${totalSubs}`)
  console.log(`Total to process: ${SERVICE_CATEGORIES.length + totalSubs}\n`)

  for (let i = 0; i < SERVICE_CATEGORIES.length; i++) {
    const { name, description, subServices } = SERVICE_CATEGORIES[i]
    console.log(`[${i + 1}/${SERVICE_CATEGORIES.length}] ${name}`)

    const parentId = await upsertCategory({
      name,
      type: 'service',
      description,
      orderIndex: i,
      isSystem: false,
    })

    for (let j = 0; j < subServices.length; j++) {
      const sub = subServices[j]
      await upsertCategory({
        name: sub,
        type: 'service',
        parentId,
        orderIndex: j,
      })
      process.stdout.write(`  ✓ ${sub}\n`)
    }

    console.log()
  }

  console.log('=== Summary ===')
  console.log(`Created: ${created}`)
  console.log(`Skipped (already exist): ${skipped}`)
  console.log(`Total processed: ${created + skipped}`)

  await client.end()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
