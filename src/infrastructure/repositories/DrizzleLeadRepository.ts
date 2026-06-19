import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { leads } from '../db/schema'
import { Lead } from '@/core/entities/Lead'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'

export class DrizzleLeadRepository implements ILeadRepository {
  async save(lead: Lead): Promise<void> {
    await db
      .insert(leads)
      .values({
        id: lead.id,
        quoteId: lead.quoteId,
        stage: lead.stage,
        adminNotes: lead.adminNotes,
        estimatedValue: lead.estimatedValue,
      })
      .onConflictDoNothing()
  }

  async findById(id: string): Promise<Lead | null> {
    const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToLead(rows[0])
  }

  async findByQuoteId(quoteId: string): Promise<Lead | null> {
    const rows = await db.select().from(leads).where(eq(leads.quoteId, quoteId)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToLead(rows[0])
  }

  async findAll(limit = 100, offset = 0): Promise<Lead[]> {
    const rows = await db
      .select()
      .from(leads)
      .orderBy(desc(leads.updatedAt))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToLead(row))
  }

  async findByStage(stage: string, limit = 100, offset = 0): Promise<Lead[]> {
    const rows = await db
      .select()
      .from(leads)
      .where(eq(leads.stage, stage as any))
      .orderBy(desc(leads.updatedAt))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToLead(row))
  }

  async update(lead: Lead): Promise<void> {
    await db
      .update(leads)
      .set({
        stage: lead.stage,
        adminNotes: lead.adminNotes,
        estimatedValue: lead.estimatedValue,
        updatedAt: lead.updatedAt,
      })
      .where(eq(leads.id, lead.id))
  }

  private mapRowToLead(row: any): Lead {
    return Lead.reconstruct({
      id: row.id,
      quoteId: row.quoteId,
      stage: row.stage,
      adminNotes: row.adminNotes,
      estimatedValue: row.estimatedValue,
      updatedAt: row.updatedAt,
    })
  }
}
