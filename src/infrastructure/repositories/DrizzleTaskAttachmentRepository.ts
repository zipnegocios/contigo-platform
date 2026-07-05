import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { taskAttachments, leadTasks } from '../db/schema'
import { TaskAttachment } from '@/core/entities/TaskAttachment'
import { ITaskAttachmentRepository } from '@/core/repositories/ITaskAttachmentRepository'

export class DrizzleTaskAttachmentRepository implements ITaskAttachmentRepository {
  async save(attachment: TaskAttachment): Promise<void> {
    await db.insert(taskAttachments).values({
      id: attachment.id,
      taskId: attachment.taskId,
      key: attachment.key,
      filename: attachment.filename,
    })
  }

  async findById(id: string): Promise<TaskAttachment | null> {
    const rows = await db.select().from(taskAttachments).where(eq(taskAttachments.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByTaskId(taskId: string): Promise<TaskAttachment[]> {
    const rows = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.createdAt))
    return rows.map((row) => this.mapRow(row))
  }

  async findByLeadId(leadId: string): Promise<TaskAttachment[]> {
    const rows = await db
      .select({
        id: taskAttachments.id,
        taskId: taskAttachments.taskId,
        key: taskAttachments.key,
        filename: taskAttachments.filename,
        createdAt: taskAttachments.createdAt,
      })
      .from(taskAttachments)
      .innerJoin(leadTasks, eq(taskAttachments.taskId, leadTasks.id))
      .where(eq(leadTasks.leadId, leadId))
    return rows.map((row) => this.mapRow(row))
  }

  async delete(id: string): Promise<void> {
    await db.delete(taskAttachments).where(eq(taskAttachments.id, id))
  }

  private mapRow(row: any): TaskAttachment {
    return TaskAttachment.reconstruct({
      id: row.id,
      taskId: row.taskId,
      key: row.key,
      filename: row.filename,
      createdAt: row.createdAt,
    })
  }
}
