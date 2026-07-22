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

  try {
    const categoryRepo = new DrizzleCategoryRepository()
    const cat = await categoryRepo.findBySlug(category, 'shared')

    if (!cat || cat.status !== 'active' || cat.trashedAt) {
      return { title: 'Services not found' }
    }

    // Use metaTitle from DB, fallback to name
    const title = cat.metaTitle || `${cat.name} | Contigo Constructions`
    // Use metaDescription from DB, fallback to tagline
    const description = cat.metaDescription || SERVICE_ROOT_TAGLINES[category]
    // Use metaKeywords from DB, fallback to empty array
    const keywords = cat.metaKeywords || []

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical: `https://contigoconstructions.com.au/services/${category}`,
      },
      openGraph: {
        title,
        description,
        url: `https://contigoconstructions.com.au/services/${category}`,
        type: 'website',
      },
    }
  } catch (error) {
    console.error(`generateMetadata error for category ${category}:`, error)
    return { title: 'Services not found' }
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
  }))
  let usedFallback = true
  let rootInactiveOrMissing = false
  const rootCategoryNames: Record<string, string> = { ...SERVICE_ROOT_NAMES }

  try {
    if (process.env.DATABASE_URL) {
      const categoryRepo = new DrizzleCategoryRepository()
      const serviceRepo = new DrizzleServiceRepository()

      // After migration, categories are flat (no leaf nodes). Services have
      // categoryId pointing directly to the root category.
      const root = await categoryRepo.findBySlug(category, 'shared')

      const allRoots = await Promise.all(
        SERVICE_ROOT_SLUGS.map((slug) => categoryRepo.findBySlug(slug, 'shared'))
      )
      allRoots.forEach((cat, i) => {
        if (cat) rootCategoryNames[SERVICE_ROOT_SLUGS[i]] = cat.name
      })

      if (!root || root.status !== 'active' || root.trashedAt) {
        rootInactiveOrMissing = true
      } else {
        categoryName = root.name
        categorySupport = root.description

        const allServices = await serviceRepo.findPublished()
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
      rootCategoryNames={rootCategoryNames}
      tagline={tagline}
      items={items}
    />
  )
}
