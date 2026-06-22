import { TaskComment } from '@/core/entities/TaskComment'
import { ITaskCommentRepository } from '@/core/repositories/ITaskCommentRepository'

export class AddTaskCommentUseCase {
  constructor(private taskCommentRepository: ITaskCommentRepository) {}

  async execute(input: { taskId: string; body: string; authorId?: string }): Promise<TaskComment> {
    const comment = TaskComment.create(input)
    await this.taskCommentRepository.save(comment)
    return comment
  }
}
