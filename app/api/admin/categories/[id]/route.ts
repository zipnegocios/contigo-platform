import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'

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

    if (!body.name?.trim()) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    const repo = new DrizzleCategoryRepository()
    const category = await repo.findById(id)

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category.isSystem) {
      return Response.json({ error: 'Cannot rename system category' }, { status: 403 })
    }

    const updated = category.withName(body.name.trim())
    await repo.update(updated)
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
    const repo = new DrizzleCategoryRepository()
    const category = await repo.findById(id)

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category.isSystem) {
      return Response.json({ error: 'Cannot delete system category' }, { status: 403 })
    }

    await repo.delete(id, 'Uncategorized')
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
