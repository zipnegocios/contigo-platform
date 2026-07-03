import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import {
  ServiceCategoryCarousel,
  type ServiceCategoryCarouselItem,
} from '@/presentation/sections/ServiceCategoryCarousel'
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

      // After migration, categories are flat (no leaf nodes). Services have
      // categoryId pointing directly to the root category.
      const root = await categoryRepo.findBySlug(category, 'shared')

      if (!root || root.status !== 'active') {
        rootInactiveOrMissing = true
      } else {
        categoryName = root.name
        categorySupport = root.description

        const allServices = await serviceRepo.findAll(100)
        const matched = allServices
          .filter((s) => s.categoryId === root.id)
          .sort((a, b) => a.orderIndex - b.orderIndex)

        const fallback = SERVICE_FALLBACK_CATALOGUE[category] ?? []

        items = matched.map((s) => ({
          slug: s.slug,
          name: s.name,
          shortDescription: s.shortDescription,
          iconKey:
            fallback.find((f) => f.slug === s.slug)?.iconKey ?? 'new-home',
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

  if (items.length === 0) {
    return (
      <div className="py-32 text-center">
        <p className="text-fluid-sm" style={{ color: '#A89E8C' }}>
          No services in this category yet. Check back soon.
        </p>
      </div>
    )
  }

  return (
    <ServiceCategoryCarousel
      key={category}
      categorySlug={category}
      categoryName={categoryName}
      tagline={tagline}
      items={items}
    />
  )
}
