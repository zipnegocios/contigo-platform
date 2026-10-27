import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import type { GbpConnectionStatus } from '@/core/entities/GbpConnection'
import { GoogleBusinessProfileService } from '@/infrastructure/services/GoogleBusinessProfileService'
import { interpretGbpApiError } from '@/infrastructure/services/interpretGbpApiError'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { DrizzleReviewSyncLogRepository } from '@/infrastructure/repositories/DrizzleReviewSyncLogRepository'
import { DrizzleReviewRequestRepository } from '@/infrastructure/repositories/DrizzleReviewRequestRepository'
import { DrizzleReviewSettingsRepository } from '@/infrastructure/repositories/DrizzleReviewSettingsRepository'
import { DrizzleTaskRepository } from '@/infrastructure/repositories/DrizzleTaskRepository'
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService'
import { SyncGoogleReviewsUseCase } from '@/application/use-cases/reviews/SyncGoogleReviewsUseCase'
import { RunReviewAutomationRulesUseCase } from '@/application/use-cases/reviews/RunReviewAutomationRulesUseCase'
import { SyncGoogleReviewPhotosUseCase } from '@/application/use-cases/reviews/SyncGoogleReviewPhotosUseCase'
import { DrizzleGoogleReviewPhotoRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewPhotoRepository'
import { GetGbpConnectionStatusUseCase } from '@/application/use-cases/reviews/GetGbpConnectionStatusUseCase'

type SyncErrorCode = Exclude<GbpConnectionStatus, 'connected'>

const SYNC_ERRORS: Record<SyncErrorCode, { status: number; message: string }> = {
  auth_error: { status: 409, message: 'Google Business Profile connection needs to be reconnected' },
  pending_api_approval: { status: 409, message: 'Google has not approved Business Profile API access for this project yet' },
  disconnected: { status: 409, message: 'Google Business Profile is not configured' },
  rate_limited: { status: 429, message: 'Google Business Profile API quota exceeded, try again later' },
  error: { status: 502, message: 'Google Business Profile sync failed' },
}

// Every failure returns `{ error: <code>, message }` so the admin UI can tell the cases apart.
function syncError(code: SyncErrorCode) {
  const { status, message } = SYNC_ERRORS[code]
  return Response.json({ error: code, message }, { status })
}

export async function POST() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.view'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Guard: check cached connection status before ever calling Google —
    // avoids burning the sync attempt (and logging noise) on a known-bad state.
    const connection = await new GetGbpConnectionStatusUseCase(new GoogleBusinessProfileService()).execute()
    if (
      connection.status === 'pending_api_approval' ||
      connection.status === 'disconnected' ||
      connection.status === 'auth_error'
    ) {
      console.info(`GBP sync skipped: ${connection.status}`)
      return syncError(connection.status)
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

    // Photos are best-effort: a failure here must not turn a successful review sync into an error.
    let photos = null
    try {
      photos = await new SyncGoogleReviewPhotosUseCase(
        new GoogleBusinessProfileService(),
        new DrizzleGoogleReviewRepository(),
        new DrizzleGoogleReviewPhotoRepository(),
      ).execute()
    } catch (photoError) {
      console.warn('GBP review photo sync failed:', photoError instanceof Error ? photoError.message : photoError)
    }

    return Response.json({ success: true, result, photos })
  } catch (error) {
    const code = interpretGbpApiError(error)
    if (code === 'error') console.error('Error syncing Google reviews:', error)
    else console.warn(`GBP sync failed: ${code}`)
    return syncError(code === 'connected' ? 'error' : code)
  }
}
