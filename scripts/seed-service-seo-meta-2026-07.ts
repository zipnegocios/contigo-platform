import 'dotenv/config'
import { db } from '../src/infrastructure/db/client'
import { categories, services } from '../src/infrastructure/db/schema'
import { eq } from 'drizzle-orm'

// SEO data for 4 service root categories (from Contigo_SEO_Definicion.md Sección 4)
const CATEGORY_SEO = [
  {
    slug: 'carpentry',
    metaTitle: 'Carpentry Services Adelaide | Contigo Constructions',
    metaDescription:
      'Licensed carpentry services in Adelaide specialising in 1st & 2nd fix carpentry, framing, pergolas, decking, doors, staircases, cladding and custom joinery. Request a free quote today from Contigo Constructions.',
    metaKeywords: ['carpentry services Adelaide', '1st Fix Carpentry Adelaide', '2nd Fix Carpentry Adelaide', 'Custom Carpentry Adelaide'],
  },
  {
    slug: 'cladding',
    metaTitle: 'Cladding Services Adelaide | Contigo Constructions',
    metaDescription:
      'Professional cladding installation in Adelaide. Specialists in Axon, Blueboard, Hebel and Weatherboard systems. Licensed Carpentry & Joinery contractor. Request a free quote today from Contigo Constructions.',
    metaKeywords: ['cladding installation Adelaide', 'External Cladding Adelaide', 'Hebel Cladding Adelaide', 'Weatherboard Cladding Adelaide'],
  },
  {
    slug: 'gyprock-fixing-flushing',
    metaTitle: 'Gyprock Fixing & Flushing Adelaide | Contigo Constructions',
    metaDescription:
      'Professional Gyprock fixing and flushing services in Adelaide, including plasterboard installation, suspended ceilings, bulkheads and water-resistant linings. Request a free quote from Contigo Constructions.',
    metaKeywords: ['Gyprock Fixing & Flushing Adelaide', 'Plasterboard Installation Adelaide', 'Suspended Ceilings Adelaide', 'Bulkhead Installation Adelaide'],
  },
  {
    slug: 'additional-services',
    metaTitle: 'Complete Project Solutions Adelaide | Contigo Constructions',
    metaDescription:
      'Contigo Constructions coordinates trusted trade professionals, including design, drafting, electrical, plumbing, roofing and landscaping, to deliver complete renovation and construction solutions across Adelaide.',
    metaKeywords: ['Construction Project Coordination Adelaide', 'Renovation Project Management Adelaide', 'Design & Drafting Adelaide', 'Construction Coordination Adelaide'],
  },
]

// SEO data for 22 visible services (from Sección 5.1–5.4)
const SERVICE_SEO = [
  // Carpentry (11)
  {
    slug: '1st-2nd-fix',
    metaTitle: '1st & 2nd Fix Carpentry Adelaide | Contigo Constructions',
    metaDescription:
      'Licensed 1st and 2nd fix carpentry services in Adelaide. Specialists in framing, doors, skirting, architraves, flooring and finishing carpentry. Request a free quote today.',
    metaKeywords: ['1st & 2nd Fix Carpentry Adelaide'],
  },
  {
    slug: 'architraves-skirting',
    metaTitle: 'Architraves & Skirting Installation Adelaide | Contigo',
    metaDescription:
      'Professional architraves and skirting installation in Adelaide. Quality finishes, precise workmanship and custom carpentry solutions for residential and commercial projects.',
    metaKeywords: ['Architraves & Skirting Adelaide'],
  },
  {
    slug: 'deck',
    metaTitle: 'Timber Deck Builders Adelaide | Contigo Constructions',
    metaDescription:
      'Custom timber decking in Adelaide. We build durable, stylish outdoor decks using quality materials and expert craftsmanship. Request your free quote today.',
    metaKeywords: ['Timber Deck Builders Adelaide'],
  },
  {
    slug: 'pergola',
    metaTitle: 'Pergola Builders Adelaide | Contigo Constructions',
    metaDescription:
      'Custom pergola builders in Adelaide. We design and construct quality timber pergolas that enhance your outdoor living space. Free quotes available.',
    metaKeywords: ['Pergola Builders Adelaide'],
  },
  {
    slug: 'eaves-fencing',
    metaTitle: 'Eaves & Fencing Adelaide | Contigo Constructions',
    metaDescription:
      'Professional eaves and timber fencing services in Adelaide. Quality installation, repairs and custom carpentry solutions built to last.',
    metaKeywords: ['Eaves Installation Adelaide'],
  },
  {
    slug: 'general-repairs',
    metaTitle: 'Carpentry Repairs & Maintenance Adelaide | Contigo',
    metaDescription:
      'Reliable carpentry repairs and maintenance services across Adelaide. From damaged timber to general repairs, we deliver quality workmanship and lasting results.',
    metaKeywords: ['Carpentry Repairs Adelaide'],
  },
  {
    slug: 'interior-exterior-doors',
    metaTitle: 'Door Installation Adelaide | Contigo Constructions',
    metaDescription:
      'Professional installation of interior and exterior doors in Adelaide. We install timber, bi-fold, sliding and custom doors with precision and quality finishes.',
    metaKeywords: ['Door Installation Adelaide'],
  },
  {
    slug: 'renovations-extensions',
    metaTitle: 'Carpentry for Renovations & Extensions Adelaide',
    metaDescription:
      'Specialists in home renovations and extensions across Adelaide. We deliver quality carpentry, structural improvements and tailored building solutions.',
    metaKeywords: ['Home Renovations Adelaide'],
  },
  {
    slug: 'shop-fitouts',
    metaTitle: 'Commercial Carpentry Fitouts Adelaide | Contigo',
    metaDescription:
      'Licensed carpentry services for home renovations and extensions in Adelaide. Specialists in framing, structural carpentry, cladding, decking and quality finishes.',
    metaKeywords: ['Home Renovation Carpentry Adelaide'],
  },
  {
    slug: 'staircases-studwork',
    metaTitle: 'Staircases & Stud Wall Framing Adelaide | Contigo',
    metaDescription:
      'Professional staircase installation and stud wall framing in Adelaide. Quality structural carpentry delivered with precision and attention to detail.',
    metaKeywords: ['Staircase Installation Adelaide'],
  },
  {
    slug: 'verandahs',
    metaTitle: 'Verandah Builders Adelaide | Contigo Constructions',
    metaDescription:
      'Custom timber verandahs in Adelaide. We build durable, stylish verandahs designed to complement your home and outdoor lifestyle.',
    metaKeywords: ['Verandah Builders Adelaide'],
  },
  // Cladding (4)
  {
    slug: 'axon',
    metaTitle: 'Axon Cladding Installation Adelaide | Contigo Constructions',
    metaDescription:
      'Professional installation of Axon cladding systems in Adelaide by licensed Carpentry & Joinery contractors. Quality workmanship and durable exterior finishes.',
    metaKeywords: ['Axon Cladding Installation Adelaide'],
  },
  {
    slug: 'blueboard',
    metaTitle: 'Blueboard Cladding Installation Adelaide | Contigo',
    metaDescription:
      'Professional installation of Blueboard cladding systems in Adelaide by licensed Carpentry & Joinery contractors. Durable external cladding solutions for residential and commercial projects.',
    metaKeywords: ['Blueboard Cladding Installation Adelaide'],
  },
  {
    slug: 'hebel',
    metaTitle: 'Hebel Cladding Installation Adelaide | Contigo Constructions',
    metaDescription:
      'Professional installation of Hebel cladding systems in Adelaide by licensed Carpentry & Joinery contractors. Precision installation with quality workmanship',
    metaKeywords: ['Hebel Cladding Installation Adelaide'],
  },
  {
    slug: 'weatherboard',
    metaTitle: 'Weatherboard Cladding Installation Adelaide',
    metaDescription:
      'Professional installation of Weatherboard cladding systems in Adelaide by licensed Carpentry & Joinery contractors. Quality finishes designed to enhance and protect your property.',
    metaKeywords: ['Weatherboard Cladding Installation Adelaide'],
  },
  // Gyprock (4)
  {
    slug: 'acoustic-ceilings',
    metaTitle: 'Acoustic & Suspended Ceiling Installation Adelaide',
    metaDescription:
      'Professional installation of acoustic and suspended ceilings in Adelaide by licensed Carpentry & Joinery contractors. Quality plasterboard fixing and finishing solutions.',
    metaKeywords: ['Suspended Ceiling Installation Adelaide'],
  },
  {
    slug: 'bulkheads-pelmet',
    metaTitle: 'Bulkhead & Pelmet Box Installation Adelaide',
    metaDescription:
      'Professional installation of bulkheads and pelmet boxes in Adelaide. Quality plasterboard finishing with attention to detail for residential and commercial projects.',
    metaKeywords: ['Bulkhead Installation Adelaide'],
  },
  {
    slug: 'plasterboard-fixing',
    metaTitle: 'Plasterboard Fixing & Flushing Adelaide | Contigo',
    metaDescription:
      'Professional plasterboard fixing and flushing services in Adelaide by licensed Carpentry & Joinery contractors. Quality finishes for residential and commercial projects.',
    metaKeywords: ['Plasterboard Fixing Adelaide'],
  },
  {
    slug: 'water-resistant-boarding',
    metaTitle: 'Water-Resistant Plasterboard Installation Adelaide',
    metaDescription:
      'Installation of water-resistant plasterboard systems for bathrooms, laundries and wet areas in Adelaide. Professional fixing and finishing by experienced contractors.',
    metaKeywords: ['Water-Resistant Plasterboard Adelaide'],
  },
  // Additional Services (3 visible)
  {
    slug: 'design-drafting',
    metaTitle: 'Design & Drafting Coordination Adelaide | Contigo',
    metaDescription:
      'Design and drafting coordination for carpentry, renovations and construction projects in Adelaide. Working with trusted design professionals.',
    metaKeywords: ['Design & Drafting Adelaide'],
  },
  {
    slug: 'windows-glazing',
    metaTitle: 'Window Installation Adelaide | Contigo Constructions',
    metaDescription:
      'Professional window installation in Adelaide by licensed Carpentry & Joinery contractors. Quality workmanship for residential and commercial projects.',
    metaKeywords: ['Window Installation Adelaide'],
  },
  {
    slug: 'timber-framing',
    metaTitle: 'Timber Framing Adelaide | Contigo Constructions',
    metaDescription:
      'Licensed timber framing services in Adelaide. Specialists in wall framing, roof framing and structural timber construction with quality workmanship.',
    metaKeywords: ['Timber Framing Adelaide'],
  },
]

// Services that should NOT be indexed (noIndex = true)
const HIDDEN_SERVICE_SLUGS = [
  'electrical-plumbing',
  'engineering',
  'painting',
  'roofing-guttering',
  'landscaping',
  'bathroom-renovation',
  'demolition',
  'grouting',
]

async function seed() {
  console.log('Seeding SEO metadata...')

  try {
    // Update categories
    for (const cat of CATEGORY_SEO) {
      await db
        .update(categories)
        .set({
          metaTitle: cat.metaTitle,
          metaDescription: cat.metaDescription,
          metaKeywords: cat.metaKeywords,
        })
        .where(eq(categories.slug, cat.slug))
    }
    console.log(`✓ Updated ${CATEGORY_SEO.length} categories`)

    // Update visible services
    for (const svc of SERVICE_SEO) {
      await db
        .update(services)
        .set({
          metaTitle: svc.metaTitle,
          metaDescription: svc.metaDescription,
          metaKeywords: svc.metaKeywords,
        })
        .where(eq(services.slug, svc.slug))
    }
    console.log(`✓ Updated ${SERVICE_SEO.length} visible services`)

    // Mark hidden services with noIndex = true
    for (const slug of HIDDEN_SERVICE_SLUGS) {
      await db.update(services).set({ noIndex: true }).where(eq(services.slug, slug))
    }
    console.log(`✓ Marked ${HIDDEN_SERVICE_SLUGS.length} services as no-index`)

    console.log('✓ SEO metadata seed complete')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seed()
