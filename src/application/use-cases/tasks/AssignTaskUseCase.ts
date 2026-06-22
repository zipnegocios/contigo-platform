import { Task } from '@/core/entities/Task'
import { ITaskRepository } from '@/core/repositories/ITaskRepository'

export class AssignTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(taskId: string, assigneeId: string | null): Promise<Task> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) throw new Error('Task not found')

    const assigned = task.assign(assigneeId)
    await this.taskRepository.update(assigned)
    return assigned
  }
}
