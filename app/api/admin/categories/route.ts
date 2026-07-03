import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { Category } from '@/core/entities/Category'
import type { CategoryType } from '@/types/category'

const CreateSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
})

function serializeCategory(c: Category) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    type: c.type,
    description: c.description,
    icon: c.icon,
    orderIndex: c.orderIndex,
    status: c.status,
    isSystem: c.isSystem,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as CategoryType | null

    const repo = new DrizzleCategoryRepository()
    // Admin management list must keep showing inactive categories.
    const cats = await repo.findAll(type ?? undefined, false)
    return Response.json(cats.map(serializeCategory))
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
    const input = CreateSchema.parse(body)

    const repo = new DrizzleCategoryRepository()
    const category = Category.create({
      name: input.name,
      parentId: input.parentId ?? null,
      description: input.description ?? null,
      icon: input.icon ?? null,
    })
    await repo.save(category)
    return Response.json(serializeCategory(category), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
