import { LeadDocument } from '@/core/entities/LeadDocument'
import { ILeadDocumentRepository } from '@/core/repositories/ILeadDocumentRepository'

export class ArchiveLeadDocumentUseCase {
  constructor(private leadDocumentRepository: ILeadDocumentRepository) {}

  async execute(documentId: string): Promise<LeadDocument> {
    const document = await this.leadDocumentRepository.findById(documentId)
    if (!document) throw new Error('Lead document not found')

    const archived = document.archive()
    await this.leadDocumentRepository.update(archived)
    return archived
  }
}
