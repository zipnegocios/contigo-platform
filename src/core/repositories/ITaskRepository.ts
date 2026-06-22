import { Task } from '../entities/Task'

export interface ITaskRepository {
  save(task: Task): Promise<void>
  findById(id: string): Promise<Task | null>
  findByLeadId(leadId: string): Promise<Task[]>
  update(task: Task): Promise<void>
}
