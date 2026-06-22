import { ITaskAttachmentRepository } from '@/core/repositories/ITaskAttachmentRepository'

export class RemoveTaskAttachmentUseCase {
  constructor(private taskAttachmentRepository: ITaskAttachmentRepository) {}

  async execute(attachmentId: string): Promise<void> {
    const attachment = await this.taskAttachmentRepository.findById(attachmentId)
    if (!attachment) throw new Error('Task attachment not found')

    await this.taskAttachmentRepository.delete(attachmentId)
  }
}
