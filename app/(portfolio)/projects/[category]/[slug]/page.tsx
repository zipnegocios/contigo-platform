import { notFound, permanentRedirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { resolveProjectCategorySlug } from '@/infrastructure/services/resolveProjectCategorySlug'
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import { ProjectGallery } from '@/presentation/components/ProjectGallery'
import { isVideoUrl } from '@/presentation/lib/media-type'

export async function generateStaticParams() {
  try {
    if (!process.env.DATABASE_URL) return []
    const repo = new DrizzleProjectRepository()
    const catRepo = new DrizzleCategoryRepository()
    const [projectsList, cats] = await Promise.all([repo.findPublished(100), catRepo.findFlat('shared')])
    const categoryById = new Map(cats.map((c) => [c.id, c.slug]))
    return projectsList.map((p) => ({
      category: (p.categoryId && categoryById.get(p.categoryId)) || generateSlug(p.category),
      slug: p.slug,
    }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const repo = new DrizzleProjectRepository()
  const project = await repo.findBySlug(slug)
  if (!project || project.status !== 'active' || project.trashedAt) return { title: 'Project not found' }
  return {
    title: `${project.title} | Contigo Constructions`,
    description: project.description,
    openGraph: {
      title: `${project.title} | Contigo Constructions`,
      description: project.description,
      type: 'website',
      images: [{ url: project.coverImageUrl, width: 1200, height: 630, alt: project.title }],
    },
  }
}

export const dynamicParams = true
export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category: categorySlug, slug } = await params
  const repo = new DrizzleProjectRepository()
  const project = await repo.findBySlug(slug)

  if (!project || project.status !== 'active' || project.trashedAt) notFound()

  // Keep the category segment honest — if a project was recategorized, an
  // old bookmarked/indexed `/projects/[oldCategory]/[slug]` URL still
  // resolves, just permanently redirected to the current canonical one.
  const correctCategorySlug = await resolveProjectCategorySlug(project)
  if (categorySlug !== correctCategorySlug) {
    permanentRedirect(`/projects/${correctCategorySlug}/${project.slug}`)
  }

  const completedLabel = new Date(project.completedDate).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div style={{ backgroundColor: '#FAF6F0', minHeight: '100vh' }}>
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative" style={{ height: '90vh', maxHeight: 720, minHeight: 480 }}>
        {isVideoUrl(project.coverImageUrl) ? (
          <video
            src={project.coverImageUrl}
            poster={project.coverPosterUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={project.coverImageUrl}
            alt={project.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(30,26,22,0.15) 0%, rgba(30,26,22,0.72) 70%, rgba(30,26,22,0.92) 100%)',
          }}
        />

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-12 md:px-16 md:pb-16">
          <p
            className="text-fluid-xs uppercase tracking-widest mb-3"
            style={{ color: '#E2C063' }}
          >
            {project.category}
          </p>
          <h1
            className="text-fluid-5xl font-semibold leading-none"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
          >
            {project.title}
          </h1>
          <div className="flex flex-wrap gap-6 mt-5">
            <span className="text-fluid-sm" style={{ color: 'rgba(250,246,240,0.7)' }}>
              {project.location}
            </span>
            <span className="text-fluid-sm" style={{ color: 'rgba(250,246,240,0.7)' }}>
              Completed {completedLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left: Description + Gallery ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="mb-12">
              {project.description.split(/\n{2,}/).map((paragraph, i) => (
                <p
                  key={i}
                  className="text-fluid-xl leading-relaxed mb-4 last:mb-0 whitespace-pre-line"
                  style={{ color: '#3D3530', fontFamily: 'var(--font-cormorant)' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <ProjectGallery items={project.galleryItems} />
          </div>

          {/* ── Right: Ficha sidebar ─────────────────────────────────────────── */}
          <aside className="lg:w-80 xl:w-96 flex-shrink-0">
            <div
              className="rounded-2xl p-8 sticky top-8"
              style={{
                backgroundColor: '#1E1A16',
                border: '1px solid rgba(226,192,99,0.18)',
              }}
            >
              <h3
                className="text-fluid-xs uppercase tracking-widest mb-6"
                style={{ color: '#E2C063' }}
              >
                Project Details
              </h3>

              <dl className="space-y-5">
                <div>
                  <dt className="text-fluid-xs uppercase tracking-widest mb-1" style={{ color: '#A89E8C' }}>
                    Category
                  </dt>
                  <dd className="text-fluid-base font-medium" style={{ color: '#E8DCC4' }}>
                    {project.category}
                  </dd>
                </div>
                <div>
                  <dt className="text-fluid-xs uppercase tracking-widest mb-1" style={{ color: '#A89E8C' }}>
                    Location
                  </dt>
                  <dd className="text-fluid-base font-medium" style={{ color: '#E8DCC4' }}>
                    {project.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-fluid-xs uppercase tracking-widest mb-1" style={{ color: '#A89E8C' }}>
                    Completed
                  </dt>
                  <dd className="text-fluid-base font-medium" style={{ color: '#E8DCC4' }}>
                    {completedLabel}
                  </dd>
                </div>
                {project.featured && (
                  <div>
                    <dt className="text-fluid-xs uppercase tracking-widest mb-1" style={{ color: '#A89E8C' }}>
                      Recognition
                    </dt>
                    <dd>
                      <span
                        className="text-fluid-xs uppercase tracking-widest px-3 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(226,192,99,0.18)', color: '#E2C063' }}
                      >
                        Featured Project
                      </span>
                    </dd>
                  </div>
                )}
              </dl>

              <div
                className="my-7"
                style={{ height: 1, backgroundColor: 'rgba(226,192,99,0.15)' }}
              />

              <p className="text-fluid-sm mb-5" style={{ color: '#A89E8C', lineHeight: 1.6 }}>
                Interested in a similar project? Our team would love to discuss how we can bring your vision to life.
              </p>

              <Link
                href="/#contact"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-fluid-sm font-semibold transition-all duration-200"
                style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
              >
                Request a Quote
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
