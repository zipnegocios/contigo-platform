import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleReviewTagRepository } from '@/infrastructure/repositories/DrizzleReviewTagRepository'

async function requireModeratePermission() {
  const session = await auth()
  if (!session) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }

  const userId = (session.user as any)?.id
  if (!userId || !(await hasPermission(userId, 'reviews.moderate'))) {
    return { error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { error: null }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; tagId: string }> }) {
  const { error } = await requireModeratePermission()
  if (error) return error

  try {
    const { id, tagId } = await params
    await new DrizzleReviewTagRepository().assignToReview(id, tagId)
    return Response.json({ success: true })
  } catch (err) {
    console.error('Error assigning tag to review:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; tagId: string }> }) {
  const { error } = await requireModeratePermission()
  if (error) return error

  try {
    const { id, tagId } = await params
    await new DrizzleReviewTagRepository().removeFromReview(id, tagId)
    return Response.json({ success: true })
  } catch (err) {
    console.error('Error removing tag from review:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
