import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { ServiceCategoryCarousel } from '@/presentation/sections/ServiceCategoryCarousel'
import type { ServiceCategoryCarouselItem } from '@/presentation/sections/ServiceCategoryCarousel'
import {
  SERVICE_ROOT_SLUGS,
  SERVICE_ROOT_NAMES,
  SERVICE_ROOT_TAGLINES,
  SERVICE_FALLBACK_CATALOGUE,
  isServiceRootSlug,
} from '@/presentation/data/serviceCategoryMeta'

export const dynamicParams = true
export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return SERVICE_ROOT_SLUGS.map((category) => ({ category }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  if (!isServiceRootSlug(category)) return { title: 'Services not found' }
  const name = SERVICE_ROOT_NAMES[category]
  return {
    title: `${name} | Contigo Constructions`,
    description: SERVICE_ROOT_TAGLINES[category],
    openGraph: {
      title: `${name} | Contigo Constructions`,
      description: SERVICE_ROOT_TAGLINES[category],
      type: 'website',
    },
  }
}

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params

  if (!isServiceRootSlug(category)) notFound()

  const tagline = SERVICE_ROOT_TAGLINES[category]
  const fallbackName = SERVICE_ROOT_NAMES[category]

  let categoryName: string = fallbackName
  let categorySupport: string | null = null
  let items: ServiceCategoryCarouselItem[] = SERVICE_FALLBACK_CATALOGUE[category].map((f) => ({
    slug: f.slug,
    name: f.name,
    shortDescription: f.shortDescription,
    iconKey: f.iconKey,
    imageUrl: null,
    published: false,
  }))
  let usedFallback = true
  let rootInactiveOrMissing = false

  try {
    if (process.env.DATABASE_URL) {
      const categoryRepo = new DrizzleCategoryRepository()
      const serviceRepo = new DrizzleServiceRepository()

      const root = await categoryRepo.findBySlug(category, 'service')

      if (!root || !root.isActive) {
        rootInactiveOrMissing = true
      } else {
        categoryName = root.name
        categorySupport = root.description

        const flatCats = await categoryRepo.findFlat('service')
        const childIds = new Set(
          flatCats
            .filter((c) => c.parentId === root.id && c.isActive)
            .map((c) => c.id),
        )

        const allServices = await serviceRepo.findAll(100)
        const matched = allServices
          .filter((s) => s.categoryId && childIds.has(s.categoryId))
          .sort((a, b) => a.orderIndex - b.orderIndex)

        items = matched.map((s) => ({
          slug: s.slug,
          name: s.name,
          shortDescription: s.shortDescription,
          iconKey:
            flatCats.find((c) => c.id === s.categoryId)?.icon ??
            SERVICE_FALLBACK_CATALOGUE[category].find((f) => f.slug === s.slug)?.iconKey ??
            'new-home',
          imageUrl: s.imageUrl,
          published: s.published,
        }))
        usedFallback = false
      }
    }
  } catch (error) {
    console.warn('ServiceCategoryPage: Could not fetch services for category', category, error)
    usedFallback = true
    rootInactiveOrMissing = false
  }

  if (rootInactiveOrMissing) notFound()

  return (
    <>
      <div className="px-6 pt-10 pb-12 md:px-16 md:pt-12">
        <span
          className="block text-fluid-xs uppercase tracking-widest mb-4"
          style={{ color: '#A89E8C' }}
        >
          {categorySupport ?? 'Support'}
        </span>
        <h1
          className="text-fluid-5xl font-semibold leading-none mb-4"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#1E1A16' }}
        >
          {categoryName}
        </h1>
        <p
          className="text-fluid-lg max-w-2xl"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#3D3530' }}
        >
          {tagline}
        </p>
        <p className="mt-3 text-fluid-xs" style={{ color: '#A89E8C' }}>
          {items.length} service{items.length !== 1 ? 's' : ''}
          {usedFallback ? ' (offline catalogue)' : ''}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-20">
        {items.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-fluid-sm" style={{ color: '#A89E8C' }}>
              No services in this category yet. Check back soon.
            </p>
          </div>
        ) : (
          <ServiceCategoryCarousel key={category} categorySlug={category} items={items} />
        )}
      </div>
    </>
  )
}
