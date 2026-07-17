import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { ProjectGroupedView } from '@/presentation/components/admin/ProjectGroupedView'
import type { ProjectGroup } from '@/presentation/components/admin/ProjectGroupedView'
import { ProjectsTrashView } from '@/presentation/components/admin/ProjectsTrashView'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string }>
}) {
  const { trash } = await searchParams
  const isTrash = trash === '1'

  const projectRepo = new DrizzleProjectRepository()
  const categoryRepo = new DrizzleCategoryRepository()

  const [allProjects, flatCats] = await Promise.all([
    isTrash ? projectRepo.findTrashed() : projectRepo.findAll(200),
    // Include inactive categories so projects linked to a category the
    // taxonomy migration deactivates still resolve a label here.
    categoryRepo.findFlat('shared', false),
  ])

  const catMap = new Map(flatCats.map((c) => [c.id, c.name]))
  const categorySlugById = new Map(flatCats.map((c) => [c.id, c.slug]))
  const resolveCategorySlug = (p: { categoryId: string | null; category: string }) =>
    (p.categoryId && categorySlugById.get(p.categoryId)) || generateSlug(p.category)

  if (isTrash) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-fluid-3xl font-bold">Projects Trash</h1>
            <p className="text-muted-foreground">Trashed projects — restore them to bring them back.</p>
          </div>
          <Link href="/admin/projects" className="text-fluid-sm underline" style={{ color: 'var(--contigo-primary)' }}>
            Back to list
          </Link>
        </div>
        <ProjectsTrashView
          projects={allProjects.map((p) => ({
            id: p.id,
            title: p.title,
            coverImageUrl: p.coverImageUrl,
            category: p.categoryId ? (catMap.get(p.categoryId) ?? p.category) : p.category,
          }))}
        />
      </div>
    )
  }

  const byCategory = new Map<string | null, typeof allProjects>()
  for (const p of allProjects) {
    const key = p.categoryId
    byCategory.set(key, [...(byCategory.get(key) ?? []), p])
  }

  const groups: ProjectGroup[] = flatCats
    .filter((c) => byCategory.has(c.id))
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      projects: (byCategory.get(cat.id) ?? [])
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          orderIndex: p.orderIndex,
          status: p.status,
          featured: p.featured,
          coverImageUrl: p.coverImageUrl,
          categoryId: p.categoryId,
          categorySlug: resolveCategorySlug(p),
        })),
    }))

  const uncategorized = byCategory.get(null) ?? []
  if (uncategorized.length > 0) {
    groups.push({
      categoryId: null,
      categoryName: 'Uncategorized',
      projects: uncategorized
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          orderIndex: p.orderIndex,
          status: p.status,
          featured: p.featured,
          coverImageUrl: p.coverImageUrl,
          categoryId: p.categoryId,
          categorySlug: resolveCategorySlug(p),
        })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-fluid-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your portfolio projects · drag rows to reorder</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/projects?trash=1" className="text-fluid-sm underline" style={{ color: '#6B6560' }}>
            View Trash
          </Link>
          <Button asChild>
            <Link href="/admin/projects/new">New Project</Link>
          </Button>
        </div>
      </div>

      <ProjectGroupedView groups={groups} />
    </div>
  )
}
