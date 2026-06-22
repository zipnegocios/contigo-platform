import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { leadTasks } from '../db/schema'
import { Task } from '@/core/entities/Task'
import { ITaskRepository } from '@/core/repositories/ITaskRepository'

export class DrizzleTaskRepository implements ITaskRepository {
  async save(task: Task): Promise<void> {
    await db.insert(leadTasks).values({
      id: task.id,
      leadId: task.leadId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
      assigneeId: task.assigneeId,
    })
  }

  async findById(id: string): Promise<Task | null> {
    const rows = await db.select().from(leadTasks).where(eq(leadTasks.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByLeadId(leadId: string): Promise<Task[]> {
    const rows = await db
      .select()
      .from(leadTasks)
      .where(eq(leadTasks.leadId, leadId))
      .orderBy(desc(leadTasks.createdAt))
    return rows.map((row) => this.mapRow(row))
  }

  async update(task: Task): Promise<void> {
    await db
      .update(leadTasks)
      .set({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        assigneeId: task.assigneeId,
        updatedAt: task.updatedAt,
        archivedAt: task.archivedAt,
      })
      .where(eq(leadTasks.id, task.id))
  }

  private mapRow(row: any): Task {
    return Task.reconstruct({
      id: row.id,
      leadId: row.leadId,
      title: row.title,
      description: row.description,
      dueDate: row.dueDate,
      status: row.status,
      assigneeId: row.assigneeId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      archivedAt: row.archivedAt,
    })
  }
}
