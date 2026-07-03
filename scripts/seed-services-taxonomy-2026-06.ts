/**
 * Fase 1 — Migración de datos de la nueva taxonomía pública de servicios.
 *
 * Reemplaza el "Atelier Index" actual (9 disciplinas raíz) por 4 disciplinas
 * raíz: Carpentry, Cladding, Gyprock Fixing & Flushing, Additional Services.
 *
 * A diferencia de scripts/seed-categories.ts (crea-si-falta, nunca actualiza
 * una fila existente), este script SÍ actualiza parentId/orderIndex/isActive
 * en filas que ya existen — porque Carpentry/Cladding/Gyprock Fixing &
 * Flushing existen hoy como HIJOS anidados (bug de colisión de slugs en el
 * script original) y deben promoverse a raíz, y porque Demolition/Grouting/
 * Timber Framing existen hoy bajo Home Renovations y deben reparentarse a
 * Additional Services.
 *
 * Ver .superpowers/sdd/svc-taxonomy-task-1-brief.md para el detalle completo
 * de la auditoría y las decisiones de alcance.
 *
 * IMPORTANTE: este script NO debe ejecutarse contra la base de datos de
 * producción sin confirmación explícita del usuario. Verificar solo con
 * `npx tsc --noEmit`.
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/seed-services-taxonomy-2026-06.ts
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

// Placeholder images available today under /public/assets/service-*.jpg.
// Assigned at random per Fase 1 scope decision #3 (real per-service imagery
// is out of scope for this phase).
const PLACEHOLDER_IMAGES = [
  '/assets/service-carpentry.jpg',
  '/assets/service-cladding.jpg',
  '/assets/service-extension.jpg',
  '/assets/service-gyprock.jpg',
  '/assets/service-landscaping.jpg',
  '/assets/service-new-home.jpg',
  '/assets/service-painting.jpg',
  '/assets/service-plaster.jpg',
  '/assets/service-rendering.jpg',
  '/assets/service-renovation.jpg',
]

function randomPlaceholderImage(): string {
  return PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)]
}

let categoriesCreated = 0
let categoriesUpdated = 0
let categoriesUnchanged = 0
let servicesCreated = 0
let servicesUpdated = 0

/**
 * Upsert a category by slug+type. Unlike scripts/seed-categories.ts, this
 * DOES update parentId/orderIndex/status/description on an existing row —
 * required to promote Carpentry/Cladding/Gyprock Fixing & Flushing to root
 * and to reparent Demolition/Grouting/Timber Framing/Decking-split nodes.
 */
async function upsertCategory(params: {
  name: string
  type: 'service' | 'project'
  parentId: string | null
  description?: string | null
  orderIndex: number
  status: 'draft' | 'active' | 'inactive'
  isSystem?: boolean
}): Promise<string> {
  const slug = makeSlug(params.name)

  const existing = await db
    .select()
    .from(schema.categories)
    .where(and(eq(schema.categories.slug, slug), eq(schema.categories.type, params.type)))
    .limit(1)

  const now = new Date()

  if (existing.length > 0) {
    const row = existing[0]
    const needsUpdate =
      row.parentId !== params.parentId ||
      row.orderIndex !== params.orderIndex ||
      row.status !== params.status ||
      (params.description !== undefined && row.description !== params.description)

    if (needsUpdate) {
      await db
        .update(schema.categories)
        .set({
          parentId: params.parentId,
          orderIndex: params.orderIndex,
          status: params.status,
          ...(params.description !== undefined ? { description: params.description } : {}),
          updatedAt: now,
        })
        .where(eq(schema.categories.id, row.id))
      categoriesUpdated++
    } else {
      categoriesUnchanged++
    }

    return row.id
  }

  const id = crypto.randomUUID()
  await db.insert(schema.categories).values({
    id,
    name: params.name,
    slug,
    parentId: params.parentId,
    type: params.type,
    description: params.description ?? null,
    icon: null,
    orderIndex: params.orderIndex,
    status: params.status,
    isSystem: params.isSystem ?? false,
    createdAt: now,
    updatedAt: now,
  })

  categoriesCreated++
  return id
}

/** Deactivate a category by its known id (used for the 5 obsolete roots). */
async function deactivateCategoryById(id: string): Promise<void> {
  const rows = await db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1)
  if (rows.length === 0) {
    console.warn(`  ! Category id ${id} not found — skipping deactivation`)
    return
  }
  if (rows[0].status === 'active') {
    await db
      .update(schema.categories)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(schema.categories.id, id))
    categoriesUpdated++
  } else {
    categoriesUnchanged++
  }
}

/** Deactivate a category by slug+type (used for sub-items not in the new catalogue). */
async function deactivateCategoryBySlug(name: string, type: 'service' | 'project'): Promise<void> {
  const slug = makeSlug(name)
  const rows = await db
    .select()
    .from(schema.categories)
    .where(and(eq(schema.categories.slug, slug), eq(schema.categories.type, type)))
    .limit(1)
  if (rows.length === 0) {
    console.warn(`  ! Category "${name}" (slug ${slug}) not found — skipping deactivation`)
    return
  }
  if (rows[0].status === 'active') {
    await db
      .update(schema.categories)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(schema.categories.id, rows[0].id))
    categoriesUpdated++
  } else {
    categoriesUnchanged++
  }
}

/** Upsert a service leaf by slug. Generates a unique slug via makeSlug(name). */
async function upsertService(params: {
  name: string
  shortDescription: string
  fullDescription: string
  categoryId: string
  orderIndex: number
}): Promise<string> {
  const slug = makeSlug(params.name)

  const existing = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.slug, slug))
    .limit(1)

  const now = new Date()

  if (existing.length > 0) {
    const row = existing[0]
    await db
      .update(schema.services)
      .set({
        name: params.name,
        shortDescription: params.shortDescription,
        fullDescription: params.fullDescription,
        categoryId: params.categoryId,
        orderIndex: params.orderIndex,
        // imageUrl intentionally left untouched on update so a re-run does
        // not reshuffle an already-assigned placeholder image.
        updatedAt: now,
      })
      .where(eq(schema.services.id, row.id))
    servicesUpdated++
    return row.id
  }

  const id = crypto.randomUUID()
  await db.insert(schema.services).values({
    id,
    slug,
    name: params.name,
    shortDescription: params.shortDescription,
    fullDescription: params.fullDescription,
    imageUrl: randomPlaceholderImage(),
    posterUrl: null,
    galleryItems: [],
    orderIndex: params.orderIndex,
    categoryId: params.categoryId,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  })

  servicesCreated++
  return id
}

// ============ CATÁLOGO (verbatim del brief, inglés AU) ============

type ServiceItem = {
  name: string
  shortDescription: string
  fullDescription: string
}

const CARPENTRY_ITEMS: ServiceItem[] = [
  {
    name: '1st Fix & 2nd Fix',
    shortDescription:
      'Structural framing through to final trims — the two-stage carpentry sequence that shapes every build.',
    fullDescription:
      'First fix lays down the structural bones of a build — framing, flooring and roof carpentry — before walls close in. Second fix follows after plastering, fitting skirting, architraves, doors and cabinetry to a precise, paint-ready finish. We sequence both stages tightly with the rest of the trades, so nothing is rushed and nothing is redone.',
  },
  {
    name: 'Architraves & Skirting',
    shortDescription:
      'Crisp, true-line trims that frame doors, windows and floors with a tailored finish.',
    fullDescription:
      'Architraves and skirting are the quiet detail that makes a room feel finished. We mitre, scribe and fix every length by hand, in profiles to match heritage detailing or clean contemporary lines, for a result that reads as seamless from every angle.',
  },
  {
    name: 'Deck',
    shortDescription:
      'Outdoor decking built to handle the South Australian sun, engineered to last for decades.',
    fullDescription:
      'From a simple entertaining platform to a multi-level timber deck, we engineer the substructure for real load and weather exposure before a single board is laid. Hardwood, composite or treated pine — detailed with hidden fixings and proper drainage falls so it stays solid for decades.',
  },
  {
    name: 'Pergola',
    shortDescription:
      'Custom pergolas that extend your living space outdoors, built to council-compliant standard.',
    fullDescription:
      "A pergola should earn its place in the garden, not just sit in it. We design and build to suit the orientation of your block — open rafters for dappled light, or a fully battened roof for shade — with engineering and approvals handled end to end.",
  },
  {
    name: 'Eaves & Fencing',
    shortDescription:
      "Weatherproof eaves detailing and boundary fencing, finished to match the rest of the home.",
    fullDescription:
      "Eaves protect a home's envelope from wind-driven rain and pests, and we detail them to seal properly the first time. Our fencing work covers boundary, paling and feature fencing, built plumb and true and finished to sit comfortably alongside the main build.",
  },
  {
    name: 'General Repairs & Maintenance',
    shortDescription:
      'Responsive carpentry repairs — sticking doors, rotten boards, loose joinery — fixed properly, not patched.',
    fullDescription:
      "Not every job is a renovation. Our maintenance carpentry covers the everyday wear of an older or busy home: doors that stick, timber that's rotted, joinery that's come loose. We diagnose the actual cause before we fix it, so the repair holds.",
  },
  {
    name: 'Interior & Exterior Doors',
    shortDescription:
      'Supply and installation of interior and exterior doors, hung true and sealed for performance.',
    fullDescription:
      "A door that's hung even slightly out of square will fight you every day. We install interior and exterior doors — hinged, sliding or cavity — checking frame, level and clearances before fixing, and finish with hardware that operates smoothly from day one.",
  },
  {
    name: 'Renovations & Extensions',
    shortDescription:
      'Carpentry for renovations and extensions, matched seamlessly to the existing structure.',
    fullDescription:
      "Tying new carpentry into an existing home is the hardest kind of joinery — nothing is ever quite standard. We match existing profiles, ceiling heights and structural lines so an extension reads as original, not added on.",
  },
  {
    name: 'Shop Fitouts',
    shortDescription:
      'Commercial fitout carpentry built for durability, fast turnaround and council compliance.',
    fullDescription:
      'Retail and hospitality fitouts run on tight deadlines and even tighter durability requirements. Our shop fitout carpentry covers framing, joinery and fixtures built to commercial standard, programmed to get a tenancy trading on schedule.',
  },
  {
    name: 'Staircases & Studwork',
    shortDescription:
      'Structural studwork and staircases built to engineered specification, from frame to final tread.',
    fullDescription:
      'Staircases carry both structural load and visual weight in a home, so we build them to engineered specification from the stringers up. Our studwork framing follows the same discipline — true, plumb and ready for the trades that follow.',
  },
  {
    name: 'Verandahs',
    shortDescription:
      "Verandahs that extend a home's street presence and outdoor living, built to match its character.",
    fullDescription:
      'A verandah sets the tone for a home before you even reach the front door. We build to match existing roof lines and period detailing where it counts, or design a clean contemporary verandah for a newer build — engineered, council-approved and built to last.',
  },
]

const CLADDING_ITEMS: ServiceItem[] = [
  {
    name: 'Axon',
    shortDescription:
      'Vertically-jointed Axon cladding panels, fixed for a sharp, linear façade finish.',
    fullDescription:
      'Axon panel cladding gives a façade crisp, consistent vertical lines with minimal visible jointing. We fix to manufacturer specification over a properly prepared frame, so the finish stays straight and weather-tight for the life of the building.',
  },
  {
    name: 'Blueboard',
    shortDescription:
      'Blueboard base sheeting for rendered façades, fixed and jointed to a true, render-ready surface.',
    fullDescription:
      "Blueboard is the substrate behind many of Adelaide's rendered façades, and getting the fixing and jointing right underneath is what stops cracking later. We install to a flat, true plane so the render coat over the top performs as it should.",
  },
  {
    name: 'Hebel',
    shortDescription:
      'Hebel PowerPanel cladding installation — lightweight, fire-rated and thermally efficient.',
    fullDescription:
      'Hebel PowerPanel gives a home the thermal and acoustic performance of masonry at a fraction of the weight. We install to engineered fixing patterns and seal every joint correctly, so the panel performs as designed against weather and fire.',
  },
  {
    name: 'Weatherboard',
    shortDescription:
      'Timber and composite weatherboard cladding, fixed with consistent reveals for a classic finish.',
    fullDescription:
      'Weatherboard remains one of the most enduring looks for an Adelaide home, and the finish lives or dies on consistent reveals and tight end-joints. We fix in timber or low-maintenance composite, detailed properly around openings and corners.',
  },
]

const GYPROCK_ITEMS: ServiceItem[] = [
  {
    name: 'Acoustic & Suspended Ceilings',
    shortDescription:
      'Suspended ceiling systems with acoustic-rated plasterboard for sound control between levels and rooms.',
    fullDescription:
      'Suspended grid and acoustic plasterboard ceilings reduce noise transfer between rooms and levels while concealing services cleanly above. We install to the specified acoustic rating, with true, level lines across the whole ceiling plane.',
  },
  {
    name: 'Bulkheads & Pelmet Boxes',
    shortDescription:
      'Custom bulkheads and pelmet boxes, framed and sheeted for sharp, geometric ceiling lines.',
    fullDescription:
      'Bulkheads and pelmet boxes hide services and create clean architectural lines at the same time. We frame to the exact geometry in the drawings, then sheet and finish to a crisp, shadow-free result that reads as deliberate, not boxed-in.',
  },
  {
    name: 'Residential Plasterboard Fixing',
    shortDescription:
      'Full plasterboard fixing for new builds and renovations, with tight joints and a smooth finish.',
    fullDescription:
      "Plasterboard fixing sets the standard for every wall and ceiling that follows it — paint, tiling, render all show its flaws if it's rushed. We fix, set and sand to a smooth, true finish across new builds and renovation work alike.",
  },
  {
    name: 'Water-Resistant Boarding',
    shortDescription:
      'Water-resistant plasterboard for bathrooms, laundries and wet areas, fixed to waterproofing standard.',
    fullDescription:
      'Wet areas need a board that can handle moisture without breaking down, fixed in a way that supports the waterproofing membrane that follows. We install WR boarding to manufacturer and Australian Standard requirements in every bathroom and laundry we fit out.',
  },
]

const ADDITIONAL_SERVICES_ITEMS: ServiceItem[] = [
  {
    name: 'Design & Drafting',
    shortDescription:
      'Concept design and construction drawings, prepared in-house to keep your project moving.',
    fullDescription:
      'Every build starts with a drawing that actually works on site. Our design and drafting service takes a brief from concept through to construction-ready documentation, coordinated with engineering and council requirements from the outset.',
  },
  {
    name: 'Electrical & Plumbing',
    shortDescription:
      'Licensed electrical and plumbing trades, coordinated as part of the full build program.',
    fullDescription:
      'We work with licensed electrical and plumbing contractors who know our standards and our schedule, so rough-in and fit-off happen exactly when the build needs them — no waiting, no clashing with other trades.',
  },
  {
    name: 'Engineering',
    shortDescription:
      'Structural engineering for footings, framing and load-bearing work, sized correctly the first time.',
    fullDescription:
      'Underbuilt structure is a liability and overbuilt structure is wasted budget. We engage structural engineers early to size footings, beams and framing correctly for the site and the load, with documentation council can approve without delay.',
  },
  {
    name: 'Painting',
    shortDescription:
      'Interior and exterior painting with proper preparation, for a finish that lasts.',
    fullDescription:
      'Paint only looks as good as the surface beneath it. Our painting work includes the preparation most quotes skip — filling, sanding and priming — before a premium coating system goes on, inside and out.',
  },
  {
    name: 'Roofing & Guttering',
    shortDescription:
      'Roofing and guttering installation and repair, detailed to shed South Australian storms properly.',
    fullDescription:
      'A roof only has one job — keep the weather out — and the detailing around penetrations, valleys and gutters is where that usually fails. We install and repair roofing and guttering to a standard that holds up to Adelaide\'s storm season.',
  },
  {
    name: 'Windows & Glazing',
    shortDescription:
      'Window and glazing supply and installation, sealed and flashed to manufacturer specification.',
    fullDescription:
      "Windows are one of the most common sources of water ingress when they're flashed incorrectly. We supply and install windows and glazing with proper sealing and flashing detail, so the opening performs as well as the glass itself.",
  },
  {
    name: 'Landscaping',
    shortDescription:
      "Hard and soft landscaping that extends your home's design into the garden.",
    fullDescription:
      "We treat the garden as part of the build, not an afterthought — paving, retaining walls, turf and planting designed to suit Adelaide's climate and to sit naturally alongside the architecture of the home.",
  },
  {
    name: 'Bathroom Renovation',
    shortDescription:
      'Full bathroom renovations, from waterproofing and tiling through to the final fitout.',
    fullDescription:
      'A bathroom renovation has more failure points per square metre than almost any other room. We manage the full sequence — demolition, waterproofing, tiling, plumbing and fitout — so every layer is right before the next one goes on.',
  },
  {
    name: 'Demolition',
    shortDescription:
      'Selective and full demolition, carried out safely and cleared ready for the next trade.',
    fullDescription:
      "Whether it's a single wall or a full strip-out, demolition is sequenced to protect what stays standing and to keep the site safe. We clear and dispose of waste properly, leaving the space ready for the trades that follow.",
  },
  {
    name: 'Grouting',
    shortDescription:
      'Tile grouting and re-grouting, finished for a clean, consistent line and long-term water resistance.',
    fullDescription:
      "Grout lines are a small detail with a big impact on how a tiled surface ages. We grout to a consistent width and depth, in a product suited to the area's moisture exposure, so the finish stays clean and water-resistant.",
  },
  {
    name: 'Timber Framing',
    shortDescription:
      'Timber wall and roof framing, built square and true to engineered specification.',
    fullDescription:
      'Framing sets the accuracy for every trade that follows it. We build timber wall and roof frames to engineered specification, checked for square and level before sheeting begins, so the rest of the build goes together cleanly.',
  },
]

// ============ IDs ya confirmados por la auditoría Fase 0 ============

const CARPENTRY_ID = '47e61c41-8e52-4611-8732-5fa0d29d50ce'
const CLADDING_ID = '420cf748-f716-4829-b894-951255f108fa'
const GYPROCK_ID = '538196a2-dba0-4ba1-abac-2ababebd4241'

const OBSOLETE_ROOT_IDS_TO_DEACTIVATE = [
  '5f12afef-725f-4112-8ab1-8a503c9b9025', // new-home-building (ya isActive=false, no-op)
  '5c0213d0-ad99-4316-838b-76bd4094ea07', // home-extensions
  'eed9bd48-4d53-40bd-a4ad-8a82ab5f9c39', // home-renovations
  'e91d1398-f2b9-4767-93b3-04bf95aa6b38', // internal-external-painting
  '63537e45-82c2-46ce-a5d3-d1d91cde6929', // venetian-plastering
]

// Sub-items existentes a desactivar porque no están en el catálogo nuevo.
const CLADDING_SUBITEMS_TO_DEACTIVATE = ['ExoTec Facade', 'Foam', 'Matrix', 'Stria']
const GYPROCK_SUBITEMS_TO_DEACTIVATE = [
  'Commercial & Retail Fitouts',
  'Fire-Rated Systems',
  'Garage & Shed Conversions',
  'Metal Stud & Track Framing',
  'Partition Walls',
  'Raked & Shadow Line Ceilings',
]

async function main() {
  console.log('=== Fase 1: Seeding new services taxonomy ===\n')

  // --- Paso 1: promover Carpentry / Cladding / Gyprock a root ---
  console.log('[1/7] Promoting Carpentry/Cladding/Gyprock Fixing & Flushing to root...')
  const carpentryId = await upsertCategory({
    name: 'Carpentry',
    type: 'service',
    parentId: null,
    description:
      'Decking, pergolas, staircases and fine interior joinery, in timber chosen to thrive in South Australian conditions.',
    orderIndex: 0,
    status: 'active',
  })
  const claddingId = await upsertCategory({
    name: 'Cladding',
    type: 'service',
    parentId: null,
    description:
      'Weather-tight, thermally sharp and visually striking, with Hebel, Axon and Weatherboard detailed to the millimetre.',
    orderIndex: 1,
    status: 'active',
  })
  const gyprockId = await upsertCategory({
    name: 'Gyprock Fixing & Flushing',
    type: 'service',
    parentId: null,
    description:
      'Expert plasterboard for new builds and luxury renovations: raked ceilings, bulkheads and fire-rated systems with tight, true lines.',
    orderIndex: 2,
    status: 'active',
  })

  if (carpentryId !== CARPENTRY_ID) {
    console.warn(`  ! Carpentry resolved id ${carpentryId} differs from audited id ${CARPENTRY_ID}`)
  }
  if (claddingId !== CLADDING_ID) {
    console.warn(`  ! Cladding resolved id ${claddingId} differs from audited id ${CLADDING_ID}`)
  }
  if (gyprockId !== GYPROCK_ID) {
    console.warn(`  ! Gyprock resolved id ${gyprockId} differs from audited id ${GYPROCK_ID}`)
  }

  // --- Paso 2: crear root Additional Services ---
  console.log('[2/7] Creating root "Additional Services"...')
  const additionalServicesId = await upsertCategory({
    name: 'Additional Services',
    type: 'service',
    parentId: null,
    description:
      'From design and engineering to the final coat of paint, the specialist trades that complete a Contigo build — coordinated, vetted and held to the same standard as our core craft.',
    orderIndex: 3,
    status: 'active',
  })

  // --- Paso 3: Carpentry sub-items (caso especial Decking & Pergolas) ---
  console.log('[3/7] Upserting Carpentry leaf categories (incl. Deck/Pergola split)...')
  await deactivateCategoryBySlug('Decking & Pergolas', 'service')
  console.log('  - Decking & Pergolas deactivated (split into Deck + Pergola)')

  const carpentryLeafIds: Record<string, string> = {}
  for (let i = 0; i < CARPENTRY_ITEMS.length; i++) {
    const item = CARPENTRY_ITEMS[i]
    const leafId = await upsertCategory({
      name: item.name,
      type: 'service',
      parentId: carpentryId,
      orderIndex: i,
      status: 'active',
    })
    carpentryLeafIds[item.name] = leafId
    console.log(`  - ${item.name}`)
  }
  // Eaves & Fencing existed as isActive=false; upsertCategory above already
  // forces isActive=true for every catalogue item, so it is reactivated here.

  // --- Paso 4: Cladding sub-items ---
  console.log('[4/7] Upserting Cladding leaf categories...')
  const claddingLeafIds: Record<string, string> = {}
  for (let i = 0; i < CLADDING_ITEMS.length; i++) {
    const item = CLADDING_ITEMS[i]
    const leafId = await upsertCategory({
      name: item.name,
      type: 'service',
      parentId: claddingId,
      orderIndex: i,
      status: 'active',
    })
    claddingLeafIds[item.name] = leafId
    console.log(`  - ${item.name}`)
  }
  for (const name of CLADDING_SUBITEMS_TO_DEACTIVATE) {
    await deactivateCategoryBySlug(name, 'service')
    console.log(`  - ${name} deactivated (not in new catalogue)`)
  }

  // --- Paso 5: Gyprock Fixing & Flushing sub-items ---
  console.log('[5/7] Upserting Gyprock Fixing & Flushing leaf categories...')
  const gyprockLeafIds: Record<string, string> = {}
  for (let i = 0; i < GYPROCK_ITEMS.length; i++) {
    const item = GYPROCK_ITEMS[i]
    const leafId = await upsertCategory({
      name: item.name,
      type: 'service',
      parentId: gyprockId,
      orderIndex: i,
      status: 'active',
    })
    gyprockLeafIds[item.name] = leafId
    console.log(`  - ${item.name}`)
  }
  for (const name of GYPROCK_SUBITEMS_TO_DEACTIVATE) {
    await deactivateCategoryBySlug(name, 'service')
    console.log(`  - ${name} deactivated (not in new catalogue)`)
  }

  // --- Paso 6: Additional Services sub-items (incl. reparenting de los 3 huérfanos) ---
  console.log('[6/7] Upserting Additional Services leaf categories (incl. reparenting)...')
  const additionalServicesLeafIds: Record<string, string> = {}
  for (let i = 0; i < ADDITIONAL_SERVICES_ITEMS.length; i++) {
    const item = ADDITIONAL_SERVICES_ITEMS[i]
    // Demolition, Grouting and Timber Framing already exist as children of
    // home-renovations — upsertCategory matches by slug+type regardless of
    // current parent, so this call reparents them to Additional Services
    // instead of creating duplicates.
    const leafId = await upsertCategory({
      name: item.name,
      type: 'service',
      parentId: additionalServicesId,
      orderIndex: i,
      status: 'active',
    })
    additionalServicesLeafIds[item.name] = leafId
    console.log(`  - ${item.name}`)
  }

  // --- Paso 7: desactivar roots obsoletos ---
  console.log('[7/7] Deactivating obsolete root categories...')
  for (const id of OBSOLETE_ROOT_IDS_TO_DEACTIVATE) {
    await deactivateCategoryById(id)
  }
  console.log(`  - Deactivated ${OBSOLETE_ROOT_IDS_TO_DEACTIVATE.length} obsolete roots`)

  // --- Servicios: insertar una fila por cada uno de los 30 sub-ítems ---
  console.log('\n=== Seeding services table (30 leaf service cards) ===\n')

  const allGroups: Array<{ items: ServiceItem[]; leafIds: Record<string, string> }> = [
    { items: CARPENTRY_ITEMS, leafIds: carpentryLeafIds },
    { items: CLADDING_ITEMS, leafIds: claddingLeafIds },
    { items: GYPROCK_ITEMS, leafIds: gyprockLeafIds },
    { items: ADDITIONAL_SERVICES_ITEMS, leafIds: additionalServicesLeafIds },
  ]

  for (const group of allGroups) {
    for (let i = 0; i < group.items.length; i++) {
      const item = group.items[i]
      const categoryId = group.leafIds[item.name]
      await upsertService({
        name: item.name,
        shortDescription: item.shortDescription,
        fullDescription: item.fullDescription,
        categoryId,
        orderIndex: i,
      })
      console.log(`  ✓ ${item.name}`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Categories created: ${categoriesCreated}`)
  console.log(`Categories updated: ${categoriesUpdated}`)
  console.log(`Categories unchanged: ${categoriesUnchanged}`)
  console.log(`Services created: ${servicesCreated}`)
  console.log(`Services updated: ${servicesUpdated}`)

  await client.end()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
