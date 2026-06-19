import { Metadata } from 'next'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { ServicesGrid } from '@/presentation/components/ServicesGrid'

export const metadata: Metadata = {
  title: 'Services | Contigo Constructions',
  description: 'Explore the range of construction services Contigo offers across Adelaide.',
  openGraph: {
    title: 'Our Services | Contigo Constructions',
    description: 'Explore the range of construction services Contigo offers across Adelaide.',
    type: 'website',
  },
}

interface ServicesPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const { category: categorySlug } = await searchParams

  let allServices: {
    id: string
    slug: string
    name: string
    categoryId: string | null
    categoryName: string | null
    imageUrl: string
    posterUrl: string | null
  }[] = []

  let allCategories: { name: string; slug: string }[] = []

  try {
    if (process.env.DATABASE_URL) {
      const serviceRepo = new DrizzleServiceRepository()
      const categoryRepo = new DrizzleCategoryRepository()

      const [services, flatCats] = await Promise.all([
        serviceRepo.findPublished(),
        categoryRepo.findFlat('service'),
      ])

      const categoryNameById = new Map(flatCats.map((c) => [c.id, c.name]))

      allServices = services.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        categoryId: s.categoryId,
        categoryName: s.categoryId ? categoryNameById.get(s.categoryId) ?? null : null,
        imageUrl: s.imageUrl,
        posterUrl: s.posterUrl,
      }))

      allCategories = flatCats
        .filter((c) => c.isActive && c.parentId === null)
        .map((c) => ({ name: c.name, slug: c.slug }))
    }
  } catch (error) {
    console.warn('ServicesPage: Could not fetch services:', error)
  }

  // Filter by category slug if provided
  let filtered = allServices
  if (categorySlug) {
    const matchedCategory = allCategories.find((c) => c.slug === categorySlug)
    filtered = allServices.filter((s) => s.categoryName === matchedCategory?.name)
  }

  return (
    <div style={{ backgroundColor: '#FAF6F0', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="relative py-24 px-6 md:px-16"
        style={{
          backgroundColor: '#1E1A16',
          borderBottom: '1px solid rgba(226,192,99,0.15)',
        }}
      >
        <span
          className="block text-fluid-xs uppercase tracking-widest mb-4"
          style={{ color: '#E2C063' }}
        >
          What We Do
        </span>
        <h1
          className="text-fluid-5xl font-semibold leading-none mb-4"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
        >
          Our Services
        </h1>
        <p className="text-fluid-base max-w-xl" style={{ color: 'rgba(250,246,240,0.6)' }}>
          From new builds to renovations — explore the services that bring Contigo&apos;s craftsmanship to your project.
        </p>
        <p
          className="absolute bottom-6 right-8 text-fluid-xs"
          style={{ color: 'rgba(250,246,240,0.3)' }}
        >
          {filtered.length} service{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        {allServices.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-fluid-sm" style={{ color: '#A89E8C' }}>
              No services published yet. Check back soon.
            </p>
          </div>
        ) : (
          <ServicesGrid
            services={filtered}
            allCategories={allCategories}
            activeSlug={categorySlug ?? null}
          />
        )}
      </div>
    </div>
  )
}
