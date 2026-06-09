import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'

const ReorderSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int().min(0),
      parentId: z.string().uuid().nullable(),
    }),
  ).min(1),
})

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = ReorderSchema.parse(body)

    const repo = new DrizzleCategoryRepository()
    await repo.reorder(updates)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
