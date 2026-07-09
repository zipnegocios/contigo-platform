import { LegalDocument } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export class ListLegalDocumentsUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  // Latest version per slug (admin listing + /legal index + footer).
  async execute(): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.listCurrent()
  }

  async versions(slug: string): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.listVersions(slug)
  }
}
