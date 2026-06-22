import { Task } from '@/core/entities/Task'
import { ITaskRepository } from '@/core/repositories/ITaskRepository'

export class CreateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(input: {
    leadId: string
    title: string
    description?: string
    dueDate?: Date | null
    assigneeId?: string | null
  }): Promise<Task> {
    const task = Task.create(input)
    await this.taskRepository.save(task)
    return task
  }
}
