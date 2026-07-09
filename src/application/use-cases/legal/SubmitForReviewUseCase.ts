import { LegalDocument } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export class SubmitForReviewUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  async execute(id: string, reviewNote?: string | null): Promise<LegalDocument> {
    const existing = await this.legalDocumentRepository.findById(id)
    if (!existing) throw new Error(`Legal document ${id} not found`)
    const submitted = existing.submitForReview(reviewNote)
    await this.legalDocumentRepository.update(submitted)
    return submitted
  }
}
