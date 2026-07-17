import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { projectSlugHistory } from '../db/schema'
import { IProjectSlugHistoryRepository } from '@/core/repositories/IProjectSlugHistoryRepository'

export class DrizzleProjectSlugHistoryRepository implements IProjectSlugHistoryRepository {
  async record(projectId: string, oldSlug: string): Promise<void> {
    await db.insert(projectSlugHistory).values({ projectId, oldSlug })
  }

  async findProjectIdByOldSlug(oldSlug: string): Promise<string | null> {
    const rows = await db
      .select({ projectId: projectSlugHistory.projectId })
      .from(projectSlugHistory)
      .where(eq(projectSlugHistory.oldSlug, oldSlug))
      .limit(1)
    return rows[0]?.projectId ?? null
  }
}
