import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { Service } from '@/core/entities/Service'
import { renamePrefix } from '@/infrastructure/services/R2StorageService'
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import type { GalleryItem } from '@/types/media'
import type { PageBlock } from '@/types/pageBlocks'

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
    const serviceRepo = new DrizzleServiceRepository()
    const service = await serviceRepo.findById(id)

    if (!service) {
      return Response.json({ error: 'Service not found' }, { status: 404 })
    }

    return Response.json({
      id: service.id,
      name: service.name,
      slug: service.slug,
      imageUrl: service.imageUrl,
      posterUrl: service.posterUrl,
      galleryItems: service.galleryItems,
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

    const serviceRepo = new DrizzleServiceRepository()
    const service = await serviceRepo.findById(id)

    if (!service) {
      return Response.json({ error: 'Service not found' }, { status: 404 })
    }

    let newImageUrl: string = body.imageUrl ?? service.imageUrl
    let newPosterUrl: string | null =
      body.posterUrl !== undefined ? body.posterUrl : service.posterUrl
    let newGalleryItems: GalleryItem[] =
      body.galleryItems !== undefined ? (body.galleryItems as GalleryItem[]) : service.galleryItems

    // Detect slug change → rename R2 prefix
    const newName: string = body.name ?? service.name
    const newSlug = newName !== service.name ? generateSlug(newName) : service.slug

    if (newSlug !== service.slug) {
      const urlMap = await renamePrefix(BUCKET, `services/${service.slug}`, `services/${newSlug}`)
      newImageUrl = urlMap.get(newImageUrl) ?? newImageUrl
      newPosterUrl = newPosterUrl ? (urlMap.get(newPosterUrl) ?? newPosterUrl) : null
      newGalleryItems = newGalleryItems.map((item) => ({
        ...item,
        url: urlMap.get(item.url) ?? item.url,
      }))
    }

    const updated = Service.reconstruct({
      id: service.id,
      slug: newSlug,
      name: newName,
      shortDescription: body.shortDescription ?? service.shortDescription,
      fullDescription: body.fullDescription ?? service.fullDescription,
      imageUrl: newImageUrl,
      posterUrl: newPosterUrl,
      galleryItems: newGalleryItems,
      orderIndex: service.orderIndex,
      categoryId: body.categoryId !== undefined ? body.categoryId : service.categoryId,
      published: body.published !== undefined ? Boolean(body.published) : service.published,
      pageBlocks: body.pageBlocks !== undefined ? (body.pageBlocks as PageBlock[] | null) : service.pageBlocks,
      createdAt: service.createdAt,
      updatedAt: new Date(),
    })

    await serviceRepo.update(updated)
    return Response.json({ success: true, slug: updated.slug })
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
    const serviceRepo = new DrizzleServiceRepository()
    await serviceRepo.delete(id)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
