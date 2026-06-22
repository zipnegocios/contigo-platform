import { eq, asc } from 'drizzle-orm'
import { db } from '../db/client'
import { taskChecklistItems } from '../db/schema'
import { TaskChecklistItem } from '@/core/entities/TaskChecklistItem'
import { ITaskChecklistItemRepository } from '@/core/repositories/ITaskChecklistItemRepository'

export class DrizzleTaskChecklistItemRepository implements ITaskChecklistItemRepository {
  async save(item: TaskChecklistItem): Promise<void> {
    await db.insert(taskChecklistItems).values({
      id: item.id,
      taskId: item.taskId,
      label: item.label,
      position: item.position,
      isChecked: item.isChecked,
    })
  }

  async findById(id: string): Promise<TaskChecklistItem | null> {
    const rows = await db.select().from(taskChecklistItems).where(eq(taskChecklistItems.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByTaskId(taskId: string): Promise<TaskChecklistItem[]> {
    const rows = await db
      .select()
      .from(taskChecklistItems)
      .where(eq(taskChecklistItems.taskId, taskId))
      .orderBy(asc(taskChecklistItems.position))
    return rows.map((row) => this.mapRow(row))
  }

  async update(item: TaskChecklistItem): Promise<void> {
    await db
      .update(taskChecklistItems)
      .set({
        label: item.label,
        position: item.position,
        isChecked: item.isChecked,
      })
      .where(eq(taskChecklistItems.id, item.id))
  }

  async delete(id: string): Promise<void> {
    await db.delete(taskChecklistItems).where(eq(taskChecklistItems.id, id))
  }

  private mapRow(row: any): TaskChecklistItem {
    return TaskChecklistItem.reconstruct({
      id: row.id,
      taskId: row.taskId,
      label: row.label,
      position: row.position,
      isChecked: row.isChecked,
    })
  }
}
