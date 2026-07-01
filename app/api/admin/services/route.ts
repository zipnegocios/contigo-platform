import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { Service } from '@/core/entities/Service'
import { isServiceRootSlug } from '@/presentation/data/serviceCategoryMeta'
import type { GalleryItem } from '@/types/media'
import type { FlatCategory } from '@/types/category'

// Walks a category's parentId chain up to the root and returns the root's
// slug. The live taxonomy is exactly 2 levels (4 fixed roots, flat leaf
// service categories beneath them — see serviceCategoryMeta.ts), so walking
// all the way to `parentId === null` is equivalent to "the direct parent"
// today. If categories ever grow a 3rd level this would need the same
// "must be a direct child of root" constraint the public service page
// enforces (see app/(portfolio)/services/[category]/[item]/page.tsx).
function resolveRootSlug(categoryId: string | null, catById: Map<string, FlatCategory>): string | null {
  if (!categoryId) return null
  let node = catById.get(categoryId)
  if (!node) return null
  const visited = new Set<string>()
  while (node.parentId !== null) {
    if (visited.has(node.id)) return null
    visited.add(node.id)
    const parent = catById.get(node.parentId)
    if (!parent) return null
    node = parent
  }
  return node.slug
}

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

    const mapped = serviceList.map((s) => {
      const rootSlug = resolveRootSlug(s.categoryId, catById)
      const previewPath = rootSlug && isServiceRootSlug(rootSlug) ? `/services/${rootSlug}/${s.slug}` : null
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        imageUrl: s.imageUrl,
        previewPath,
      }
    })

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

    const service = Service.create({
      name: body.name,
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
