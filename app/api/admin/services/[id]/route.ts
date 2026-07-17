import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { Service } from '@/core/entities/Service'
import { renamePrefix } from '@/infrastructure/services/R2StorageService'
import { generateSlug, ensureUniqueSlug } from '@/infrastructure/services/SlugGeneratorService'
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

    // Slug: a manual override (`body.slug`, from the admin's editable slug
    // field) always wins; otherwise it auto-regenerates from the name when
    // the name changes, same as before. Either way it's re-sanitized and
    // checked for uniqueness against every other service.
    const newName: string = body.name ?? service.name
    let candidateSlug: string
    if (typeof body.slug === 'string' && body.slug.trim() && generateSlug(body.slug) !== service.slug) {
      candidateSlug = generateSlug(body.slug)
    } else if (newName !== service.name) {
      candidateSlug = generateSlug(newName)
    } else {
      candidateSlug = service.slug
    }

    let newSlug = service.slug
    if (candidateSlug !== service.slug) {
      const allServices = await serviceRepo.findAll(1000)
      const existingSlugs = allServices.filter((s) => s.id !== service.id).map((s) => s.slug)
      newSlug = ensureUniqueSlug(candidateSlug, existingSlugs)
    }

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
      status: body.status !== undefined ? body.status : service.status,
      pageBlocks: body.pageBlocks !== undefined ? (body.pageBlocks as PageBlock[] | null) : service.pageBlocks,
      metaTitle: service.metaTitle,
      metaDescription: service.metaDescription,
      metaKeywords: service.metaKeywords,
      noIndex: service.noIndex,
      createdAt: service.createdAt,
      updatedAt: new Date(),
      trashedAt: service.trashedAt,
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
    await serviceRepo.trash(id)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
