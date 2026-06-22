import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { leadContacts } from '../db/schema'
import { LeadContact } from '@/core/entities/LeadContact'
import { ILeadContactRepository } from '@/core/repositories/ILeadContactRepository'

export class DrizzleLeadContactRepository implements ILeadContactRepository {
  async save(contact: LeadContact): Promise<void> {
    await db.insert(leadContacts).values({
      id: contact.id,
      leadId: contact.leadId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      roleId: contact.roleId,
      isPrimary: contact.isPrimary,
    })
  }

  async findById(id: string): Promise<LeadContact | null> {
    const rows = await db.select().from(leadContacts).where(eq(leadContacts.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByLeadId(leadId: string): Promise<LeadContact[]> {
    const rows = await db
      .select()
      .from(leadContacts)
      .where(eq(leadContacts.leadId, leadId))
      .orderBy(desc(leadContacts.createdAt))
    return rows.map((row) => this.mapRow(row))
  }

  async update(contact: LeadContact): Promise<void> {
    await db
      .update(leadContacts)
      .set({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        roleId: contact.roleId,
        isPrimary: contact.isPrimary,
        updatedAt: contact.updatedAt,
        archivedAt: contact.archivedAt,
      })
      .where(eq(leadContacts.id, contact.id))
  }

  private mapRow(row: any): LeadContact {
    return LeadContact.reconstruct({
      id: row.id,
      leadId: row.leadId,
      name: row.name,
      phone: row.phone,
      email: row.email,
      roleId: row.roleId,
      isPrimary: row.isPrimary,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      archivedAt: row.archivedAt,
    })
  }
}
