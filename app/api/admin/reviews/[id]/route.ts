import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { DrizzleReviewTagRepository } from '@/infrastructure/repositories/DrizzleReviewTagRepository'
import { toGoogleReviewDTO } from '@/presentation/types/GoogleReviewDTO'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.moderate'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const repository = new DrizzleGoogleReviewRepository()
    let review = await repository.findById(id)
    if (!review) return Response.json({ error: 'Review not found' }, { status: 404 })

    if (typeof body.isVisible === 'boolean') {
      review = body.isVisible ? review.show() : review.hide()
    }
    if (typeof body.isFeatured === 'boolean') {
      review = review.setFeatured(body.isFeatured)
    }
    if (typeof body.isPinned === 'boolean') {
      review = review.setPinned(body.isPinned)
    }
    if (typeof body.archived === 'boolean') {
      review = body.archived ? review.archive() : review.restore()
    }
    if (typeof body.internalNotes === 'string' || body.internalNotes === null) {
      review = review.withInternalNotes(body.internalNotes)
    }

    await repository.update(review)

    const tagRepository = new DrizzleReviewTagRepository()
    const tagIds = await tagRepository.findTagIdsForReview(review.id)

    return Response.json({ success: true, review: toGoogleReviewDTO(review, tagIds) })
  } catch (error) {
    console.error('Error updating Google review:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
