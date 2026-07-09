import { notFound } from 'next/navigation'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import { LEGAL_ANCHOR_REQUIREMENTS } from '@/core/config/legal-requirements'
import { extractHeadingIds } from '@/infrastructure/markdown/legal-markdown'
import { LegalDocumentEditorClient } from '@/presentation/components/admin/legal/LegalDocumentEditorClient'

export default async function LegalDocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repository = new DrizzleLegalDocumentRepository()
  const document = await repository.findById(id)
  if (!document) notFound()

  const versions = await new ListLegalDocumentsUseCase(repository).versions(document.slug)
  const staff = await new DrizzleAdminUserRepository().findAll()
  const nameById = new Map(staff.map((u) => [u.id, u.name]))

  const previousPublished = versions.find((v) => v.id !== document.id && v.status === 'published') ?? null

  const anchors = extractHeadingIds(document.content)
  const requirements = LEGAL_ANCHOR_REQUIREMENTS[document.slug] ?? []

  return (
    <LegalDocumentEditorClient
      document={{
        id: document.id,
        slug: document.slug,
        domain: document.domain,
        title: document.title,
        content: document.content,
        version: document.version,
        status: document.status,
        effectiveDate: document.effectiveDate?.toISOString() ?? null,
        reviewNote: document.reviewNote,
        contentHash: document.contentHash,
      }}
      previousPublishedContent={previousPublished?.content ?? null}
      requirements={requirements.map((r) => ({
        anchorId: r.anchorId,
        requiredBy: r.requiredBy,
        active: r.active,
        present: anchors.includes(r.anchorId),
      }))}
      versions={versions.map((v) => ({
        id: v.id,
        version: v.version,
        status: v.status,
        contentHash: v.contentHash,
        publishedAt: v.publishedAt?.toISOString() ?? null,
        publishedByName: v.publishedBy ? (nameById.get(v.publishedBy) ?? v.publishedBy) : null,
      }))}
    />
  )
}
