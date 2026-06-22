import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'

export class ReorderPipelineStagesUseCase {
  constructor(private pipelineStageRepository: IPipelineStageRepository) {}

  async execute(orderedIds: string[]): Promise<void> {
    await this.pipelineStageRepository.reorder(orderedIds)
  }
}
