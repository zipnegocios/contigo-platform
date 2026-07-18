import { GoogleBusinessProfileService, GbpAuthError, GbpQuotaError } from '@/infrastructure/services/GoogleBusinessProfileService'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { DrizzleReviewSyncLogRepository } from '@/infrastructure/repositories/DrizzleReviewSyncLogRepository'
import { DrizzleReviewSettingsRepository } from '@/infrastructure/repositories/DrizzleReviewSettingsRepository'
import { DrizzleReviewRequestRepository } from '@/infrastructure/repositories/DrizzleReviewRequestRepository'
import { DrizzleTaskRepository } from '@/infrastructure/repositories/DrizzleTaskRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { SyncGoogleReviewsUseCase } from '@/application/use-cases/reviews/SyncGoogleReviewsUseCase'
import { RunReviewAutomationRulesUseCase } from '@/application/use-cases/reviews/RunReviewAutomationRulesUseCase'
import { GetGbpConnectionStatusUseCase } from '@/application/use-cases/reviews/GetGbpConnectionStatusUseCase'
import { verifyCronSecret } from '@/infrastructure/auth/verifyCronSecret'

const DEFAULT_SYNC_FREQUENCY_MINUTES = 15

export async function POST(request: Request) {
  if (!verifyCronSecret(request.headers.get('x-cron-secret'))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settingsRepository = new DrizzleReviewSettingsRepository()
    const settings = await settingsRepository.get()
    const syncFrequencyMinutes = settings?.syncFrequencyMinutes ?? DEFAULT_SYNC_FREQUENCY_MINUTES

    const syncLogRepository = new DrizzleReviewSyncLogRepository()
    const lastSuccessful = await syncLogRepository.findLatestSuccessful()
    if (lastSuccessful?.finishedAt) {
      const minutesSinceLastSync = (Date.now() - lastSuccessful.finishedAt.getTime()) / 60_000
      if (minutesSinceLastSync < syncFrequencyMinutes) {
        return Response.json({ success: true, skipped: true, reason: 'sync frequency not yet elapsed' })
      }
    }

    // Guard: check cached connection status before ever calling Google —
    // avoids burning the sync attempt (and logging noise) on a known-bad state.
    const connection = await new GetGbpConnectionStatusUseCase(new GoogleBusinessProfileService()).execute()
    if (connection.status === 'pending_api_approval' || connection.status === 'disconnected') {
      console.info(`GBP sync skipped: ${connection.status}`)
      return Response.json({ success: true, skipped: true, reason: connection.status })
    }
    if (connection.status === 'auth_error') {
      console.warn('GBP sync skipped: auth_error — reconnect required')
      return Response.json({ success: true, skipped: true, reason: 'auth_error' })
    }

    const useCase = new SyncGoogleReviewsUseCase(
      new GoogleBusinessProfileService(),
      new DrizzleGoogleReviewRepository(),
      syncLogRepository,
      new DrizzleReviewRequestRepository(),
      new RunReviewAutomationRulesUseCase(settingsRepository, new ResendEmailService(), new DrizzleTaskRepository()),
    )
    const result = await useCase.execute('scheduled')

    return Response.json({ success: true, result })
  } catch (error) {
    if (error instanceof GbpAuthError) {
      console.error('GBP reconnect required:', error.message)
      return Response.json({ error: 'Google Business Profile connection needs to be reconnected' }, { status: 502 })
    }
    if (error instanceof GbpQuotaError) {
      console.error('GBP quota exceeded:', error.message)
      return Response.json({ error: 'Google Business Profile API quota exceeded' }, { status: 503 })
    }
    console.error('Error running scheduled Google reviews sync:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
