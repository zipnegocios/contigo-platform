/**
 * Presentation-layer metadata for the Services index ("The Atelier Index").
 *
 * Structure (names, ordering, descriptions, slugs) is owned by the DB
 * `categories` table (type='service'); this file owns the *art direction*:
 * the curated image, the custom icon key, and the captivating copy
 * (tagline + supporting line) for each service, keyed by slug.
 *
 * Slugs match those produced by scripts/seed-categories.ts.
 */

export interface ServiceMeta {
  /** Curated hero image (public/assets). */
  image: string
  /** Key into the inline icon map in ServiceIcons.tsx. */
  iconKey: string
  /** Evocative one-liner (rendered in Cormorant). */
  tagline: string
  /** One supporting sentence. */
  support: string
}

/** Final view model consumed by <ServicesIndex>. */
export interface ServiceView {
  slug: string
  name: string
  /** Two-digit display number, e.g. "01". */
  number: string
  image: string
  iconKey: string
  tagline: string
  support: string
}

/** Art-directed copy + imagery, keyed by category slug. AU English. */
export const SERVICE_META: Record<string, ServiceMeta> = {
  'new-home-building': {
    image: '/assets/service-new-home.jpg',
    iconKey: 'new-home',
    tagline: 'Built from the ground up, with you at every line.',
    support:
      'Custom homes shaped to the South Australian landscape and the way you live, delivered end to end without the council headaches.',
  },
  'home-extensions': {
    image: '/assets/service-extension.jpg',
    iconKey: 'extension',
    tagline: 'Room to grow, without moving house.',
    support:
      'Seamless additions that feel like they were always part of the home, from a sun-drenched living room to a full second storey.',
  },
  'home-renovations': {
    image: '/assets/service-renovation.jpg',
    iconKey: 'renovation',
    tagline: 'Elevate your everyday.',
    support:
      "Kitchens, bathrooms and laundries reworked into high-performance spaces that add value the day they're done.",
  },
  carpentry: {
    image: '/assets/service-carpentry.jpg',
    iconKey: 'carpentry',
    tagline: 'Precision in every cut, soul in every finish.',
    support:
      'Decking, pergolas, staircases and fine interior joinery, in timber chosen to thrive in South Australian conditions.',
  },
  cladding: {
    image: '/assets/service-cladding.jpg',
    iconKey: 'cladding',
    tagline: 'The shield your home wears well.',
    support:
      'Weather-tight, thermally sharp and visually striking, with Hebel, Axon and Weatherboard detailed to the millimetre.',
  },
  'gyprock-fixing-flushing': {
    image: '/assets/service-gyprock.jpg',
    iconKey: 'gyprock',
    tagline: 'Flawless surfaces, ready for the spotlight.',
    support:
      'Expert plasterboard for new builds and luxury renovations: raked ceilings, bulkheads and fire-rated systems with tight, true lines.',
  },
  landscaping: {
    image: '/assets/service-landscaping.jpg',
    iconKey: 'landscaping',
    tagline: 'Living beyond the walls.',
    support:
      "We treat the garden as architecture, from driveways and retaining walls to drought-tolerant planting built for Adelaide's climate.",
  },
  'internal-external-painting': {
    image: '/assets/service-painting.jpg',
    iconKey: 'painting',
    tagline: 'The final touch of perfection.',
    support:
      'Premium coating systems and meticulous prep for a sharp, even finish that stands up to the South Australian sun.',
  },
  'render-solid-plastering': {
    image: '/assets/service-rendering.jpg',
    iconKey: 'render',
    tagline: 'Durable elegance for every surface.',
    support:
      'Clean, lasting finishes for brick, blueboard and Hebel, from acrylic texture coats to a classic white set.',
  },
  'venetian-plastering': {
    image: '/assets/service-plaster.jpg',
    iconKey: 'venetian',
    tagline: 'The final, quiet luxury: walls you can touch.',
    support:
      'Seamless mineral finishes that turn walls, fireplaces and benchtops into works of art.',
  },
}

/**
 * Static fallback — the ten core services in narrative order
 * (structure → finish). Used when the DB is empty or unavailable so the
 * page never renders blank.
 */
export const FALLBACK_SERVICES: { slug: string; name: string }[] = [
  { slug: 'new-home-building', name: 'New Home Building' },
  { slug: 'home-extensions', name: 'Home Extensions' },
  { slug: 'home-renovations', name: 'Home Renovations' },
  { slug: 'carpentry', name: 'Carpentry' },
  { slug: 'cladding', name: 'Cladding' },
  { slug: 'gyprock-fixing-flushing', name: 'Gyprock Fixing & Flushing' },
  { slug: 'landscaping', name: 'Landscaping' },
  { slug: 'internal-external-painting', name: 'Internal & External Painting' },
  { slug: 'render-solid-plastering', name: 'Render & Solid Plastering' },
  { slug: 'venetian-plastering', name: 'Venetian Plastering' },
]

const DEFAULT_META: ServiceMeta = {
  image: '/assets/service-new-home.jpg',
  iconKey: 'new-home',
  tagline: '',
  support: '',
}

/** Join a slug + name + order into the full view model, applying art-direction. */
export function toServiceView(
  slug: string,
  name: string,
  index: number,
  fallbackSupport?: string | null,
): ServiceView {
  const meta = SERVICE_META[slug] ?? DEFAULT_META
  return {
    slug,
    name,
    number: String(index + 1).padStart(2, '0'),
    image: meta.image,
    iconKey: meta.iconKey,
    tagline: meta.tagline,
    // Fall back to the DB description if no bespoke support line is mapped.
    support: meta.support || (fallbackSupport ?? ''),
  }
}
