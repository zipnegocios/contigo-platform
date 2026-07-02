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
import type { ServiceRowData } from '@/presentation/sections/ServicesSection'
import { MarketingPageClient } from './MarketingPageClient'

function buildFallbackCategories(): ServiceRowData[] {
  return SERVICE_ROOT_SLUGS.map((slug) => ({
    categorySlug: slug,
    categoryName: SERVICE_ROOT_NAMES[slug],
    items: SERVICE_FALLBACK_CATALOGUE[slug].map((f) => ({
      slug: f.slug, name: f.name, imageUrl: SERVICE_FALLBACK_IMAGES[slug],
    })),
  }))
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

  let serviceCategories: ServiceRowData[] = buildFallbackCategories()
  try {
    if (process.env.DATABASE_URL) {
      const categoryRepo = new DrizzleCategoryRepository()
      const serviceRepo = new DrizzleServiceRepository()
      const allPublished = await serviceRepo.findPublished()

      const rows = await Promise.all(
        SERVICE_ROOT_SLUGS.map(async (slug): Promise<ServiceRowData | null> => {
          const root = await categoryRepo.findBySlug(slug, 'shared')
          if (!root || !root.isActive) return null
          const matched = allPublished.filter((s) => s.categoryId === root.id)
          if (matched.length === 0) return null
          return {
            categorySlug: slug,
            categoryName: root.name,
            items: matched.map((s) => ({ slug: s.slug, name: s.name, imageUrl: s.imageUrl || SERVICE_FALLBACK_IMAGES[slug] })),
          } satisfies ServiceRowData
        })
      )

      if (rows.every((r): r is ServiceRowData => r !== null)) {
        serviceCategories = rows
      }
    }
  } catch (err) {
    console.error('HomePage: failed to fetch service categories', err)
  }

  return (
    <MarketingPageClient>
      <SimpleHeader />

      <main className="relative">
        <HeroSection config={heroConfigData} />
        <BrandBar />
        <ServicesSection categories={serviceCategories} />
        <BrandPromiseSection />
        <ProjectsSection projects={projects} />
        <MasterBuildersSection />
        <ContactSection />
      </main>

      <Footer />
    </MarketingPageClient>
  )
}
