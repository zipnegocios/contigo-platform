import { ITaskCommentRepository } from '@/core/repositories/ITaskCommentRepository'

export class DeleteTaskCommentUseCase {
  constructor(private taskCommentRepository: ITaskCommentRepository) {}

  async execute(commentId: string): Promise<void> {
    const comment = await this.taskCommentRepository.findById(commentId)
    if (!comment) throw new Error('Task comment not found')

    await this.taskCommentRepository.delete(commentId)
  }
}
