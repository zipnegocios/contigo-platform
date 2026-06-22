import { PipelineStage } from '../entities/PipelineStage'

export interface IPipelineStageRepository {
  /** Ordered by position ascending. */
  findAll(): Promise<PipelineStage[]>
  findById(id: string): Promise<PipelineStage | null>
  create(input: { key: string; label: string; color: string }): Promise<PipelineStage>
  rename(id: string, label: string): Promise<void>
  /** Rewrites `position` to 0..n-1 following the order of `orderedIds`. */
  reorder(orderedIds: string[]): Promise<void>
}
