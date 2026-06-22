import { eq, asc } from 'drizzle-orm'
import { db } from '../db/client'
import { taskComments } from '../db/schema'
import { TaskComment } from '@/core/entities/TaskComment'
import { ITaskCommentRepository } from '@/core/repositories/ITaskCommentRepository'

export class DrizzleTaskCommentRepository implements ITaskCommentRepository {
  async save(comment: TaskComment): Promise<void> {
    await db.insert(taskComments).values({
      id: comment.id,
      taskId: comment.taskId,
      body: comment.body,
      authorId: comment.authorId,
    })
  }

  async findById(id: string): Promise<TaskComment | null> {
    const rows = await db.select().from(taskComments).where(eq(taskComments.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByTaskId(taskId: string): Promise<TaskComment[]> {
    const rows = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt))
    return rows.map((row) => this.mapRow(row))
  }

  async update(comment: TaskComment): Promise<void> {
    await db
      .update(taskComments)
      .set({
        body: comment.body,
        editedAt: comment.editedAt,
      })
      .where(eq(taskComments.id, comment.id))
  }

  async delete(id: string): Promise<void> {
    await db.delete(taskComments).where(eq(taskComments.id, id))
  }

  private mapRow(row: any): TaskComment {
    return TaskComment.reconstruct({
      id: row.id,
      taskId: row.taskId,
      body: row.body,
      authorId: row.authorId,
      createdAt: row.createdAt,
      editedAt: row.editedAt,
    })
  }
}
