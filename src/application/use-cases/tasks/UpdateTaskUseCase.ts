import { Task, TaskStatus } from '@/core/entities/Task'
import { ITaskRepository } from '@/core/repositories/ITaskRepository'

export class UpdateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(
    taskId: string,
    input: { title?: string; description?: string | null; dueDate?: Date | null; status?: TaskStatus },
  ): Promise<Task> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) throw new Error('Task not found')

    const updated = task.withDetails(input)
    await this.taskRepository.update(updated)
    return updated
  }
}
