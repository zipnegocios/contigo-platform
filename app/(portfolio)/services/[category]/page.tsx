import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { getPublicServiceCategories } from '@/infrastructure/services/getPublicServiceCategories'
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
  try {
    if (!process.env.DATABASE_URL) return SERVICE_ROOT_SLUGS.map((category) => ({ category }))
    const visible = await getPublicServiceCategories()
    return visible.map((cat) => ({ category: cat.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params

  try {
    if (!process.env.DATABASE_URL) {
      if (!isServiceRootSlug(category)) return { title: 'Services not found' }
      return { title: `${SERVICE_ROOT_NAMES[category]} | Contigo Constructions` }
    }

    const visible = await getPublicServiceCategories()
    const cat = visible.find((c) => c.slug === category)
    if (!cat) return { title: 'Services not found' }

    // Use metaTitle from DB, fallback to name
    const title = `${cat.name} | Contigo Constructions`
    // Use metaDescription from DB, fallback to tagline (if one exists for this slug)
    const description = cat.description || (isServiceRootSlug(category) ? SERVICE_ROOT_TAGLINES[category] : undefined)
    const keywords: string[] = []

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

  const fallbackName = isServiceRootSlug(category) ? SERVICE_ROOT_NAMES[category] : category
  const tagline = isServiceRootSlug(category) ? SERVICE_ROOT_TAGLINES[category] : ''

  let categoryName: string = fallbackName
  let items: ServiceCategoryCarouselItem[] = isServiceRootSlug(category)
    ? SERVICE_FALLBACK_CATALOGUE[category].map((f) => ({
        slug: f.slug,
        name: f.name,
        shortDescription: f.shortDescription,
        iconKey: f.iconKey,
        imageUrl: null,
      }))
    : []
  let rootInactiveOrMissing = false
  let visibleCategories: { slug: string; name: string }[] = SERVICE_ROOT_SLUGS.map((slug) => ({
    slug,
    name: SERVICE_ROOT_NAMES[slug],
  }))
  const rootCategoryNames: Record<string, string> = { ...SERVICE_ROOT_NAMES }

  try {
    if (process.env.DATABASE_URL) {
      const categoryRepo = new DrizzleCategoryRepository()
      const serviceRepo = new DrizzleServiceRepository()

      const visible = await getPublicServiceCategories()
      visibleCategories = visible.map((cat) => ({ slug: cat.slug, name: cat.name }))
      visible.forEach((cat) => { rootCategoryNames[cat.slug] = cat.name })

      const root = visible.find((cat) => cat.slug === category)

      if (!root) {
        rootInactiveOrMissing = true
      } else {
        categoryName = root.name

        const allServices = await serviceRepo.findPublished()
        const matched = allServices
          .filter((s) => s.categoryId === root.id)
          .sort((a, b) => a.orderIndex - b.orderIndex)

        const fallback = isServiceRootSlug(category) ? SERVICE_FALLBACK_CATALOGUE[category] : []

        items = matched.map((s) => ({
          slug: s.slug,
          name: s.name,
          shortDescription: s.shortDescription,
          iconKey:
            fallback.find((f) => f.slug === s.slug)?.iconKey ?? 'new-home',
          imageUrl: s.imageUrl,
        }))
      }
    }
  } catch (error) {
    console.warn('ServiceCategoryPage: Could not fetch services for category', category, error)
    if (!isServiceRootSlug(category)) rootInactiveOrMissing = true
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
      visibleCategories={visibleCategories}
      tagline={tagline}
      items={items}
    />
  )
}
