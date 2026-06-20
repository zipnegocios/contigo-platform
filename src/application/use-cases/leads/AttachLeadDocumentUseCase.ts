import { LeadDocument, CreateLeadDocumentInput } from '@/core/entities/LeadDocument'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadDocumentRepository } from '@/core/repositories/ILeadDocumentRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class AttachLeadDocumentUseCase {
  constructor(
    private leadDocumentRepository: ILeadDocumentRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(input: CreateLeadDocumentInput): Promise<LeadDocument> {
    const document = LeadDocument.create(input)
    await this.leadDocumentRepository.save(document)

    const activity = LeadActivity.create({
      leadId: input.leadId,
      type: input.direction === 'admin_sent' ? 'document_sent' : 'document_uploaded',
      payload: { documentId: document.id, fileName: input.fileName, category: input.category },
      createdBy: input.uploadedBy,
    })
    await this.leadActivityRepository.save(activity)

    return document
  }
}
