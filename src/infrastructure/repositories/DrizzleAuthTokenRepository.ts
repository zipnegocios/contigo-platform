import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '../db/client'
import { authTokens } from '../db/schema'
import {
  AuthTokenRecord,
  AuthTokenType,
  IAuthTokenRepository,
} from '@/core/repositories/IAuthTokenRepository'

export class DrizzleAuthTokenRepository implements IAuthTokenRepository {
  async create(params: { userId: string; type: AuthTokenType; tokenHash: string; expiresAt: Date }): Promise<void> {
    await db.insert(authTokens).values({
      userId: params.userId,
      type: params.type,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
    })
  }

  async findValidByHash(tokenHash: string, type: AuthTokenType): Promise<AuthTokenRecord | null> {
    const rows = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.type, type),
          isNull(authTokens.usedAt),
          gt(authTokens.expiresAt, new Date()),
        ),
      )
      .limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async invalidateAllUnused(userId: string, type: AuthTokenType): Promise<void> {
    await db
      .update(authTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(authTokens.userId, userId), eq(authTokens.type, type), isNull(authTokens.usedAt)))
  }

  async markUsed(id: string): Promise<void> {
    await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, id))
  }

  private mapRow(row: typeof authTokens.$inferSelect): AuthTokenRecord {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    }
  }
}
