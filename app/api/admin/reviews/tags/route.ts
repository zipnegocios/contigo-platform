import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleReviewTagRepository } from '@/infrastructure/repositories/DrizzleReviewTagRepository'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.view'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tags = await new DrizzleReviewTagRepository().findAll()
    return Response.json({ tags })
  } catch (error) {
    console.error('Error fetching review tags:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.moderate'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, color } = await request.json()
    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    const tag = await new DrizzleReviewTagRepository().create({ name, color })
    return Response.json({ success: true, tag }, { status: 201 })
  } catch (error) {
    console.error('Error creating review tag:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
