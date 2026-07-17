export type AuthTokenType = 'password_reset' | 'invitation'

export interface AuthTokenRecord {
  id: string
  userId: string
  type: AuthTokenType
  tokenHash: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

export interface IAuthTokenRepository {
  create(params: { userId: string; type: AuthTokenType; tokenHash: string; expiresAt: Date }): Promise<void>
  findValidByHash(tokenHash: string, type: AuthTokenType): Promise<AuthTokenRecord | null>
  /** Marks every unused token of this type for the user as used — invalidates any outstanding link before issuing a new one. */
  invalidateAllUnused(userId: string, type: AuthTokenType): Promise<void>
  markUsed(id: string): Promise<void>
}
