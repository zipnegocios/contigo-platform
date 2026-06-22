import { TaskComment } from '@/core/entities/TaskComment'
import { ITaskCommentRepository } from '@/core/repositories/ITaskCommentRepository'

export class EditTaskCommentUseCase {
  constructor(private taskCommentRepository: ITaskCommentRepository) {}

  async execute(commentId: string, body: string): Promise<TaskComment> {
    const comment = await this.taskCommentRepository.findById(commentId)
    if (!comment) throw new Error('Task comment not found')

    const edited = comment.edit(body)
    await this.taskCommentRepository.update(edited)
    return edited
  }
}
