import { Metadata } from 'next'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
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

export default async function ProjectsPage() {
  let projects: {
    id: string
    slug: string
    title: string
    category: string
    location: string
    coverImageUrl: string
    featured: boolean
    completedDate: Date
  }[] = []

  try {
    if (process.env.DATABASE_URL) {
      const repo = new DrizzleProjectRepository()
      const raw = await repo.findPublished(100)
      projects = raw.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        category: p.category,
        location: p.location,
        coverImageUrl: p.coverImageUrl,
        featured: p.featured,
        completedDate: p.completedDate,
      }))
    }
  } catch (error) {
    console.warn('ProjectsPage: Could not fetch projects:', error)
  }

  // Unique categories in the order they appear
  const categories = [...new Set(projects.map((p) => p.category))].sort()

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
          className="block text-xs uppercase tracking-widest mb-4"
          style={{ color: '#E2C063' }}
        >
          Portfolio
        </span>
        <h1
          className="text-5xl md:text-7xl font-semibold leading-none mb-4"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
        >
          Our Projects
        </h1>
        <p className="text-base max-w-xl" style={{ color: 'rgba(250,246,240,0.6)' }}>
          From heritage restorations to contemporary new builds — explore the work that defines Contigo.
        </p>
        <p
          className="absolute bottom-6 right-8 text-xs"
          style={{ color: 'rgba(250,246,240,0.3)' }}
        >
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        {projects.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-sm" style={{ color: '#A89E8C' }}>
              No projects published yet. Check back soon.
            </p>
          </div>
        ) : (
          <ProjectsGrid projects={projects} categories={categories} />
        )}
      </div>
    </div>
  )
}
