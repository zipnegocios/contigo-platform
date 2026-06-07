import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { Service } from '@/core/entities/Service'
import type { GalleryItem } from '@/types/media'

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
    })

    await serviceRepo.save(service)
    return Response.json({ id: service.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
