import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { GoogleBusinessProfileService, GbpAuthError, GbpQuotaError } from '@/infrastructure/services/GoogleBusinessProfileService'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { toGoogleReviewDTO } from '@/presentation/types/GoogleReviewDTO'

async function requireReplyPermission() {
  const session = await auth()
  if (!session) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }

  const userId = (session.user as any)?.id
  if (!userId || !(await hasPermission(userId, 'reviews.reply'))) {
    return { error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { error: null }
}

function mapGbpError(error: unknown) {
  if (error instanceof GbpAuthError) {
    return Response.json({ error: 'Google Business Profile connection needs to be reconnected' }, { status: 502 })
  }
  if (error instanceof GbpQuotaError) {
    return Response.json({ error: 'Google Business Profile API quota exceeded, try again later' }, { status: 503 })
  }
  console.error('Error publishing reply to Google:', error)
  return Response.json(
    { error: error instanceof Error ? error.message : 'Internal server error' },
    { status: 500 },
  )
}

// Publish an owner reply to Google, then reflect it locally (optimistic sync per plan Phase 3).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireReplyPermission()
  if (error) return error

  try {
    const { id } = await params
    const { comment } = await request.json()
    if (!comment || typeof comment !== 'string') {
      return Response.json({ error: 'comment is required' }, { status: 400 })
    }

    const repository = new DrizzleGoogleReviewRepository()
    const review = await repository.findById(id)
    if (!review) return Response.json({ error: 'Review not found' }, { status: 404 })

    await new GoogleBusinessProfileService().updateReply(review.googleReviewId, comment)

    const updated = review.withOwnerReply(comment)
    await repository.update(updated)

    return Response.json({ success: true, review: toGoogleReviewDTO(updated) })
  } catch (err) {
    return mapGbpError(err)
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireReplyPermission()
  if (error) return error

  try {
    const { id } = await params
    const repository = new DrizzleGoogleReviewRepository()
    const review = await repository.findById(id)
    if (!review) return Response.json({ error: 'Review not found' }, { status: 404 })

    await new GoogleBusinessProfileService().deleteReply(review.googleReviewId)

    const updated = review.withoutOwnerReply()
    await repository.update(updated)

    return Response.json({ success: true, review: toGoogleReviewDTO(updated) })
  } catch (err) {
    return mapGbpError(err)
  }
}
