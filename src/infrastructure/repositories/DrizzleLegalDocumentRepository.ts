import { eq, and, or, isNull, lte, desc, max, ne } from 'drizzle-orm'
import { db } from '../db/client'
import { legalDocuments } from '../db/schema'
import { LegalDocument, LegalDocumentNotEditableError } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

type LegalDocumentRow = typeof legalDocuments.$inferSelect

function mapToEntity(row: LegalDocumentRow): LegalDocument {
  return LegalDocument.reconstruct({
    id: row.id,
    slug: row.slug,
    domain: row.domain,
    title: row.title,
    content: row.content,
    contentHash: row.contentHash ?? null,
    version: row.version,
    status: row.status,
    effectiveDate: row.effectiveDate ?? null,
    publishedAt: row.publishedAt ?? null,
    publishedBy: row.publishedBy ?? null,
    createdBy: row.createdBy ?? null,
    reviewNote: row.reviewNote ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class DrizzleLegalDocumentRepository implements ILegalDocumentRepository {
  async findById(id: string): Promise<LegalDocument | null> {
    const rows = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async getPublished(slug: string): Promise<LegalDocument | null> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .where(and(eq(legalDocuments.slug, slug), eq(legalDocuments.status, 'published')))
      .limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async getVersionEffectiveAt(slug: string, date: Date): Promise<LegalDocument | null> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .where(
        and(
          eq(legalDocuments.slug, slug),
          or(eq(legalDocuments.status, 'published'), eq(legalDocuments.status, 'archived')),
          lte(legalDocuments.effectiveDate, date),
        ),
      )
      .orderBy(desc(legalDocuments.effectiveDate))
      .limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async listCurrent(): Promise<LegalDocument[]> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .orderBy(desc(legalDocuments.version))
    // Highest version per slug, kept in a Map to preserve first-seen (highest) row.
    const bySlug = new Map<string, LegalDocumentRow>()
    for (const row of rows) {
      if (!bySlug.has(row.slug)) bySlug.set(row.slug, row)
    }
    return Array.from(bySlug.values()).map(mapToEntity)
  }

  async listVersions(slug: string): Promise<LegalDocument[]> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .where(eq(legalDocuments.slug, slug))
      .orderBy(desc(legalDocuments.version))
    return rows.map(mapToEntity)
  }

  async getMaxVersion(slug: string): Promise<number> {
    const rows = await db
      .select({ maxVersion: max(legalDocuments.version) })
      .from(legalDocuments)
      .where(eq(legalDocuments.slug, slug))
    return rows[0]?.maxVersion ?? 0
  }

  async save(document: LegalDocument): Promise<void> {
    await db.insert(legalDocuments).values({
      id: document.id,
      slug: document.slug,
      domain: document.domain,
      title: document.title,
      content: document.content,
      contentHash: document.contentHash,
      version: document.version,
      status: document.status,
      effectiveDate: document.effectiveDate,
      publishedAt: document.publishedAt,
      publishedBy: document.publishedBy,
      createdBy: document.createdBy,
      reviewNote: document.reviewNote,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    })
  }

  async update(document: LegalDocument): Promise<void> {
    const current = await this.findById(document.id)
    if (!current) throw new Error(`Legal document ${document.id} not found`)
    if (current.status === 'published' || current.status === 'archived') {
      throw new LegalDocumentNotEditableError(document.id, current.status)
    }
    if (current.status === 'in_review') {
      const contentChanged =
        document.title !== current.title ||
        document.content !== current.content ||
        document.effectiveDate?.getTime() !== current.effectiveDate?.getTime()
      if (contentChanged) {
        throw new LegalDocumentNotEditableError(document.id, current.status)
      }
    }
    await db
      .update(legalDocuments)
      .set({
        title: document.title,
        content: document.content,
        status: document.status,
        effectiveDate: document.effectiveDate,
        reviewNote: document.reviewNote,
        updatedAt: document.updatedAt,
      })
      .where(eq(legalDocuments.id, document.id))
  }

  async publish(document: LegalDocument): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(legalDocuments)
        .set({
          status: 'published',
          contentHash: document.contentHash,
          publishedAt: document.publishedAt,
          publishedBy: document.publishedBy,
          effectiveDate: document.effectiveDate,
          reviewNote: document.reviewNote,
          updatedAt: document.updatedAt,
        })
        .where(eq(legalDocuments.id, document.id))

      await tx
        .update(legalDocuments)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(
          and(
            eq(legalDocuments.slug, document.slug),
            eq(legalDocuments.status, 'published'),
            ne(legalDocuments.id, document.id),
          ),
        )
    })
  }
}
