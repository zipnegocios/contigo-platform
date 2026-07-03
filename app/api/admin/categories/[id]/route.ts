import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { getDescendantIds } from '@/lib/buildCategoryTree'

const UpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
})

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
    const input = UpdateSchema.parse(body)

    const repo = new DrizzleCategoryRepository()
    const category = await repo.findById(id)

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 })
    }

    // System categories may have their display name edited freely — their
    // slug is frozen by Category.withUpdates() regardless of name changes,
    // so renaming here can never break the hardcoded public route slugs
    // (SERVICE_ROOT_SLUGS) or the sitemap/fallback catalogue that key off them.

    // Prevent circular reference: new parentId must not be self or a descendant.
    // Must include inactive categories too, otherwise an inactive descendant
    // would not be detected and a cycle could slip through.
    if (input.parentId !== undefined && input.parentId !== null) {
      const flat = await repo.findFlat(category.type, false)
      const descendantIds = getDescendantIds(flat, id)
      if (input.parentId === id || descendantIds.includes(input.parentId)) {
        return Response.json({ error: 'parentId creates circular reference' }, { status: 400 })
      }
    }

    const updated = category.withUpdates(input)
    await repo.update(updated)
    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
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

    await repo.delete(id)
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
