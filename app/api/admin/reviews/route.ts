import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { DrizzleReviewTagRepository } from '@/infrastructure/repositories/DrizzleReviewTagRepository'
import { toGoogleReviewDTO } from '@/presentation/types/GoogleReviewDTO'
import type { ReviewSentiment } from '@/core/entities/GoogleReview'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.view'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const rating = url.searchParams.get('rating')
    const isVisible = url.searchParams.get('isVisible')
    const sentiment = url.searchParams.get('sentiment')
    const tagId = url.searchParams.get('tagId')
    const hasReply = url.searchParams.get('hasReply')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    const reviewRepository = new DrizzleGoogleReviewRepository()
    const tagRepository = new DrizzleReviewTagRepository()

    const reviews = await reviewRepository.findAll({
      rating: rating ? Number(rating) : undefined,
      isVisible: isVisible ? isVisible === 'true' : undefined,
      sentiment: (sentiment as ReviewSentiment) ?? undefined,
      tagId: tagId ?? undefined,
      hasReply: hasReply ? hasReply === 'true' : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    })

    const dtos = await Promise.all(
      reviews.map(async (review) => toGoogleReviewDTO(review, await tagRepository.findTagIdsForReview(review.id))),
    )

    return Response.json({ reviews: dtos })
  } catch (error) {
    console.error('Error fetching Google reviews:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
