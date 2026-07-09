export interface CreateReviewRequestTemplateInput {
  name: string
  subject: string
  bodyHtml: string
  isDefault?: boolean
}

export class ReviewRequestTemplate {
  readonly id: string
  readonly name: string
  readonly subject: string
  readonly bodyHtml: string
  readonly isDefault: boolean
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    name: string
    subject: string
    bodyHtml: string
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.name = props.name
    this.subject = props.subject
    this.bodyHtml = props.bodyHtml
    this.isDefault = props.isDefault
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateReviewRequestTemplateInput): ReviewRequestTemplate {
    const now = new Date()
    return new ReviewRequestTemplate({
      id: crypto.randomUUID(),
      name: input.name,
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      isDefault: input.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    })
  }

  withContent(input: { name?: string; subject?: string; bodyHtml?: string }): ReviewRequestTemplate {
    return new ReviewRequestTemplate({
      ...this,
      name: input.name ?? this.name,
      subject: input.subject ?? this.subject,
      bodyHtml: input.bodyHtml ?? this.bodyHtml,
      updatedAt: new Date(),
    })
  }

  setDefault(isDefault: boolean): ReviewRequestTemplate {
    return new ReviewRequestTemplate({ ...this, isDefault, updatedAt: new Date() })
  }

  static reconstruct(props: {
    id: string
    name: string
    subject: string
    bodyHtml: string
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
  }): ReviewRequestTemplate {
    return new ReviewRequestTemplate(props)
  }
}
