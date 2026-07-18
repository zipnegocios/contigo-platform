import { IGoogleBusinessProfileService } from '@/core/services/IGoogleBusinessProfileService'
import { GbpConnectionState } from '@/core/entities/GbpConnection'
import { interpretGbpApiError } from '@/infrastructure/services/interpretGbpApiError'

const CACHE_TTL_MS = 15 * 60 * 1000

const REQUIRED_ENV_VARS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_LOCATION_ID']

// In-memory cache (plan §8 Q1 — no GBP settings table exists yet; this is
// lost on redeploy and the next request simply repopulates it, matching
// the module-level caching pattern already used by GoogleBusinessProfileService).
let cached: GbpConnectionState | null = null

export class GetGbpConnectionStatusUseCase {
  constructor(private gbpService: IGoogleBusinessProfileService) {}

  async execute(forceRefresh = false): Promise<GbpConnectionState> {
    if (!forceRefresh && cached && Date.now() - cached.checkedAt.getTime() < CACHE_TTL_MS) {
      return cached
    }

    const missingEnvVar = REQUIRED_ENV_VARS.find((name) => !process.env[name])
    if (missingEnvVar) {
      cached = { status: 'disconnected', checkedAt: new Date(), detail: `${missingEnvVar} is not configured` }
      return cached
    }

    try {
      await this.gbpService.checkConnection()
      cached = { status: 'connected', checkedAt: new Date() }
    } catch (error) {
      cached = {
        status: interpretGbpApiError(error),
        checkedAt: new Date(),
        detail: error instanceof Error ? error.message.slice(0, 300) : 'Unknown error',
      }
    }

    return cached
  }
}
