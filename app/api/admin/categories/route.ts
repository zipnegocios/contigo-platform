import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { Category } from '@/core/entities/Category'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repo = new DrizzleCategoryRepository()
    const categories = await repo.findAll()
    return Response.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        isSystem: c.isSystem,
        createdAt: c.createdAt,
      })),
    )
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
    if (!body.name?.trim()) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    const repo = new DrizzleCategoryRepository()
    const category = Category.create(body.name.trim())
    await repo.save(category)
    return Response.json({ id: category.id, name: category.name, slug: category.slug }, { status: 201 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
