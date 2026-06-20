import { eq, asc, and, gte, lte } from 'drizzle-orm'
import { db } from '../db/client'
import { leadEvents } from '../db/schema'
import { LeadEvent } from '@/core/entities/LeadEvent'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'

export class DrizzleLeadEventRepository implements ILeadEventRepository {
  async save(event: LeadEvent): Promise<void> {
    await db.insert(leadEvents).values({
      id: event.id,
      leadId: event.leadId,
      type: event.type,
      scheduledAt: event.scheduledAt,
      durationMinutes: event.durationMinutes,
      status: event.status,
      location: event.location,
      notes: event.notes,
      createdBy: event.createdBy,
      metadata: event.metadata,
    })
  }

  async findById(id: string): Promise<LeadEvent | null> {
    const rows = await db.select().from(leadEvents).where(eq(leadEvents.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByLeadId(leadId: string): Promise<LeadEvent[]> {
    const rows = await db
      .select()
      .from(leadEvents)
      .where(eq(leadEvents.leadId, leadId))
      .orderBy(asc(leadEvents.scheduledAt))
    return rows.map(this.mapRow)
  }

  async findUpcoming(from: Date, to: Date): Promise<LeadEvent[]> {
    const rows = await db
      .select()
      .from(leadEvents)
      .where(and(gte(leadEvents.scheduledAt, from), lte(leadEvents.scheduledAt, to)))
      .orderBy(asc(leadEvents.scheduledAt))
    return rows.map(this.mapRow)
  }

  async update(event: LeadEvent): Promise<void> {
    await db
      .update(leadEvents)
      .set({
        status: event.status,
        notes: event.notes,
        scheduledAt: event.scheduledAt,
        durationMinutes: event.durationMinutes,
        updatedAt: event.updatedAt,
        metadata: event.metadata,
        archivedAt: event.archivedAt,
      })
      .where(eq(leadEvents.id, event.id))
  }

  private mapRow(row: any): LeadEvent {
    return LeadEvent.reconstruct({
      id: row.id,
      leadId: row.leadId,
      type: row.type,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      status: row.status,
      location: row.location,
      notes: row.notes,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      metadata: row.metadata,
      archivedAt: row.archivedAt,
    })
  }
}
