export interface CreateTaskChecklistItemInput {
  taskId: string
  label: string
  position?: number
}

export class TaskChecklistItem {
  readonly id: string
  readonly taskId: string
  readonly label: string
  readonly position: number
  readonly isChecked: boolean

  private constructor(props: {
    id: string
    taskId: string
    label: string
    position: number
    isChecked: boolean
  }) {
    this.id = props.id
    this.taskId = props.taskId
    this.label = props.label
    this.position = props.position
    this.isChecked = props.isChecked
  }

  static create(input: CreateTaskChecklistItemInput): TaskChecklistItem {
    return new TaskChecklistItem({
      id: crypto.randomUUID(),
      taskId: input.taskId,
      label: input.label,
      position: input.position ?? 0,
      isChecked: false,
    })
  }

  toggle(): TaskChecklistItem {
    return new TaskChecklistItem({ ...this, isChecked: !this.isChecked })
  }

  withLabel(label: string): TaskChecklistItem {
    return new TaskChecklistItem({ ...this, label })
  }

  withPosition(position: number): TaskChecklistItem {
    return new TaskChecklistItem({ ...this, position })
  }

  static reconstruct(props: {
    id: string
    taskId: string
    label: string
    position: number
    isChecked: boolean
  }): TaskChecklistItem {
    return new TaskChecklistItem(props)
  }
}
