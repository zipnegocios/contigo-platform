export type TaskStatus = 'open' | 'in_progress' | 'done'

export interface CreateTaskInput {
  leadId: string
  title: string
  description?: string
  dueDate?: Date | null
  assigneeId?: string | null
}

export class Task {
  readonly id: string
  readonly leadId: string
  readonly title: string
  readonly description: string | null
  readonly dueDate: Date | null
  readonly status: TaskStatus
  readonly assigneeId: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly archivedAt: Date | null

  private constructor(props: {
    id: string
    leadId: string
    title: string
    description: string | null
    dueDate: Date | null
    status: TaskStatus
    assigneeId: string | null
    createdAt: Date
    updatedAt: Date
    archivedAt: Date | null
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.title = props.title
    this.description = props.description
    this.dueDate = props.dueDate
    this.status = props.status
    this.assigneeId = props.assigneeId
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.archivedAt = props.archivedAt
  }

  static create(input: CreateTaskInput): Task {
    const now = new Date()
    return new Task({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      status: 'open',
      assigneeId: input.assigneeId ?? null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    })
  }

  withDetails(input: {
    title?: string
    description?: string | null
    dueDate?: Date | null
    status?: TaskStatus
  }): Task {
    return new Task({
      ...this,
      title: input.title ?? this.title,
      description: input.description !== undefined ? input.description : this.description,
      dueDate: input.dueDate !== undefined ? input.dueDate : this.dueDate,
      status: input.status ?? this.status,
      updatedAt: new Date(),
    })
  }

  assign(assigneeId: string | null): Task {
    return new Task({ ...this, assigneeId, updatedAt: new Date() })
  }

  archive(): Task {
    return new Task({ ...this, archivedAt: new Date() })
  }

  restore(): Task {
    return new Task({ ...this, archivedAt: null })
  }

  static reconstruct(props: {
    id: string
    leadId: string
    title: string
    description: string | null
    dueDate: Date | null
    status: TaskStatus
    assigneeId: string | null
    createdAt: Date
    updatedAt: Date
    archivedAt: Date | null
  }): Task {
    return new Task(props)
  }
}
