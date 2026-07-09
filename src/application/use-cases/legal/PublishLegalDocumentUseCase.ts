import { createHash } from 'crypto'
import { LegalDocument } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'
import type { ISecurityEventLogger } from '@/core/services/ISecurityEventLogger'
import { extractHeadingIds } from '@/infrastructure/markdown/legal-markdown'
import { findMissingAnchors, type MissingAnchor } from '@/core/config/legal-requirements'

export class MissingRequiredAnchorsError extends Error {
  constructor(
    public readonly slug: string,
    public readonly missing: MissingAnchor[],
  ) {
    super(`Cannot publish "${slug}": missing required anchors ${missing.map((m) => m.anchorId).join(', ')}`)
    this.name = 'MissingRequiredAnchorsError'
  }
}

export interface PublishLegalDocumentResult {
  document: LegalDocument
  softWarnings: MissingAnchor[]
}

export class PublishLegalDocumentUseCase {
  constructor(
    private legalDocumentRepository: ILegalDocumentRepository,
    private securityEventLogger: ISecurityEventLogger,
  ) {}

  async execute(id: string, publishedBy: string, reviewNote?: string | null): Promise<PublishLegalDocumentResult> {
    const existing = await this.legalDocumentRepository.findById(id)
    if (!existing) throw new Error(`Legal document ${id} not found`)

    const anchors = extractHeadingIds(existing.content)

    const missingActive = findMissingAnchors(existing.slug, anchors, { activeOnly: true })
    if (missingActive.length > 0) {
      throw new MissingRequiredAnchorsError(existing.slug, missingActive)
    }
    const softWarnings = findMissingAnchors(existing.slug, anchors, { activeOnly: false })

    const contentHash = createHash('sha256').update(existing.content).digest('hex')
    const published = existing.publish({ contentHash, publishedBy, reviewNote })

    await this.legalDocumentRepository.publish(published)

    await this.securityEventLogger.log({
      eventType: 'legal_document_published',
      payload: { slug: published.slug, version: published.version, hash: contentHash },
      actorId: publishedBy,
    })

    return { document: published, softWarnings }
  }
}
