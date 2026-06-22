import { Task } from '@/core/entities/Task'
import { ITaskRepository } from '@/core/repositories/ITaskRepository'

export class RestoreTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<Task> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) throw new Error('Task not found')

    const restored = task.restore()
    await this.taskRepository.update(restored)
    return restored
  }
}
