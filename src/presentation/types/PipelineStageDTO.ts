import { PipelineStage } from '@/core/entities/PipelineStage'

export interface PipelineStageDTO {
  id: string
  key: string
  label: string
  position: number
  color: string
  isDefault: boolean
  terminalKind: 'won' | 'lost' | null
  createdAt: Date
}

export function toPipelineStageDTO(stage: PipelineStage): PipelineStageDTO {
  return {
    id: stage.id,
    key: stage.key,
    label: stage.label,
    position: stage.position,
    color: stage.color,
    isDefault: stage.isDefault,
    terminalKind: stage.terminalKind,
    createdAt: stage.createdAt,
  }
}
