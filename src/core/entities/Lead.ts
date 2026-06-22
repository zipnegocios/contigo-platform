export type LeadStage = 'prospect' | 'contacted' | 'quoted' | 'won' | 'lost'

export interface CreateLeadInput {
  quoteId: string
}

export class Lead {
  readonly id: string
  readonly quoteId: string
  readonly stage: LeadStage
  readonly estimatedValue: number | null
  readonly updatedAt: Date
  readonly archivedAt: Date | null
  readonly trashedAt: Date | null

  private constructor(props: {
    id: string
    quoteId: string
    stage: LeadStage
    estimatedValue: number | null
    updatedAt: Date
    archivedAt: Date | null
    trashedAt: Date | null
  }) {
    this.id = props.id
    this.quoteId = props.quoteId
    this.stage = props.stage
    this.estimatedValue = props.estimatedValue
    this.updatedAt = props.updatedAt
    this.archivedAt = props.archivedAt
    this.trashedAt = props.trashedAt
  }

  static create(input: CreateLeadInput): Lead {
    const id = crypto.randomUUID()

    return new Lead({
      id,
      quoteId: input.quoteId,
      stage: 'prospect',
      estimatedValue: null,
      updatedAt: new Date(),
      archivedAt: null,
      trashedAt: null,
    })
  }

  withStage(stage: LeadStage): Lead {
    return new Lead({
      id: this.id,
      quoteId: this.quoteId,
      stage,
      estimatedValue: this.estimatedValue,
      updatedAt: new Date(),
      archivedAt: this.archivedAt,
      trashedAt: this.trashedAt,
    })
  }

  withEstimatedValue(value: number): Lead {
    return new Lead({
      id: this.id,
      quoteId: this.quoteId,
      stage: this.stage,
      estimatedValue: value,
      updatedAt: new Date(),
      archivedAt: this.archivedAt,
      trashedAt: this.trashedAt,
    })
  }

  /** Moves the lead to trash (soft-delete). Mirrors the legacy "Move to trash" behavior. */
  trash(): Lead {
    return new Lead({ ...this, trashedAt: new Date() })
  }

  /** Brings a trashed lead back to its previous state. */
  restoreFromTrash(): Lead {
    return new Lead({ ...this, trashedAt: null })
  }

  /** Archives the lead — distinct from trash; an active lead set aside, not deleted. */
  archive(): Lead {
    return new Lead({ ...this, archivedAt: new Date() })
  }

  /** Brings an archived lead back to the active pipeline. */
  restore(): Lead {
    return new Lead({ ...this, archivedAt: null })
  }

  static reconstruct(props: {
    id: string
    quoteId: string
    stage: LeadStage
    estimatedValue: number | null
    updatedAt: Date
    archivedAt: Date | null
    trashedAt: Date | null
  }): Lead {
    return new Lead(props)
  }
}
