import type { GbpConnectionStatus } from '@/core/entities/GbpConnection'
import { GbpAuthError, GbpQuotaError, GbpTransientError } from '@/infrastructure/services/GoogleBusinessProfileService'

interface GoogleApiErrorDetail {
  '@type'?: string
  metadata?: Record<string, string>
}

interface NormalizedGoogleError {
  code?: number
  status?: string
  details?: GoogleApiErrorDetail[]
}

/**
 * Normalizes whatever was thrown/caught into the canonical Google API error
 * body shape (`{ code, status, details }`). Handles two cases:
 * - The real path in this codebase: one of the Gbp*Error classes thrown by
 *   GoogleBusinessProfileService, carrying a `.body` (parsed JSON, may be
 *   undefined if the response wasn't valid JSON).
 * - A generic/raw error-like object (e.g. test fixtures using the plain
 *   Google API error JSON directly, or `{ error: {...} }` / bare `{...}`).
 */
function normalizeGoogleError(error: unknown): NormalizedGoogleError {
  const body =
    error instanceof GbpAuthError || error instanceof GbpQuotaError || error instanceof GbpTransientError
      ? error.body
      : error

  if (!body || typeof body !== 'object') return {}
  const record = body as Record<string, unknown>
  const inner = 'error' in record ? record.error : record
  if (!inner || typeof inner !== 'object') return {}
  return inner as NormalizedGoogleError
}

export function interpretGbpApiError(error: unknown): GbpConnectionStatus {
  if (error instanceof GbpAuthError) return 'auth_error'
  if (error instanceof GbpTransientError) return 'error'

  const normalized = normalizeGoogleError(error)
  const code = normalized.code

  if (code === 401 || code === 403) return 'auth_error'

  if (code === 429 || error instanceof GbpQuotaError) {
    const errorInfo = normalized.details?.find((d) => d['@type']?.includes('google.rpc.ErrorInfo'))
    const quotaLimitValue = errorInfo?.metadata?.quota_limit_value

    // quota_limit_value "0" means the GCP project has not been
    // approved for Business Profile API access. This is NOT rate
    // limiting — retrying is pointless until Google approves.
    if (quotaLimitValue === '0') return 'pending_api_approval'

    return 'rate_limited'
  }

  return 'error'
}
