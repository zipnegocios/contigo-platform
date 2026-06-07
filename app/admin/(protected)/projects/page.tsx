import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { ProjectTable } from '@/presentation/components/admin/ProjectTable'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

export default async function ProjectsPage() {
  const projectRepo = new DrizzleProjectRepository()
  const projects = await projectRepo.findAll(100)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your portfolio projects</p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">New Project</Link>
        </Button>
      </div>

      <ProjectTable projects={projects.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        featured: p.featured,
        published: p.published,
      }))} />
    </div>
  )
}
