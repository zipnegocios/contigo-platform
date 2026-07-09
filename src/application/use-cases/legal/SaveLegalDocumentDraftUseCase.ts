import { LegalDocument, type LegalDomain } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export interface SaveLegalDocumentDraftInput {
  slug: string
  domain: LegalDomain
  title: string
  content: string
  effectiveDate?: Date | null
  createdBy: string | null
}

export class SaveLegalDocumentDraftUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  // Always creates a new row. First draft for a slug is v1; every edit after
  // an approved version is published starts life as a fresh vN+1 draft — the
  // approved text is inalterable (plan §5, post-approval rule).
  async execute(input: SaveLegalDocumentDraftInput): Promise<LegalDocument> {
    const maxVersion = await this.legalDocumentRepository.getMaxVersion(input.slug)
    const draft = LegalDocument.createDraft({
      slug: input.slug,
      domain: input.domain,
      title: input.title,
      content: input.content,
      effectiveDate: input.effectiveDate,
      createdBy: input.createdBy,
      version: maxVersion + 1,
    })
    await this.legalDocumentRepository.save(draft)
    return draft
  }

  // Edits an existing draft/in_review row in place (guarded by the repository).
  async executeEdit(id: string, partial: { title?: string; content?: string; effectiveDate?: Date | null }): Promise<LegalDocument> {
    const existing = await this.legalDocumentRepository.findById(id)
    if (!existing) throw new Error(`Legal document ${id} not found`)
    const updated = existing.withEdits(partial)
    await this.legalDocumentRepository.update(updated)
    return updated
  }
}
