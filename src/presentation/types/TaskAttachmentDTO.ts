import { TaskAttachment } from '@/core/entities/TaskAttachment'

export interface TaskAttachmentDTO {
  id: string
  taskId: string
  key: string
  filename: string
  createdAt: Date
}

export function toTaskAttachmentDTO(attachment: TaskAttachment): TaskAttachmentDTO {
  return {
    id: attachment.id,
    taskId: attachment.taskId,
    key: attachment.key,
    filename: attachment.filename,
    createdAt: attachment.createdAt,
  }
}
