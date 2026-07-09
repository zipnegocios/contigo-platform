import crypto from 'crypto'

// Reuses NEXTAUTH_SECRET rather than introducing a dedicated env var — this
// token only gates an unsubscribe action (worst case of a guessed token is
// someone else opting an email out of review-request emails), not an auth
// boundary, so borrowing an existing strong secret is an acceptable tradeoff.
function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET environment variable is not defined')
  return secret
}

export function generateUnsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', getSecret()).update(email.toLowerCase()).digest('hex')
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email)
  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(token)
  if (expectedBuf.length !== providedBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, providedBuf)
}
