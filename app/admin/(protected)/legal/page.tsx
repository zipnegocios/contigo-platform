import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import { LEGAL_ANCHOR_REQUIREMENTS } from '@/core/config/legal-requirements'
import { extractHeadingIds } from '@/infrastructure/markdown/legal-markdown'
import { LegalDocumentManagerClient } from '@/presentation/components/admin/legal/LegalDocumentManagerClient'

export default async function LegalDocumentsPage() {
  const documents = await new ListLegalDocumentsUseCase(new DrizzleLegalDocumentRepository()).execute()

  const rows = documents.map((doc) => {
    const anchors = extractHeadingIds(doc.content)
    const requirements = LEGAL_ANCHOR_REQUIREMENTS[doc.slug] ?? []
    const missingActive = requirements.filter((r) => r.active && !anchors.includes(r.anchorId))
    const missingInactive = requirements.filter((r) => !r.active && !anchors.includes(r.anchorId))

    return {
      id: doc.id,
      slug: doc.slug,
      domain: doc.domain,
      title: doc.title,
      version: doc.version,
      status: doc.status,
      effectiveDate: doc.effectiveDate?.toISOString() ?? null,
      anchorsOk: missingActive.length === 0,
      hasSoftWarnings: missingInactive.length > 0,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Legal Documents
        </h1>
        <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
          Compliance pages for the website and construction services — versioned, immutable once published.
        </p>
      </div>

      <LegalDocumentManagerClient documents={rows} />
    </div>
  )
}
