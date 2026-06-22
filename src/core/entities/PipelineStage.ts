export interface CreatePipelineStageInput {
  key: string
  label: string
  color: string
  position?: number
  isDefault?: boolean
  terminalKind?: 'won' | 'lost' | null
}

/**
 * Lookup entity for the configurable lead pipeline stages. Unlike `Lead`,
 * this is not an aggregate with history — it has no `with*` immutable-update
 * methods; mutations (rename, reorder) are owned by the repository and
 * expressed as direct writes, not as new entity instances.
 */
export class PipelineStage {
  readonly id: string
  readonly key: string
  readonly label: string
  readonly position: number
  readonly color: string
  readonly isDefault: boolean
  readonly terminalKind: 'won' | 'lost' | null
  readonly createdAt: Date

  private constructor(props: {
    id: string
    key: string
    label: string
    position: number
    color: string
    isDefault: boolean
    terminalKind: 'won' | 'lost' | null
    createdAt: Date
  }) {
    this.id = props.id
    this.key = props.key
    this.label = props.label
    this.position = props.position
    this.color = props.color
    this.isDefault = props.isDefault
    this.terminalKind = props.terminalKind
    this.createdAt = props.createdAt
  }

  static create(input: CreatePipelineStageInput): PipelineStage {
    return new PipelineStage({
      id: crypto.randomUUID(),
      key: input.key,
      label: input.label,
      position: input.position ?? 0,
      color: input.color,
      isDefault: input.isDefault ?? false,
      terminalKind: input.terminalKind ?? null,
      createdAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    key: string
    label: string
    position: number
    color: string
    isDefault: boolean
    terminalKind: 'won' | 'lost' | null
    createdAt: Date
  }): PipelineStage {
    return new PipelineStage(props)
  }
}
