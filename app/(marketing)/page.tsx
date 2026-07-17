import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { SimpleHeader } from '@/presentation/components/SimpleHeader'
import HeroSection from '@/presentation/sections/HeroSection'
import BrandBar from '@/presentation/sections/BrandBar'
import ServicesSection from '@/presentation/sections/ServicesSection'
import BrandPromiseSection from '@/presentation/sections/BrandPromiseSection'
import ProjectsSection from '@/presentation/sections/ProjectsSection'
import MasterBuildersSection from '@/presentation/sections/MasterBuildersSection'
import ReviewsSection from '@/presentation/sections/ReviewsSection'
import AboutAuthoritySection from '@/presentation/sections/AboutAuthoritySection'
import Footer from '@/presentation/sections/FooterServer'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleHeroConfigRepository } from '@/infrastructure/repositories/DrizzleHeroConfigRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { resolveProjectCategorySlug } from '@/infrastructure/services/resolveProjectCategorySlug'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { DrizzleReviewSettingsRepository } from '@/infrastructure/repositories/DrizzleReviewSettingsRepository'
import { DrizzleReviewTagRepository } from '@/infrastructure/repositories/DrizzleReviewTagRepository'
import { GetPublicReviewsUseCase, type PublicReviewsResult } from '@/application/use-cases/reviews/GetPublicReviewsUseCase'
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

export const metadata: Metadata = {
  // No `title` here on purpose: the root layout's title.template ('%s |
  // Contigo Constructions') appends the brand suffix to ANY string title a
  // page sets, even one identical to the layout's own `default`. Setting a
  // string title here duplicated the brand ("... Adelaide | Contigo
  // Constructions"). Omitting `title` makes Next.js fall back to the root's
  // `default` untouched, which already IS the exact string we want.
  description:
    'Licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, pergolas, decking, framing and cladding. Request a free quote today.',
  keywords: [
    'Carpentry & Renovations Adelaide',
    'Home Renovations Adelaide',
    'Home Extensions Adelaide',
    'Carpentry Services Adelaide',
  ],
  alternates: {
    canonical: 'https://contigoconstructions.com.au',
  },
  openGraph: {
    title: 'Contigo Constructions | Carpentry & Renovations Adelaide',
    description:
      'Licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, pergolas, decking, framing and cladding. Request a free quote today.',
    url: 'https://contigoconstructions.com.au',
  },
}

export default async function HomePage() {
  // Fetch featured projects server-side — always fresh, no client fetch needed
  let projects: {
    id: string
    slug: string
    title: string
    category: string
    categorySlug: string
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
      projects = await Promise.all(
        raw.map(async (p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          category: p.category,
          categorySlug: await resolveProjectCategorySlug(p),
          location: p.location,
          completedDate: p.completedDate ? p.completedDate.toISOString() : null,
          coverImageUrl: p.coverImageUrl,
          coverPosterUrl: p.coverPosterUrl ?? null,
        })),
      )
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
        if (root && root.status === 'active') {
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

  let publicReviews: PublicReviewsResult = { reviews: [], averageRating: 0, count: 0, displayMode: 'carousel' }
  try {
    if (process.env.DATABASE_URL) {
      const useCase = new GetPublicReviewsUseCase(
        new DrizzleGoogleReviewRepository(),
        new DrizzleReviewSettingsRepository(),
        new DrizzleReviewTagRepository(),
      )
      publicReviews = await useCase.execute()
    }
  } catch (err) {
    console.error('HomePage: failed to fetch public reviews', err)
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
        <ReviewsSection
          reviews={publicReviews.reviews}
          averageRating={publicReviews.averageRating}
          count={publicReviews.count}
          displayMode={publicReviews.displayMode}
        />
        <ContactSection />
      </main>

      <AboutAuthoritySection />

      <Footer />
    </MarketingPageClient>
  )
}
