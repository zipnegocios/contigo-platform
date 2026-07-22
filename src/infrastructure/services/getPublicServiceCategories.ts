import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'

export interface PublicServiceCategory {
  id: string
  slug: string
  name: string
  description: string | null
  updatedAt: Date
}

/**
 * The single source of truth for "which service categories are publicly
 * visible right now". A category only qualifies if it's active AND has at
 * least one published (active, non-trashed) service assigned to it —
 * services with no category ("Uncategorized") never count toward any
 * category and are never publishable on their own.
 */
export async function getPublicServiceCategories(): Promise<PublicServiceCategory[]> {
  const categoryRepo = new DrizzleCategoryRepository()
  const serviceRepo = new DrizzleServiceRepository()

  const [categories, services] = await Promise.all([
    categoryRepo.findAll('shared', true),
    serviceRepo.findPublished(),
  ])

  const activeServiceCountByCategory = new Map<string, number>()
  for (const service of services) {
    if (!service.categoryId) continue
    activeServiceCountByCategory.set(
      service.categoryId,
      (activeServiceCountByCategory.get(service.categoryId) ?? 0) + 1,
    )
  }

  return categories
    .filter((cat) => (activeServiceCountByCategory.get(cat.id) ?? 0) > 0)
    .map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      updatedAt: cat.updatedAt,
    }))
}
