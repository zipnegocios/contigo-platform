import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { Service } from '@/core/entities/Service'
import { generateSlug, ensureUniqueSlug } from '@/infrastructure/services/SlugGeneratorService'
import { resolveServicePreviewPath } from '@/infrastructure/services/resolveServiceRootSlug'
import type { GalleryItem } from '@/types/media'
import type { FlatCategory } from '@/types/category'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceRepo = new DrizzleServiceRepository()
    const categoryRepo = new DrizzleCategoryRepository()

    const [serviceList, flatCats] = await Promise.all([
      serviceRepo.findAll(200),
      categoryRepo.findFlat('shared'),
    ])

    const catById = new Map<string, FlatCategory>(flatCats.map((c) => [c.id, c]))

    const mapped = serviceList.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      imageUrl: s.imageUrl,
      previewPath: resolveServicePreviewPath(s, catById),
    }))

    return Response.json(mapped)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body

    const serviceRepo = new DrizzleServiceRepository()
    await serviceRepo.updateOrder(updates)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name || !body.shortDescription || !body.imageUrl) {
      return Response.json({ error: 'name, shortDescription, and imageUrl are required' }, { status: 400 })
    }

    const serviceRepo = new DrizzleServiceRepository()

    const baseSlug = generateSlug(typeof body.slug === 'string' && body.slug.trim() ? body.slug : body.name)
    const existingSlugs = (await serviceRepo.findAll(1000)).map((s) => s.slug)
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs)

    const service = Service.create({
      name: body.name,
      slug: uniqueSlug,
      shortDescription: body.shortDescription,
      fullDescription: body.fullDescription || '',
      imageUrl: body.imageUrl,
      posterUrl: body.posterUrl ?? null,
      galleryItems: (body.galleryItems as GalleryItem[]) || [],
      categoryId: body.categoryId ?? null,
    })

    await serviceRepo.save(service)
    return Response.json({ id: service.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
