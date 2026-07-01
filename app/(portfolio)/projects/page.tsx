import { Metadata } from 'next'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { ProjectsGrid } from '@/presentation/components/ProjectsGrid'

export const metadata: Metadata = {
  title: 'Projects | Contigo Constructions',
  description: 'Explore our portfolio of completed construction projects across Adelaide.',
  openGraph: {
    title: 'Our Projects | Contigo Constructions',
    description: 'Explore our portfolio of completed construction projects across Adelaide.',
    type: 'website',
  },
}

interface ProjectsPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { category: categorySlug } = await searchParams

  let allProjects: {
    id: string
    slug: string
    title: string
    category: string
    categoryId: string | null
    location: string
    coverImageUrl: string
    featured: boolean
    completedDate: Date
  }[] = []

  let allCategories: { name: string; slug: string }[] = []

  try {
    if (process.env.DATABASE_URL) {
      const projectRepo = new DrizzleProjectRepository()
      const categoryRepo = new DrizzleCategoryRepository()

      const [raw, flatCats] = await Promise.all([
        projectRepo.findPublished(100),
        categoryRepo.findFlat('shared'),
      ])

      allProjects = raw.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        category: p.category,
        categoryId: p.categoryId,
        location: p.location,
        coverImageUrl: p.coverImageUrl,
        coverPosterUrl: p.coverPosterUrl ?? null,
        featured: p.featured,
        completedDate: p.completedDate,
      }))

      allCategories = flatCats
        .filter((c) => c.isActive && c.parentId === null)
        .map((c) => ({ name: c.name, slug: c.slug }))
    }
  } catch (error) {
    console.warn('ProjectsPage: Could not fetch projects:', error)
  }

  // Filter by category slug if provided
  let filtered = allProjects
  if (categorySlug) {
    filtered = allProjects.filter((p) =>
      p.category.toLowerCase().replace(/\s+/g, '-') === categorySlug ||
      allCategories.find((c) => c.slug === categorySlug)?.name.toLowerCase() === p.category.toLowerCase()
    )
  }

  return (
    <div style={{ backgroundColor: '#FAF6F0', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="relative pt-40 pb-24 px-6 md:px-16"
        style={{
          backgroundColor: 'var(--petrol-800)',
          borderBottom: '1px solid rgba(226,192,99,0.15)',
        }}
      >
        <span
          className="block text-fluid-xs uppercase tracking-widest mb-4"
          style={{ color: '#E2C063' }}
        >
          Portfolio
        </span>
        <h1
          className="text-fluid-5xl font-semibold leading-none mb-4"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
        >
          Our Projects
        </h1>
        <p className="text-fluid-base max-w-xl" style={{ color: 'rgba(250,246,240,0.6)' }}>
          From heritage restorations to contemporary new builds — explore the work that defines Contigo.
        </p>
        <p
          className="absolute bottom-6 right-8 text-fluid-xs"
          style={{ color: 'rgba(250,246,240,0.3)' }}
        >
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        {allProjects.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-fluid-sm" style={{ color: '#A89E8C' }}>
              No projects published yet. Check back soon.
            </p>
          </div>
        ) : (
          <ProjectsGrid
            projects={filtered}
            allCategories={allCategories}
            activeSlug={categorySlug ?? null}
          />
        )}
      </div>
    </div>
  )
}
