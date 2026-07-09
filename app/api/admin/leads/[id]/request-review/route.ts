import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadContactRepository } from '@/infrastructure/repositories/DrizzleLeadContactRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleReviewRequestRepository } from '@/infrastructure/repositories/DrizzleReviewRequestRepository'
import { DrizzleReviewRequestTemplateRepository } from '@/infrastructure/repositories/DrizzleReviewRequestTemplateRepository'
import { DrizzleReviewSettingsRepository } from '@/infrastructure/repositories/DrizzleReviewSettingsRepository'
import { DrizzleReviewRequestSuppressionRepository } from '@/infrastructure/repositories/DrizzleReviewRequestSuppressionRepository'
import { ScheduleReviewRequestUseCase } from '@/application/use-cases/reviews/ScheduleReviewRequestUseCase'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.requests'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const leadRepo = new DrizzleLeadRepository()

    const useCase = new ScheduleReviewRequestUseCase(
      leadRepo,
      new DrizzleLeadContactRepository(),
      new DrizzleQuoteRepository(),
      new DrizzleReviewRequestRepository(),
      new DrizzleReviewRequestTemplateRepository(),
      new DrizzleReviewSettingsRepository(),
      new DrizzleReviewRequestSuppressionRepository(),
    )

    const request = await useCase.execute(id)
    if (!request) {
      return Response.json(
        { error: 'Could not schedule a review request (no email on file, already pending, or unsubscribed)' },
        { status: 409 },
      )
    }

    return Response.json({ success: true, request }, { status: 201 })
  } catch (error) {
    console.error('Error scheduling review request:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
