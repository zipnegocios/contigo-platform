import { eq, desc, and, gte, lte, isNull, isNotNull } from 'drizzle-orm'
import { db } from '../db/client'
import { leads, quotes } from '../db/schema'
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

  async findAllFiltered(filters: {
    stage?: string
    createdFrom?: Date
    createdTo?: Date
    includeArchived?: boolean
    onlyArchived?: boolean
  }): Promise<Lead[]> {
    const conditions = []
    if (filters.stage) conditions.push(eq(leads.stage, filters.stage as any))

    if (filters.onlyArchived) {
      conditions.push(isNotNull(leads.archivedAt))
    } else if (!filters.includeArchived) {
      conditions.push(isNull(leads.archivedAt))
    }

    // createdTo llega como el inicio del dia (medianoche UTC) cuando se parsea desde
    // un string tipo '2026-06-20'. Se extiende al final de ese mismo dia (+ ~24h - 1ms)
    // usando aritmetica de milisegundos para evitar ambiguedad UTC/local, de forma que
    // la comparacion lte incluya todo el dia y no solo su primer instante.
    const createdToEndOfDay = filters.createdTo
      ? new Date(filters.createdTo.getTime() + 24 * 60 * 60 * 1000 - 1)
      : undefined

    // El filtro de fecha se aplica sobre quotes.createdAt (fecha real de la solicitud)
    // requiere join porque leads.updatedAt cambia con cada movimiento de stage
    const rows = await db
      .select({ lead: leads, quote: quotes })
      .from(leads)
      .innerJoin(quotes, eq(leads.quoteId, quotes.id))
      .where(
        and(
          ...conditions,
          filters.createdFrom ? gte(quotes.createdAt, filters.createdFrom) : undefined,
          createdToEndOfDay ? lte(quotes.createdAt, createdToEndOfDay) : undefined,
        ),
      )
      .orderBy(desc(leads.updatedAt))

    return rows.map((r) => this.mapRowToLead(r.lead))
  }

  async update(lead: Lead): Promise<void> {
    await db
      .update(leads)
      .set({
        stage: lead.stage,
        adminNotes: lead.adminNotes,
        estimatedValue: lead.estimatedValue,
        updatedAt: lead.updatedAt,
        archivedAt: lead.archivedAt,
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
      archivedAt: row.archivedAt,
    })
  }
}
