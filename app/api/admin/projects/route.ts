import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { Project } from '@/core/entities/Project'
import type { GalleryItem } from '@/types/media'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const projectRepo = new DrizzleProjectRepository()

    const project = Project.create({
      title: body.title,
      category: body.category,
      categoryId: body.categoryId ?? null,
      description: body.description,
      location: body.location,
      completedDate: new Date(body.completedDate),
      coverImageUrl: body.coverImageUrl,
      coverPosterUrl: body.coverPosterUrl ?? null,
      galleryItems: (body.galleryItems as GalleryItem[]) || [],
    })

    await projectRepo.save(project)

    return Response.json({ id: project.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
