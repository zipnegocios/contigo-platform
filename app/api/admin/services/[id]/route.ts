import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { Service } from '@/core/entities/Service'

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

    const updated = Service.reconstruct({
      id: service.id,
      slug: service.slug,
      name: body.name ?? service.name,
      shortDescription: body.shortDescription ?? service.shortDescription,
      fullDescription: body.fullDescription ?? service.fullDescription,
      imageUrl: body.imageUrl ?? service.imageUrl,
      orderIndex: service.orderIndex,
      published: body.published !== undefined ? Boolean(body.published) : service.published,
      createdAt: service.createdAt,
      updatedAt: new Date(),
    })

    await serviceRepo.update(updated)
    return Response.json({ success: true })
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
