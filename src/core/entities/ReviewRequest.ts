export type ReviewRequestStatus =
  | 'scheduled'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'reviewed_inferred'
  | 'expired'
  | 'cancelled'

export interface CreateReviewRequestInput {
  leadId: string
  contactEmail: string
  contactName: string
  templateId: string
  scheduledFor: Date
}

export class ReviewRequest {
  readonly id: string
  readonly leadId: string
  readonly contactEmail: string
  readonly contactName: string
  readonly status: ReviewRequestStatus
  readonly templateId: string
  readonly scheduledFor: Date
  readonly sentAt: Date | null
  readonly openedAt: Date | null
  readonly clickedAt: Date | null
  readonly reminderCount: number
  readonly nextReminderAt: Date | null
  readonly matchedReviewId: string | null
  readonly createdAt: Date

  private constructor(props: {
    id: string
    leadId: string
    contactEmail: string
    contactName: string
    status: ReviewRequestStatus
    templateId: string
    scheduledFor: Date
    sentAt: Date | null
    openedAt: Date | null
    clickedAt: Date | null
    reminderCount: number
    nextReminderAt: Date | null
    matchedReviewId: string | null
    createdAt: Date
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.contactEmail = props.contactEmail
    this.contactName = props.contactName
    this.status = props.status
    this.templateId = props.templateId
    this.scheduledFor = props.scheduledFor
    this.sentAt = props.sentAt
    this.openedAt = props.openedAt
    this.clickedAt = props.clickedAt
    this.reminderCount = props.reminderCount
    this.nextReminderAt = props.nextReminderAt
    this.matchedReviewId = props.matchedReviewId
    this.createdAt = props.createdAt
  }

  static create(input: CreateReviewRequestInput): ReviewRequest {
    return new ReviewRequest({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      contactEmail: input.contactEmail,
      contactName: input.contactName,
      status: 'scheduled',
      templateId: input.templateId,
      scheduledFor: input.scheduledFor,
      sentAt: null,
      openedAt: null,
      clickedAt: null,
      reminderCount: 0,
      nextReminderAt: null,
      matchedReviewId: null,
      createdAt: new Date(),
    })
  }

  /** Marks the initial send or a reminder send; `reminderIntervalDays` schedules the next one. */
  markSent(reminderIntervalDays: number): ReviewRequest {
    const now = new Date()
    const isFirstSend = this.sentAt === null
    return new ReviewRequest({
      ...this,
      status: 'sent',
      sentAt: this.sentAt ?? now,
      reminderCount: isFirstSend ? this.reminderCount : this.reminderCount + 1,
      nextReminderAt: new Date(now.getTime() + reminderIntervalDays * 24 * 60 * 60 * 1000),
    })
  }

  markOpened(): ReviewRequest {
    if (this.openedAt) return this
    return new ReviewRequest({ ...this, status: 'opened', openedAt: new Date() })
  }

  markClicked(): ReviewRequest {
    return new ReviewRequest({ ...this, status: 'clicked', clickedAt: this.clickedAt ?? new Date() })
  }

  /** Best-effort inference only — never authoritative (plan §3.5). */
  markReviewedInferred(matchedReviewId: string): ReviewRequest {
    return new ReviewRequest({ ...this, status: 'reviewed_inferred', matchedReviewId, nextReminderAt: null })
  }

  markExpired(): ReviewRequest {
    return new ReviewRequest({ ...this, status: 'expired', nextReminderAt: null })
  }

  cancel(): ReviewRequest {
    return new ReviewRequest({ ...this, status: 'cancelled', nextReminderAt: null })
  }

  hasReachedReminderLimit(maxRemindersPerRequest: number): boolean {
    return this.reminderCount >= maxRemindersPerRequest
  }

  static reconstruct(props: {
    id: string
    leadId: string
    contactEmail: string
    contactName: string
    status: ReviewRequestStatus
    templateId: string
    scheduledFor: Date
    sentAt: Date | null
    openedAt: Date | null
    clickedAt: Date | null
    reminderCount: number
    nextReminderAt: Date | null
    matchedReviewId: string | null
    createdAt: Date
  }): ReviewRequest {
    return new ReviewRequest(props)
  }
}
