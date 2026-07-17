import { randomBytes, createHash } from 'crypto'

export class AuthTokenService {
  generate(): { plainToken: string; tokenHash: string } {
    const plainToken = randomBytes(32).toString('hex')
    return { plainToken, tokenHash: this.hash(plainToken) }
  }

  hash(plainToken: string): string {
    return createHash('sha256').update(plainToken).digest('hex')
  }
}
