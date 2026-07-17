import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'

/**
 * Resolves the category URL segment for a project's canonical
 * `/projects/[category]/[slug]` link. Falls back to slugifying the legacy
 * `category` text if the FK is missing/dangling — should be rare, but a
 * project must always resolve to *some* URL.
 */
export async function resolveProjectCategorySlug(project: { categoryId: string | null; category: string }): Promise<string> {
  if (project.categoryId) {
    const category = await new DrizzleCategoryRepository().findById(project.categoryId)
    if (category) return category.slug
  }
  return generateSlug(project.category)
}
