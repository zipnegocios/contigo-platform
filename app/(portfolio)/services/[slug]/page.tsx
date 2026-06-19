import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { ProjectGallery } from '@/presentation/components/ProjectGallery'

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export async function generateStaticParams() {
  try {
    if (!process.env.DATABASE_URL) return []
    const repo = new DrizzleServiceRepository()
    const services = await repo.findPublished()
    return services.map((s) => ({ slug: s.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const repo = new DrizzleServiceRepository()
  const service = await repo.findBySlug(slug)
  if (!service || !service.published) return { title: 'Service not found' }
  return {
    title: `${service.name} | Contigo Constructions`,
    description: service.shortDescription,
    openGraph: {
      title: `${service.name} | Contigo Constructions`,
      description: service.shortDescription,
      type: 'website',
      images: [{ url: service.imageUrl, width: 1200, height: 630, alt: service.name }],
    },
  }
}

export const dynamicParams = true
export const dynamic = 'force-dynamic'

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const repo = new DrizzleServiceRepository()
  const service = await repo.findBySlug(slug)

  if (!service || !service.published) notFound()

  return (
    <div style={{ backgroundColor: '#FAF6F0', minHeight: '100vh' }}>
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative" style={{ height: '70vh', maxHeight: 600, minHeight: 400 }}>
        {isVideo(service.imageUrl) ? (
          <video
            src={service.imageUrl}
            poster={service.posterUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={service.imageUrl}
            alt={service.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(30,26,22,0.1) 0%, rgba(30,26,22,0.7) 65%, rgba(30,26,22,0.92) 100%)',
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 px-8 pb-12 md:px-16 md:pb-16">
          <h1
            className="text-fluid-5xl font-semibold leading-none"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
          >
            {service.name}
          </h1>
          <p
            className="mt-4 text-fluid-lg max-w-2xl"
            style={{ color: 'rgba(250,246,240,0.75)' }}
          >
            {service.shortDescription}
          </p>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left: Description + Gallery ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {service.fullDescription && (
              <p
                className="text-fluid-xl leading-relaxed mb-12"
                style={{ color: '#3D3530', fontFamily: 'var(--font-cormorant)' }}
              >
                {service.fullDescription}
              </p>
            )}

            {service.galleryItems.length > 0 && (
              <ProjectGallery items={service.galleryItems} />
            )}
          </div>

          {/* ── Right: CTA sidebar ──────────────────────────────────────────── */}
          <aside className="lg:w-72 xl:w-80 flex-shrink-0">
            <div
              className="rounded-2xl p-8 sticky top-8"
              style={{
                backgroundColor: '#1E1A16',
                border: '1px solid rgba(226,192,99,0.18)',
              }}
            >
              <h3
                className="text-fluid-xs uppercase tracking-widest mb-4"
                style={{ color: '#E2C063' }}
              >
                Interested?
              </h3>
              <p className="text-fluid-sm mb-6" style={{ color: '#A89E8C', lineHeight: 1.6 }}>
                Our team specialises in {service.name.toLowerCase()}. Tell us about your project and we&apos;ll be in touch.
              </p>

              <Link
                href="/#contact"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-fluid-sm font-semibold transition-all duration-200 mb-3"
                style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
              >
                Request a Quote
              </Link>

              <Link
                href="/projects"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-fluid-sm font-medium transition-all duration-200"
                style={{ border: '1px solid rgba(226,192,99,0.3)', color: '#E2C063' }}
              >
                View Our Projects
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
