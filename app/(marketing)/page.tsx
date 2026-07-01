import nextDynamic from 'next/dynamic'
import { SimpleHeader } from '@/presentation/components/SimpleHeader'
import HeroSection from '@/presentation/sections/HeroSection'
import BrandBar from '@/presentation/sections/BrandBar'
import ServicesSection from '@/presentation/sections/ServicesSection'
import BrandPromiseSection from '@/presentation/sections/BrandPromiseSection'
import ProjectsSection from '@/presentation/sections/ProjectsSection'
import Footer from '@/presentation/sections/Footer'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleHeroConfigRepository } from '@/infrastructure/repositories/DrizzleHeroConfigRepository'
import { MarketingPageClient } from './MarketingPageClient'

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

  return (
    <MarketingPageClient>
      <SimpleHeader />

      <main className="relative">
        <HeroSection config={heroConfigData} />
        <BrandBar />
        <ServicesSection />
        <BrandPromiseSection />
        <ProjectsSection projects={projects} />
        <ContactSection />
      </main>

      <Footer />
    </MarketingPageClient>
  )
}
