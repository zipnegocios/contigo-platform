import { TaskAttachment } from '../entities/TaskAttachment'

export interface ITaskAttachmentRepository {
  save(attachment: TaskAttachment): Promise<void>
  findById(id: string): Promise<TaskAttachment | null>
  findByTaskId(taskId: string): Promise<TaskAttachment[]>
  findByLeadId(leadId: string): Promise<TaskAttachment[]>
  delete(id: string): Promise<void>
}
