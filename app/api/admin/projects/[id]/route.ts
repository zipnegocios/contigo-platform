import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { Project } from '@/core/entities/Project'
import { renamePrefix } from '@/infrastructure/services/R2StorageService'
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import type { GalleryItem } from '@/types/media'

const BUCKET = process.env.R2_ASSETS_BUCKET || 'contigo-assets'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    return Response.json({
      id: project.id,
      title: project.title,
      slug: project.slug,
      coverImageUrl: project.coverImageUrl,
      coverPosterUrl: project.coverPosterUrl,
      galleryItems: project.galleryItems,
    })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    let newGalleryItems: GalleryItem[] =
      body.galleryItems !== undefined ? (body.galleryItems as GalleryItem[]) : project.galleryItems
    let newCoverImageUrl: string = body.coverImageUrl || project.coverImageUrl
    let newCoverPosterUrl: string | null =
      body.coverPosterUrl !== undefined ? body.coverPosterUrl : project.coverPosterUrl

    // Detect slug change → rename R2 prefixes
    const newTitle: string = body.title || project.title
    const newSlug = newTitle !== project.title ? generateSlug(newTitle) : project.slug

    if (newSlug !== project.slug) {
      const oldCoverPrefix = `projects/cover/${project.slug}`
      const newCoverPrefix = `projects/cover/${newSlug}`
      const oldGalleryPrefix = `projects/gallery/${project.slug}`
      const newGalleryPrefix = `projects/gallery/${newSlug}`

      const [coverMap, galleryMap] = await Promise.all([
        renamePrefix(BUCKET, oldCoverPrefix, newCoverPrefix),
        renamePrefix(BUCKET, oldGalleryPrefix, newGalleryPrefix),
      ])

      newCoverImageUrl = coverMap.get(newCoverImageUrl) ?? newCoverImageUrl
      newCoverPosterUrl = newCoverPosterUrl ? (coverMap.get(newCoverPosterUrl) ?? newCoverPosterUrl) : null
      newGalleryItems = newGalleryItems.map((item) => ({
        ...item,
        url: galleryMap.get(item.url) ?? item.url,
      }))
    }

    // When categoryId changes, resolve the category name to keep the
    // legacy varchar column in sync with the FK.
    const newCategoryId: string | null =
      body.categoryId !== undefined ? body.categoryId : project.categoryId
    let newCategoryName: string = body.category || project.category
    if (body.categoryId && body.categoryId !== project.categoryId) {
      const catRepo = new DrizzleCategoryRepository()
      const cat = await catRepo.findById(body.categoryId)
      if (cat) newCategoryName = cat.name
    }

    const updatedProject = Project.reconstruct({
      id: project.id,
      slug: newSlug,
      title: newTitle,
      category: newCategoryName,
      categoryId: newCategoryId,
      description: body.description || project.description,
      location: body.location || project.location,
      completedDate: body.completedDate ? new Date(body.completedDate) : project.completedDate,
      featured: body.featured !== undefined ? body.featured : project.featured,
      status: body.status !== undefined ? body.status : project.status,
      coverImageUrl: newCoverImageUrl,
      coverPosterUrl: newCoverPosterUrl,
      galleryItems: newGalleryItems,
      createdAt: project.createdAt,
      updatedAt: new Date(),
    })

    await projectRepo.update(updatedProject)

    return Response.json({ success: true, slug: updatedProject.slug })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    await projectRepo.delete(id)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
