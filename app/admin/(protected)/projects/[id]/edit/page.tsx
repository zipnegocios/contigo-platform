import { notFound } from 'next/navigation'
import { ProjectForm } from '@/presentation/components/admin/ProjectForm'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const projectRepo = new DrizzleProjectRepository()
  const project = await projectRepo.findById(params.id)

  if (!project) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground">{project.title}</p>
      </div>

      <ProjectForm
        project={{
          id: project.id,
          slug: project.slug,
          title: project.title,
          category: project.category,
          categoryId: project.categoryId,
          description: project.description,
          location: project.location,
          completedDate: project.completedDate.toISOString().split('T')[0],
          featured: project.featured,
          published: project.published,
          coverImageUrl: project.coverImageUrl,
          coverPosterUrl: project.coverPosterUrl,
          galleryItems: project.galleryItems,
        }}
      />
    </div>
  )
}
