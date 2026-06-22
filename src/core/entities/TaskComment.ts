export interface CreateTaskCommentInput {
  taskId: string
  body: string
  authorId?: string
}

export class TaskComment {
  readonly id: string
  readonly taskId: string
  readonly body: string
  readonly authorId: string | null
  readonly createdAt: Date
  readonly editedAt: Date | null

  private constructor(props: {
    id: string
    taskId: string
    body: string
    authorId: string | null
    createdAt: Date
    editedAt: Date | null
  }) {
    this.id = props.id
    this.taskId = props.taskId
    this.body = props.body
    this.authorId = props.authorId
    this.createdAt = props.createdAt
    this.editedAt = props.editedAt
  }

  static create(input: CreateTaskCommentInput): TaskComment {
    return new TaskComment({
      id: crypto.randomUUID(),
      taskId: input.taskId,
      body: input.body,
      authorId: input.authorId ?? null,
      createdAt: new Date(),
      editedAt: null,
    })
  }

  edit(body: string): TaskComment {
    return new TaskComment({ ...this, body, editedAt: new Date() })
  }

  static reconstruct(props: {
    id: string
    taskId: string
    body: string
    authorId: string | null
    createdAt: Date
    editedAt: Date | null
  }): TaskComment {
    return new TaskComment(props)
  }
}
