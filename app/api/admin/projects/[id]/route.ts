import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { Project } from '@/core/entities/Project'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(params.id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Reconstruct the entity with all properties, allowing partial updates
    const updatedProject = Project.reconstruct({
      id: project.id,
      slug: project.slug,
      title: body.title || project.title,
      category: body.category || project.category,
      description: body.description || project.description,
      location: body.location || project.location,
      completedDate: body.completedDate ? new Date(body.completedDate) : project.completedDate,
      featured: body.featured !== undefined ? body.featured : project.featured,
      published: body.published !== undefined ? body.published : project.published,
      coverImageUrl: body.coverImageUrl || project.coverImageUrl,
      galleryUrls: body.galleryUrls !== undefined ? body.galleryUrls : project.galleryUrls,
      createdAt: project.createdAt,
      updatedAt: new Date(),
    })

    await projectRepo.update(updatedProject)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(params.id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    await projectRepo.delete(params.id)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
