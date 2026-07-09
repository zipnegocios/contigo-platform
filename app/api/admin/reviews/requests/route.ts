import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleReviewRequestRepository } from '@/infrastructure/repositories/DrizzleReviewRequestRepository'
import { toReviewRequestDTO } from '@/presentation/types/ReviewRequestDTO'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.requests'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const requests = await new DrizzleReviewRequestRepository().findAll()
    return Response.json({ requests: requests.map(toReviewRequestDTO) })
  } catch (error) {
    console.error('Error fetching review requests:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
