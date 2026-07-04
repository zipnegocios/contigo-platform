import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../db/client'
import { leadMessages } from '../db/schema'
import { LeadMessage } from '@/core/entities/LeadMessage'
import { ILeadMessageRepository } from '@/core/repositories/ILeadMessageRepository'

export class DrizzleLeadMessageRepository implements ILeadMessageRepository {
  async save(message: LeadMessage): Promise<void> {
    await db.insert(leadMessages).values({
      id: message.id,
      leadId: message.leadId,
      authorType: message.authorType,
      authorId: message.authorId,
      body: message.body,
      createdAt: message.createdAt,
      readAt: message.readAt,
    })
  }

  async findByLeadId(leadId: string): Promise<LeadMessage[]> {
    const rows = await db
      .select()
      .from(leadMessages)
      .where(eq(leadMessages.leadId, leadId))
      .orderBy(desc(leadMessages.createdAt))
    return rows.map((row) => this.mapRow(row))
  }

  async countUnread(leadId: string, authorType: 'client' | 'staff'): Promise<number> {
    const rows = await db
      .select({ value: count() })
      .from(leadMessages)
      .where(
        and(
          eq(leadMessages.leadId, leadId),
          eq(leadMessages.authorType, authorType),
          isNull(leadMessages.readAt),
        ),
      )
    return Number(rows[0]?.value ?? 0)
  }

  async countUnreadGroupedByLead(authorType: 'client' | 'staff'): Promise<Record<string, number>> {
    const rows = await db
      .select({ leadId: leadMessages.leadId, value: count() })
      .from(leadMessages)
      .where(and(eq(leadMessages.authorType, authorType), isNull(leadMessages.readAt)))
      .groupBy(leadMessages.leadId)

    const result: Record<string, number> = {}
    for (const row of rows) {
      result[row.leadId] = Number(row.value)
    }
    return result
  }

  async markAsRead(leadId: string, authorType: 'client' | 'staff'): Promise<void> {
    await db
      .update(leadMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(leadMessages.leadId, leadId),
          eq(leadMessages.authorType, authorType),
          isNull(leadMessages.readAt),
        ),
      )
  }

  private mapRow(row: any): LeadMessage {
    return LeadMessage.reconstruct({
      id: row.id,
      leadId: row.leadId,
      authorType: row.authorType,
      authorId: row.authorId,
      body: row.body,
      createdAt: row.createdAt,
      readAt: row.readAt,
    })
  }
}
