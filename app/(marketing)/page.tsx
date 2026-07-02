import nextDynamic from 'next/dynamic'
import { SimpleHeader } from '@/presentation/components/SimpleHeader'
import HeroSection from '@/presentation/sections/HeroSection'
import BrandBar from '@/presentation/sections/BrandBar'
import ServicesSection from '@/presentation/sections/ServicesSection'
import BrandPromiseSection from '@/presentation/sections/BrandPromiseSection'
import ProjectsSection from '@/presentation/sections/ProjectsSection'
import MasterBuildersSection from '@/presentation/sections/MasterBuildersSection'
import Footer from '@/presentation/sections/Footer'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleHeroConfigRepository } from '@/infrastructure/repositories/DrizzleHeroConfigRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { SERVICE_ROOT_SLUGS, SERVICE_ROOT_NAMES, SERVICE_FALLBACK_CATALOGUE } from '@/presentation/data/serviceCategoryMeta'
import { SERVICE_FALLBACK_IMAGES } from '@/presentation/data/serviceFallbackImages'
import type { ServiceCardData } from '@/presentation/sections/ServicesSection'
import { MarketingPageClient } from './MarketingPageClient'

/** Fisher-Yates shuffle (returns a new array). Runs server-side only, so the
 *  order is fixed for a given request and the client hydrates the same HTML. */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Every leaf service from the static catalogue, flattened and shuffled —
 *  used when the DB is unavailable so the section is never empty. */
function buildFallbackServices(): ServiceCardData[] {
  const flat = SERVICE_ROOT_SLUGS.flatMap((slug) =>
    SERVICE_FALLBACK_CATALOGUE[slug].map((f) => ({
      slug: f.slug,
      name: f.name,
      imageUrl: SERVICE_FALLBACK_IMAGES[slug],
      categorySlug: slug,
      categoryName: SERVICE_ROOT_NAMES[slug],
    })),
  )
  return shuffle(flat)
}

const ContactSection = nextDynamic(
  () => import('@/presentation/sections/ContactSection'),
  { loading: () => <div className="min-h-screen" /> }
)

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch featured projects server-side — always fresh, no client fetch needed
  let projects: {
    id: string
    slug: string
    title: string
    category: string
    location: string
    completedDate: string | null
    coverImageUrl: string
    coverPosterUrl: string | null
  }[] = []

  let heroConfigData = null
  try {
    if (process.env.DATABASE_URL) {
      heroConfigData = await new DrizzleHeroConfigRepository().get()
    }
  } catch (err) {
    console.error('HomePage: failed to fetch hero config', err)
  }

  try {
    if (process.env.DATABASE_URL) {
      const repo = new DrizzleProjectRepository()
      const raw = await repo.findFeatured()
      projects = raw.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        category: p.category,
        location: p.location,
        completedDate: p.completedDate ? p.completedDate.toISOString() : null,
        coverImageUrl: p.coverImageUrl,
        coverPosterUrl: p.coverPosterUrl ?? null,
      }))
    }
  } catch (err) {
    console.error('HomePage: failed to fetch featured projects', err)
  }

  // All published services, each tagged with its (active) root category, then
  // shuffled into one flat pool. ServicesSection deals them across 3 rows.
  let serviceCards: ServiceCardData[] = buildFallbackServices()
  try {
    if (process.env.DATABASE_URL) {
      const categoryRepo = new DrizzleCategoryRepository()
      const serviceRepo = new DrizzleServiceRepository()

      // Map each active root category id → its slug + display name.
      const roots = await Promise.all(
        SERVICE_ROOT_SLUGS.map((slug) => categoryRepo.findBySlug(slug, 'shared')),
      )
      const rootById = new Map<string, { slug: (typeof SERVICE_ROOT_SLUGS)[number]; name: string }>()
      roots.forEach((root, i) => {
        if (root && root.isActive) {
          rootById.set(root.id, { slug: SERVICE_ROOT_SLUGS[i], name: root.name })
        }
      })

      const allPublished = await serviceRepo.findPublished()
      const cards = allPublished.flatMap((s): ServiceCardData[] => {
        const root = s.categoryId ? rootById.get(s.categoryId) : undefined
        if (!root) return [] // skip services whose category is inactive/unknown
        return [{
          slug: s.slug,
          name: s.name,
          imageUrl: s.imageUrl || SERVICE_FALLBACK_IMAGES[root.slug],
          categorySlug: root.slug,
          categoryName: root.name,
        }]
      })

      if (cards.length > 0) {
        serviceCards = shuffle(cards)
      }
    }
  } catch (err) {
    console.error('HomePage: failed to fetch services', err)
  }

  return (
    <MarketingPageClient>
      <SimpleHeader />

      <main className="relative">
        <HeroSection config={heroConfigData} />
        <BrandBar />
        <ServicesSection services={serviceCards} />
        <BrandPromiseSection />
        <ProjectsSection projects={projects} />
        <MasterBuildersSection />
        <ContactSection />
      </main>

      <Footer />
    </MarketingPageClient>
  )
}
