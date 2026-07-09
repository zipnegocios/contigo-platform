import crypto from 'crypto'

// Constant-time comparison over fixed-length digests avoids leaking the
// expected secret's length via early-exit string comparison.
export function verifyCronSecret(providedSecret: string | null): boolean {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret || !providedSecret) return false

  const providedDigest = crypto.createHash('sha256').update(providedSecret).digest()
  const expectedDigest = crypto.createHash('sha256').update(expectedSecret).digest()
  return crypto.timingSafeEqual(providedDigest, expectedDigest)
}
