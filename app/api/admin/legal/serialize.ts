import type { LegalDocument } from '@/core/entities/LegalDocument'

export function serializeLegalDocument(doc: LegalDocument) {
  return {
    id: doc.id,
    slug: doc.slug,
    domain: doc.domain,
    title: doc.title,
    content: doc.content,
    contentHash: doc.contentHash,
    version: doc.version,
    status: doc.status,
    effectiveDate: doc.effectiveDate?.toISOString() ?? null,
    publishedAt: doc.publishedAt?.toISOString() ?? null,
    publishedBy: doc.publishedBy,
    createdBy: doc.createdBy,
    reviewNote: doc.reviewNote,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}
