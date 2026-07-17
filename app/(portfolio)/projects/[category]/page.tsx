import { notFound, permanentRedirect } from 'next/navigation'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleProjectSlugHistoryRepository } from '@/infrastructure/repositories/DrizzleProjectSlugHistoryRepository'
import { resolveProjectCategorySlug } from '@/infrastructure/services/resolveProjectCategorySlug'

export const dynamic = 'force-dynamic'

/**
 * Legacy single-segment route — every project URL indexed before the
 * `/projects/[category]/[slug]` restructure looked like `/projects/[slug]`.
 * This resolves the old (or renamed-since) slug and 301s to the current
 * canonical URL instead of 404ing indexed/bookmarked links.
 *
 * The param is named `category` only because it shares this folder with
 * `[category]/[slug]/page.tsx` — Next.js requires the same dynamic segment
 * name at a given route depth. At this depth (one segment under /projects)
 * it's actually a legacy project slug, never a real category.
 */
export default async function LegacyProjectSlugRedirectPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: legacySlug } = await params
  const repo = new DrizzleProjectRepository()

  let project = await repo.findBySlug(legacySlug)

  if (!project) {
    const historyRepo = new DrizzleProjectSlugHistoryRepository()
    const projectId = await historyRepo.findProjectIdByOldSlug(legacySlug)
    if (projectId) project = await repo.findById(projectId)
  }

  if (!project || project.status !== 'active' || project.trashedAt) notFound()

  const categorySlug = await resolveProjectCategorySlug(project)
  permanentRedirect(`/projects/${categorySlug}/${project.slug}`)
}
