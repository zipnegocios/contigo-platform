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

  private constructor(props: {
    id: string
    quoteId: string
    stage: LeadStage
    estimatedValue: number | null
    updatedAt: Date
    archivedAt: Date | null
  }) {
    this.id = props.id
    this.quoteId = props.quoteId
    this.stage = props.stage
    this.estimatedValue = props.estimatedValue
    this.updatedAt = props.updatedAt
    this.archivedAt = props.archivedAt
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
    })
  }

  archive(): Lead {
    return new Lead({ ...this, archivedAt: new Date() })
  }

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
  }): Lead {
    return new Lead(props)
  }
}
