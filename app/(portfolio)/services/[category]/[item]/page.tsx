import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { ProjectGallery } from '@/presentation/components/ProjectGallery'
import { getPublicServiceCategories } from '@/infrastructure/services/getPublicServiceCategories'
import { PageBlockRenderer } from '@/presentation/components/PageBlockRenderer'
import type { Service } from '@/core/entities/Service'

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

/**
 * Resolves the service for `item` and validates it belongs to an active
 * category of the `category` root that is currently publicly visible
 * (active category with at least one active service). Returns `null` if
 * anything in the chain is missing/inactive/unpublished/mismatched —
 * callers should treat `null` as a 404.
 */
async function resolveServiceForCategory(category: string, item: string) {
  const categoryRepo = new DrizzleCategoryRepository()
  const serviceRepo = new DrizzleServiceRepository()

  const [visible, root, service] = await Promise.all([
    getPublicServiceCategories(),
    categoryRepo.findBySlug(category, 'shared'),
    serviceRepo.findBySlug(item),
  ])

  if (!visible.some((c) => c.slug === category)) return null
  if (!root || root.status !== 'active' || root.trashedAt) return null
  if (!service || service.status !== 'active' || service.trashedAt) return null
  if (!service.categoryId) return null

  if (service.categoryId !== root.id) return null

  return { root, service }
}

export async function generateStaticParams() {
  try {
    if (!process.env.DATABASE_URL) return []

    const serviceRepo = new DrizzleServiceRepository()

    const visible = await getPublicServiceCategories()
    const services = await serviceRepo.findPublished()

    const params: { category: string; item: string }[] = []

    for (const root of visible) {
      for (const service of services) {
        if (service.categoryId === root.id) {
          params.push({ category: root.slug, item: service.slug })
        }
      }
    }

    return params
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; item: string }>
}): Promise<Metadata> {
  const { category, item } = await params
  const resolved = await resolveServiceForCategory(category, item)
  if (!resolved) return { title: 'Service not found' }

  const { service } = resolved

  // Use metaTitle from DB, fallback to service.name
  const title = service.metaTitle || service.name
  // Use metaDescription from DB, fallback to shortDescription
  const description = service.metaDescription || service.shortDescription
  // Use metaKeywords from DB, fallback to empty array
  const keywords = service.metaKeywords || []

  const metadata: Metadata = {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://contigoconstructions.com.au/services/${category}/${item}`,
    },
    openGraph: {
      title,
      description,
      url: `https://contigoconstructions.com.au/services/${category}/${item}`,
      type: 'website',
      images: [
        {
          url: service.imageUrl,
          width: 1200,
          height: 630,
          alt: service.name,
        },
      ],
    },
  }

  // Apply noIndex if service is marked as hidden
  if (service.noIndex) {
    metadata.robots = {
      index: false,
      follow: true,
    }
  }

  return metadata
}

export const dynamicParams = true
export const dynamic = 'force-dynamic'

export default async function ServiceItemPage({
  params,
}: {
  params: Promise<{ category: string; item: string }>
}) {
  const { category, item } = await params
  const resolved = await resolveServiceForCategory(category, item)

  if (!resolved) notFound()

  const { root, service } = resolved
  const categoryName = root.name

  if (service.pageBlocks && service.pageBlocks.length > 0) {
    return (
      <main>
        {!service.noIndex && (
          <Script
            id={`service-schema-${service.id}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Service',
                name: service.name,
                provider: {
                  '@type': 'HomeAndConstructionBusiness',
                  name: 'Contigo Constructions Pty Ltd',
                  url: 'https://contigoconstructions.com.au',
                },
                description: service.shortDescription,
                areaServed: 'Adelaide, South Australia',
                url: `https://contigoconstructions.com.au/services/${category}/${item}`,
                image: service.imageUrl,
              }),
            }}
            strategy="beforeInteractive"
          />
        )}
        <PageBlockRenderer blocks={service.pageBlocks} />
      </main>
    )
  }

  return (
    <main>
      {!service.noIndex && (
        <Script
          id={`service-schema-${service.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              name: service.name,
              provider: {
                '@type': 'HomeAndConstructionBusiness',
                name: 'Contigo Constructions Pty Ltd',
                url: 'https://contigoconstructions.com.au',
              },
              description: service.shortDescription,
              areaServed: 'Adelaide, South Australia',
              url: `https://contigoconstructions.com.au/services/${category}/${item}`,
              image: service.imageUrl,
            }),
          }}
          strategy="beforeInteractive"
        />
      )}
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
          <Link
            href={`/services/${category}`}
            className="inline-block text-fluid-xs uppercase tracking-widest mb-4"
            style={{ color: '#E2C063' }}
          >
            ← Back to {categoryName}
          </Link>
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

      <LegacyServiceBody service={service} />
    </main>
  )
}

function LegacyServiceBody({ service }: { service: Service }) {
  return (
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
  )
}
