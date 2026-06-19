import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { leadActivities } from '../db/schema'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class DrizzleLeadActivityRepository implements ILeadActivityRepository {
  async save(activity: LeadActivity): Promise<void> {
    await db.insert(leadActivities).values({
      id: activity.id,
      leadId: activity.leadId,
      type: activity.type,
      payload: activity.payload,
      createdBy: activity.createdBy,
    })
  }

  async findByLeadId(leadId: string): Promise<LeadActivity[]> {
    const rows = await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt))

    return rows.map((row) =>
      LeadActivity.reconstruct({
        id: row.id,
        leadId: row.leadId,
        type: row.type,
        payload: row.payload as Record<string, unknown>,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
      }),
    )
  }
}
