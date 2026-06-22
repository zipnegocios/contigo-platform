import { PipelineStage } from '@/core/entities/PipelineStage'
import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'

export class RenamePipelineStageUseCase {
  constructor(private pipelineStageRepository: IPipelineStageRepository) {}

  async execute(id: string, label: string): Promise<PipelineStage> {
    const stage = await this.pipelineStageRepository.findById(id)
    if (!stage) throw new Error('Pipeline stage not found')

    await this.pipelineStageRepository.rename(id, label)

    const updated = await this.pipelineStageRepository.findById(id)
    if (!updated) throw new Error('Pipeline stage not found')

    return updated
  }
}
