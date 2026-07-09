import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { GoogleBusinessProfileService, GbpAuthError, GbpQuotaError } from '@/infrastructure/services/GoogleBusinessProfileService'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { DrizzleReviewSyncLogRepository } from '@/infrastructure/repositories/DrizzleReviewSyncLogRepository'
import { DrizzleReviewRequestRepository } from '@/infrastructure/repositories/DrizzleReviewRequestRepository'
import { DrizzleReviewSettingsRepository } from '@/infrastructure/repositories/DrizzleReviewSettingsRepository'
import { DrizzleTaskRepository } from '@/infrastructure/repositories/DrizzleTaskRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { SyncGoogleReviewsUseCase } from '@/application/use-cases/reviews/SyncGoogleReviewsUseCase'
import { RunReviewAutomationRulesUseCase } from '@/application/use-cases/reviews/RunReviewAutomationRulesUseCase'

export async function POST() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.view'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const useCase = new SyncGoogleReviewsUseCase(
      new GoogleBusinessProfileService(),
      new DrizzleGoogleReviewRepository(),
      new DrizzleReviewSyncLogRepository(),
      new DrizzleReviewRequestRepository(),
      new RunReviewAutomationRulesUseCase(
        new DrizzleReviewSettingsRepository(),
        new ResendEmailService(),
        new DrizzleTaskRepository(),
      ),
    )
    const result = await useCase.execute('manual')

    return Response.json({ success: true, result })
  } catch (error) {
    if (error instanceof GbpAuthError) {
      return Response.json({ error: 'Google Business Profile connection needs to be reconnected' }, { status: 502 })
    }
    if (error instanceof GbpQuotaError) {
      return Response.json({ error: 'Google Business Profile API quota exceeded, try again later' }, { status: 503 })
    }
    console.error('Error syncing Google reviews:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
