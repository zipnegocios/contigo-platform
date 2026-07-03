import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { ProjectTable } from '@/presentation/components/admin/ProjectTable'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'

export default async function ProjectsPage() {
  const projectRepo = new DrizzleProjectRepository()
  const categoryRepo = new DrizzleCategoryRepository()

  const [allProjects, flatCats] = await Promise.all([
    projectRepo.findAll(100),
    // Include inactive categories so projects linked to a category the
    // taxonomy migration deactivates still resolve a label here.
    categoryRepo.findFlat('shared', false),
  ])

  const catMap = new Map(flatCats.map((c) => [c.id, c.name]))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-fluid-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your portfolio projects</p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">New Project</Link>
        </Button>
      </div>

      <ProjectTable projects={allProjects.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.categoryId ? (catMap.get(p.categoryId) ?? p.category) : p.category,
        featured: p.featured,
        status: p.status,
      }))} />
    </div>
  )
}
