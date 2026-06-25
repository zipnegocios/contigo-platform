/**
 * Presentation-layer metadata for the `/services/[category]` taxonomy
 * (Fase 4 of the services restructure).
 *
 * The DB `categories` table (type='service') owns structure: names, slugs,
 * ordering, `isActive`, and the root `description` field (which holds the
 * catalogue's "Support" sub-headline text, not a tagline). This file owns
 * two things the DB does not carry yet:
 *
 * 1. The 4 root category taglines (evocative one-liners, Cormorant display).
 * 2. A static fallback catalogue (name + shortDescription + icon key) for
 *    all 30 leaf services, used ONLY when `DATABASE_URL` is unset or the
 *    query throws — same resilience pattern as the previous
 *    `app/(portfolio)/services/page.tsx`. This fallback intentionally
 *    omits `fullDescription` (that belongs to the real Ficha de Servicio,
 *    Fase 5) and has no real `published` flag — fallback items never show
 *    a "View full details" button.
 *
 * Do NOT confuse this with `serviceMeta.ts` (old 10-discipline taxonomy,
 * used by the legacy `ServicesIndex.tsx` carousel) — unrelated, untouched.
 */

/** The 4 root service categories, in display order. */
export const SERVICE_ROOT_SLUGS = [
  'carpentry',
  'cladding',
  'gyprock-fixing-flushing',
  'additional-services',
] as const

export type ServiceRootSlug = (typeof SERVICE_ROOT_SLUGS)[number]

/** Evocative one-liner per root category (Cormorant display, under the name). */
export const SERVICE_ROOT_TAGLINES: Record<ServiceRootSlug, string> = {
  carpentry: 'Precision in every cut, soul in every finish.',
  cladding: 'The shield your home wears well.',
  'gyprock-fixing-flushing': 'Flawless surfaces, ready for the spotlight.',
  'additional-services': 'Every trade your project needs, under one roof.',
}

export interface ServiceFallbackItem {
  slug: string
  name: string
  shortDescription: string
  iconKey: string
}

/**
 * Static fallback catalogue, keyed by root category slug. Verbatim copy of
 * the Fase 1 seed text — do not reword. Order matches `orderIndex` in the DB.
 */
export const SERVICE_FALLBACK_CATALOGUE: Record<ServiceRootSlug, ServiceFallbackItem[]> = {
  carpentry: [
    {
      slug: '1st-2nd-fix',
      name: '1st Fix & 2nd Fix',
      shortDescription:
        'Structural framing through to final trims — the two-stage carpentry sequence that shapes every build.',
      iconKey: '1st-2nd-fix',
    },
    {
      slug: 'architraves-skirting',
      name: 'Architraves & Skirting',
      shortDescription:
        'Crisp, true-line trims that frame doors, windows and floors with a tailored finish.',
      iconKey: 'architraves-skirting',
    },
    {
      slug: 'deck',
      name: 'Deck',
      shortDescription:
        'Outdoor decking built to handle the South Australian sun, engineered to last for decades.',
      iconKey: 'deck',
    },
    {
      slug: 'pergola',
      name: 'Pergola',
      shortDescription:
        'Custom pergolas that extend your living space outdoors, built to council-compliant standard.',
      iconKey: 'pergola',
    },
    {
      slug: 'eaves-fencing',
      name: 'Eaves & Fencing',
      shortDescription:
        'Weatherproof eaves detailing and boundary fencing, finished to match the rest of the home.',
      iconKey: 'eaves-fencing',
    },
    {
      slug: 'general-repairs',
      name: 'General Repairs & Maintenance',
      shortDescription:
        'Responsive carpentry repairs — sticking doors, rotten boards, loose joinery — fixed properly, not patched.',
      iconKey: 'general-repairs',
    },
    {
      slug: 'interior-exterior-doors',
      name: 'Interior & Exterior Doors',
      shortDescription:
        'Supply and installation of interior and exterior doors, hung true and sealed for performance.',
      iconKey: 'interior-exterior-doors',
    },
    {
      slug: 'renovations-extensions',
      name: 'Renovations & Extensions',
      shortDescription:
        'Carpentry for renovations and extensions, matched seamlessly to the existing structure.',
      iconKey: 'renovations-extensions',
    },
    {
      slug: 'shop-fitouts',
      name: 'Shop Fitouts',
      shortDescription:
        'Commercial fitout carpentry built for durability, fast turnaround and council compliance.',
      iconKey: 'shop-fitouts',
    },
    {
      slug: 'staircases-studwork',
      name: 'Staircases & Studwork',
      shortDescription:
        'Structural studwork and staircases built to engineered specification, from frame to final tread.',
      iconKey: 'staircases-studwork',
    },
    {
      slug: 'verandahs',
      name: 'Verandahs',
      shortDescription:
        "Verandahs that extend a home's street presence and outdoor living, built to match its character.",
      iconKey: 'verandahs',
    },
  ],
  cladding: [
    {
      slug: 'axon',
      name: 'Axon',
      shortDescription:
        'Vertically-jointed Axon cladding panels, fixed for a sharp, linear façade finish.',
      iconKey: 'axon',
    },
    {
      slug: 'blueboard',
      name: 'Blueboard',
      shortDescription:
        'Blueboard base sheeting for rendered façades, fixed and jointed to a true, render-ready surface.',
      iconKey: 'blueboard',
    },
    {
      slug: 'hebel',
      name: 'Hebel',
      shortDescription:
        'Hebel PowerPanel cladding installation — lightweight, fire-rated and thermally efficient.',
      iconKey: 'hebel',
    },
    {
      slug: 'weatherboard',
      name: 'Weatherboard',
      shortDescription:
        'Timber and composite weatherboard cladding, fixed with consistent reveals for a classic finish.',
      iconKey: 'weatherboard',
    },
  ],
  'gyprock-fixing-flushing': [
    {
      slug: 'acoustic-ceilings',
      name: 'Acoustic & Suspended Ceilings',
      shortDescription:
        'Suspended ceiling systems with acoustic-rated plasterboard for sound control between levels and rooms.',
      iconKey: 'acoustic-ceilings',
    },
    {
      slug: 'bulkheads-pelmet',
      name: 'Bulkheads & Pelmet Boxes',
      shortDescription:
        'Custom bulkheads and pelmet boxes, framed and sheeted for sharp, geometric ceiling lines.',
      iconKey: 'bulkheads-pelmet',
    },
    {
      slug: 'plasterboard-fixing',
      name: 'Residential Plasterboard Fixing',
      shortDescription:
        'Full plasterboard fixing for new builds and renovations, with tight joints and a smooth finish.',
      iconKey: 'plasterboard-fixing',
    },
    {
      slug: 'water-resistant-boarding',
      name: 'Water-Resistant Boarding',
      shortDescription:
        'Water-resistant plasterboard for bathrooms, laundries and wet areas, fixed to waterproofing standard.',
      iconKey: 'water-resistant-boarding',
    },
  ],
  'additional-services': [
    {
      slug: 'design-drafting',
      name: 'Design & Drafting',
      shortDescription:
        'Concept design and construction drawings, prepared in-house to keep your project moving.',
      iconKey: 'design-drafting',
    },
    {
      slug: 'electrical-plumbing',
      name: 'Electrical & Plumbing',
      shortDescription:
        'Licensed electrical and plumbing trades, coordinated as part of the full build program.',
      iconKey: 'electrical-plumbing',
    },
    {
      slug: 'engineering',
      name: 'Engineering',
      shortDescription:
        'Structural engineering for footings, framing and load-bearing work, sized correctly the first time.',
      iconKey: 'engineering',
    },
    {
      slug: 'painting',
      name: 'Painting',
      shortDescription:
        'Interior and exterior painting with proper preparation, for a finish that lasts.',
      iconKey: 'painting',
    },
    {
      slug: 'roofing-guttering',
      name: 'Roofing & Guttering',
      shortDescription:
        'Roofing and guttering installation and repair, detailed to shed South Australian storms properly.',
      iconKey: 'roofing-guttering',
    },
    {
      slug: 'windows-glazing',
      name: 'Windows & Glazing',
      shortDescription:
        'Window and glazing supply and installation, sealed and flashed to manufacturer specification.',
      iconKey: 'windows-glazing',
    },
    {
      slug: 'landscaping',
      name: 'Landscaping',
      shortDescription:
        "Hard and soft landscaping that extends your home's design into the garden.",
      iconKey: 'landscaping',
    },
    {
      slug: 'bathroom-renovation',
      name: 'Bathroom Renovation',
      shortDescription:
        'Full bathroom renovations, from waterproofing and tiling through to the final fitout.',
      iconKey: 'bathroom-renovation',
    },
    {
      slug: 'demolition',
      name: 'Demolition',
      shortDescription:
        'Selective and full demolition, carried out safely and cleared ready for the next trade.',
      iconKey: 'demolition',
    },
    {
      slug: 'grouting',
      name: 'Grouting',
      shortDescription:
        'Tile grouting and re-grouting, finished for a clean, consistent line and long-term water resistance.',
      iconKey: 'grouting',
    },
    {
      slug: 'timber-framing',
      name: 'Timber Framing',
      shortDescription:
        'Timber wall and roof framing, built square and true to engineered specification.',
      iconKey: 'timber-framing',
    },
  ],
}

/** Display names for the 4 root categories (used by fallback + tabs). */
export const SERVICE_ROOT_NAMES: Record<ServiceRootSlug, string> = {
  carpentry: 'Carpentry',
  cladding: 'Cladding',
  'gyprock-fixing-flushing': 'Gyprock Fixing & Flushing',
  'additional-services': 'Additional Services',
}

export function isServiceRootSlug(slug: string): slug is ServiceRootSlug {
  return (SERVICE_ROOT_SLUGS as readonly string[]).includes(slug)
}
