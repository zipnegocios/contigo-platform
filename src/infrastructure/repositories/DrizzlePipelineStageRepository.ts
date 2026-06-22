import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { pipelineStages } from '../db/schema'
import { PipelineStage } from '@/core/entities/PipelineStage'
import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'

export class DrizzlePipelineStageRepository implements IPipelineStageRepository {
  async findAll(): Promise<PipelineStage[]> {
    const rows = await db.select().from(pipelineStages).orderBy(asc(pipelineStages.position))

    return rows.map((row) => this.mapRowToPipelineStage(row))
  }

  async findById(id: string): Promise<PipelineStage | null> {
    const rows = await db.select().from(pipelineStages).where(eq(pipelineStages.id, id)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToPipelineStage(rows[0])
  }

  async create(input: { key: string; label: string; color: string }): Promise<PipelineStage> {
    const existing = await db.select().from(pipelineStages)
    const nextPosition = existing.length

    const stage = PipelineStage.create({
      key: input.key,
      label: input.label,
      color: input.color,
      position: nextPosition,
    })

    await db.insert(pipelineStages).values({
      id: stage.id,
      key: stage.key,
      label: stage.label,
      position: stage.position,
      color: stage.color,
      isDefault: stage.isDefault,
      terminalKind: stage.terminalKind,
      createdAt: stage.createdAt,
    })

    return stage
  }

  async rename(id: string, label: string): Promise<void> {
    await db.update(pipelineStages).set({ label }).where(eq(pipelineStages.id, id))
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let position = 0; position < orderedIds.length; position++) {
        await tx
          .update(pipelineStages)
          .set({ position })
          .where(eq(pipelineStages.id, orderedIds[position]))
      }
    })
  }

  private mapRowToPipelineStage(row: any): PipelineStage {
    return PipelineStage.reconstruct({
      id: row.id,
      key: row.key,
      label: row.label,
      position: row.position,
      color: row.color,
      isDefault: row.isDefault,
      terminalKind: row.terminalKind,
      createdAt: row.createdAt,
    })
  }
}
