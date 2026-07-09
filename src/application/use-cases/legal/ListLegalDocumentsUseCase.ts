import { LegalDocument } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export class ListLegalDocumentsUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  // Latest version per slug, any status (admin listing).
  async execute(): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.listCurrent()
  }

  // Only slugs with a live published version (/legal index + footer).
  async published(): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.listPublished()
  }

  async versions(slug: string): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.listVersions(slug)
  }
}
