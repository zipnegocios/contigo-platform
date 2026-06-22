import { Task } from '@/core/entities/Task'
import { ITaskRepository } from '@/core/repositories/ITaskRepository'

export class ArchiveTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<Task> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) throw new Error('Task not found')

    const archived = task.archive()
    await this.taskRepository.update(archived)
    return archived
  }
}
