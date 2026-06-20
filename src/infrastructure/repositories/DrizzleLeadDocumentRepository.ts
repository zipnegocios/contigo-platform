import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { leadDocuments } from '../db/schema'
import { LeadDocument } from '@/core/entities/LeadDocument'
import { ILeadDocumentRepository } from '@/core/repositories/ILeadDocumentRepository'

export class DrizzleLeadDocumentRepository implements ILeadDocumentRepository {
  async save(document: LeadDocument): Promise<void> {
    await db.insert(leadDocuments).values({
      id: document.id,
      leadId: document.leadId,
      fileKey: document.fileKey,
      fileName: document.fileName,
      mimeType: document.mimeType,
      direction: document.direction,
      category: document.category,
      sourceMediaId: document.sourceMediaId,
      uploadedBy: document.uploadedBy,
    })
  }

  async findById(id: string): Promise<LeadDocument | null> {
    const rows = await db.select().from(leadDocuments).where(eq(leadDocuments.id, id)).limit(1)
    const row = rows[0]
    if (!row) return null

    return LeadDocument.reconstruct({
      id: row.id,
      leadId: row.leadId,
      fileKey: row.fileKey,
      fileName: row.fileName,
      mimeType: row.mimeType,
      direction: row.direction,
      category: row.category,
      sourceMediaId: row.sourceMediaId,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt,
      archivedAt: row.archivedAt,
    })
  }

  async findByLeadId(leadId: string): Promise<LeadDocument[]> {
    const rows = await db
      .select()
      .from(leadDocuments)
      .where(eq(leadDocuments.leadId, leadId))
      .orderBy(desc(leadDocuments.createdAt))

    return rows.map((row) =>
      LeadDocument.reconstruct({
        id: row.id,
        leadId: row.leadId,
        fileKey: row.fileKey,
        fileName: row.fileName,
        mimeType: row.mimeType,
        direction: row.direction,
        category: row.category,
        sourceMediaId: row.sourceMediaId,
        uploadedBy: row.uploadedBy,
        createdAt: row.createdAt,
        archivedAt: row.archivedAt,
      }),
    )
  }

  async update(document: LeadDocument): Promise<void> {
    await db
      .update(leadDocuments)
      .set({ archivedAt: document.archivedAt })
      .where(eq(leadDocuments.id, document.id))
  }
}
