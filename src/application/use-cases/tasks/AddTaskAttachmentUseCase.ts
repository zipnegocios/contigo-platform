import { TaskAttachment } from '@/core/entities/TaskAttachment'
import { ITaskAttachmentRepository } from '@/core/repositories/ITaskAttachmentRepository'

export class AddTaskAttachmentUseCase {
  constructor(private taskAttachmentRepository: ITaskAttachmentRepository) {}

  async execute(input: { taskId: string; key: string; filename: string }): Promise<TaskAttachment> {
    const attachment = TaskAttachment.create(input)
    await this.taskAttachmentRepository.save(attachment)
    return attachment
  }
}
