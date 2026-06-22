import { PipelineStage } from '@/core/entities/PipelineStage'
import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'

export class CreatePipelineStageUseCase {
  constructor(private pipelineStageRepository: IPipelineStageRepository) {}

  async execute(input: { key: string; label: string; color: string }): Promise<PipelineStage> {
    return this.pipelineStageRepository.create(input)
  }
}
