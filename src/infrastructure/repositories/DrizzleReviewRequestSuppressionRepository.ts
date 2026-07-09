import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { reviewRequestSuppressions } from '../db/schema'
import type { IReviewRequestSuppressionRepository } from '@/core/repositories/IReviewRequestSuppressionRepository'

export class DrizzleReviewRequestSuppressionRepository implements IReviewRequestSuppressionRepository {
  async isSuppressed(email: string): Promise<boolean> {
    const rows = await db
      .select({ id: reviewRequestSuppressions.id })
      .from(reviewRequestSuppressions)
      .where(eq(reviewRequestSuppressions.email, email.toLowerCase()))
      .limit(1)
    return rows.length > 0
  }

  async suppress(email: string): Promise<void> {
    await db
      .insert(reviewRequestSuppressions)
      .values({ email: email.toLowerCase() })
      .onConflictDoNothing()
  }
}
