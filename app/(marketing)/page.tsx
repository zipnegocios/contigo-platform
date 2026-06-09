import { VoiceSearchNav } from '@/presentation/components/VoiceSearchNav'
import HeroSection from '@/presentation/sections/HeroSection'
import BrandBar from '@/presentation/sections/BrandBar'
import ServicesSection from '@/presentation/sections/ServicesSection'
import HeritageSection from '@/presentation/sections/HeritageSection'
import ProjectsSection from '@/presentation/sections/ProjectsSection'
import ContactSection from '@/presentation/sections/ContactSection'
import Footer from '@/presentation/sections/Footer'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

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
    <>
      <VoiceSearchNav />

      <main className="relative">
        <HeroSection />
        <BrandBar />
        <ServicesSection />
        <HeritageSection />
        <ProjectsSection projects={projects} />
        <ContactSection />
      </main>

      <Footer />
    </>
  )
}
