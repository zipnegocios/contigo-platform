import { DrizzleReviewRequestRepository } from '@/infrastructure/repositories/DrizzleReviewRequestRepository'
import { DrizzleReviewRequestTemplateRepository } from '@/infrastructure/repositories/DrizzleReviewRequestTemplateRepository'
import { DrizzleReviewSettingsRepository } from '@/infrastructure/repositories/DrizzleReviewSettingsRepository'
import { DrizzleReviewRequestSuppressionRepository } from '@/infrastructure/repositories/DrizzleReviewRequestSuppressionRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { DispatchReviewRequestsUseCase } from '@/application/use-cases/reviews/DispatchReviewRequestsUseCase'
import { verifyCronSecret } from '@/infrastructure/auth/verifyCronSecret'

// Sibling to /api/internal/reviews/sync — same CRON_SECRET-gated pattern.
// Safe to call as often as the cron schedule wants: each request's own
// scheduledFor/nextReminderAt makes it a no-op until its own due time.
export async function POST(request: Request) {
  if (!verifyCronSecret(request.headers.get('x-cron-secret'))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const useCase = new DispatchReviewRequestsUseCase(
      new DrizzleReviewRequestRepository(),
      new DrizzleReviewRequestTemplateRepository(),
      new DrizzleReviewSettingsRepository(),
      new DrizzleReviewRequestSuppressionRepository(),
      new ResendEmailService(),
    )
    const result = await useCase.execute()

    return Response.json({ success: true, result })
  } catch (error) {
    console.error('Error dispatching review requests:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
