import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'

export async function POST(
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
    await repo.restore(id)
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
