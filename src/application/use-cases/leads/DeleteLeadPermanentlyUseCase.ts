import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { ILeadDocumentRepository } from '@/core/repositories/ILeadDocumentRepository'
import { ITaskAttachmentRepository } from '@/core/repositories/ITaskAttachmentRepository'
import { deleteObject } from '@/infrastructure/services/R2StorageService'

export class DeleteLeadPermanentlyUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private quoteRepository: IQuoteRepository,
    private leadDocumentRepository: ILeadDocumentRepository,
    private taskAttachmentRepository: ITaskAttachmentRepository,
  ) {}

  async execute(leadId: string): Promise<void> {
    const lead = await this.leadRepository.findById(leadId)
    if (!lead) throw new Error('Lead not found')

    if (!lead.trashedAt) {
      throw new Error('Lead must be trashed before it can be permanently deleted')
    }

    const quote = await this.quoteRepository.findById(lead.quoteId)
    if (!quote) throw new Error('Quote not found')

    const r2Targets = await this.collectR2Targets(leadId, quote.attachmentUrls)

    await this.quoteRepository.delete(quote.id)

    await this.cleanupR2(r2Targets)
  }

  private async collectR2Targets(
    leadId: string,
    quoteAttachmentUrls: string[],
  ): Promise<Array<{ bucket: string; key: string }>> {
    const assetsBucket = process.env.R2_ASSETS_BUCKET
    const quotesBucket = process.env.R2_QUOTES_BUCKET

    const targets: Array<{ bucket: string; key: string }> = []

    const documents = await this.leadDocumentRepository.findByLeadId(leadId)
    for (const doc of documents) {
      if (doc.sourceMediaId) continue // reused from the shared Media Library
      if (assetsBucket) targets.push({ bucket: assetsBucket, key: doc.fileKey })
    }

    const attachments = await this.taskAttachmentRepository.findByLeadId(leadId)
    for (const attachment of attachments) {
      if (!attachment.key.startsWith('task-attachments/')) continue // picked from Media Library
      if (quotesBucket) targets.push({ bucket: quotesBucket, key: attachment.key })
    }

    for (const url of quoteAttachmentUrls) {
      if (quotesBucket) targets.push({ bucket: quotesBucket, key: url })
    }

    return targets
  }

  private async cleanupR2(targets: Array<{ bucket: string; key: string }>): Promise<void> {
    const results = await Promise.allSettled(
      targets.map((target) => deleteObject(target.bucket, target.key)),
    )

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`Failed to delete R2 object ${targets[i].bucket}/${targets[i].key}:`, result.reason)
      }
    })
  }
}
