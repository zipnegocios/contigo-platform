import { LegalDocument } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export class GetPublishedLegalDocumentUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  async execute(slug: string): Promise<LegalDocument | null> {
    return this.legalDocumentRepository.getPublished(slug)
  }
}
