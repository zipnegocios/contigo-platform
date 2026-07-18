export type GbpConnectionStatus =
  | 'disconnected' // Required env vars (client id/secret/refresh token) not configured
  | 'pending_api_approval' // OAuth OK, but quota = 0 (GCP project not yet approved by Google)
  | 'connected' // OAuth OK and API responding
  | 'auth_error' // Invalid/revoked token (401/403) — reconnect required
  | 'rate_limited' // Real 429 post-approval — retry with backoff
  | 'error' // Any other failure

export interface GbpConnectionState {
  status: GbpConnectionStatus
  checkedAt: Date
  detail?: string
}
