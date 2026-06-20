import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { leadNotes } from '../db/schema'
import { LeadNote } from '@/core/entities/LeadNote'
import { ILeadNoteRepository } from '@/core/repositories/ILeadNoteRepository'

export class DrizzleLeadNoteRepository implements ILeadNoteRepository {
  async save(note: LeadNote): Promise<void> {
    await db.insert(leadNotes).values({
      id: note.id,
      leadId: note.leadId,
      body: note.body,
      createdBy: note.createdBy,
    })
  }

  async findById(id: string): Promise<LeadNote | null> {
    const rows = await db.select().from(leadNotes).where(eq(leadNotes.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByLeadId(leadId: string): Promise<LeadNote[]> {
    const rows = await db
      .select()
      .from(leadNotes)
      .where(eq(leadNotes.leadId, leadId))
      .orderBy(desc(leadNotes.createdAt))
    return rows.map((row) => this.mapRow(row))
  }

  async update(note: LeadNote): Promise<void> {
    await db
      .update(leadNotes)
      .set({
        body: note.body,
        updatedAt: note.updatedAt,
        archivedAt: note.archivedAt,
      })
      .where(eq(leadNotes.id, note.id))
  }

  private mapRow(row: any): LeadNote {
    return LeadNote.reconstruct({
      id: row.id,
      leadId: row.leadId,
      body: row.body,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      archivedAt: row.archivedAt,
    })
  }
}
