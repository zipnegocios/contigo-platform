export interface CreateTaskAttachmentInput {
  taskId: string
  key: string
  filename: string
}

export class TaskAttachment {
  readonly id: string
  readonly taskId: string
  readonly key: string
  readonly filename: string
  readonly createdAt: Date

  private constructor(props: {
    id: string
    taskId: string
    key: string
    filename: string
    createdAt: Date
  }) {
    this.id = props.id
    this.taskId = props.taskId
    this.key = props.key
    this.filename = props.filename
    this.createdAt = props.createdAt
  }

  static create(input: CreateTaskAttachmentInput): TaskAttachment {
    return new TaskAttachment({
      id: crypto.randomUUID(),
      taskId: input.taskId,
      key: input.key,
      filename: input.filename,
      createdAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    taskId: string
    key: string
    filename: string
    createdAt: Date
  }): TaskAttachment {
    return new TaskAttachment(props)
  }
}
