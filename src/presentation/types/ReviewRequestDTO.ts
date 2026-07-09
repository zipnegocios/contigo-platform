import { ReviewRequest, ReviewRequestStatus } from '@/core/entities/ReviewRequest'

export interface ReviewRequestDTO {
  id: string
  leadId: string
  contactEmail: string
  contactName: string
  status: ReviewRequestStatus
  scheduledFor: Date
  sentAt: Date | null
  openedAt: Date | null
  clickedAt: Date | null
  reminderCount: number
  matchedReviewId: string | null
  createdAt: Date
}

export function toReviewRequestDTO(request: ReviewRequest): ReviewRequestDTO {
  return {
    id: request.id,
    leadId: request.leadId,
    contactEmail: request.contactEmail,
    contactName: request.contactName,
    status: request.status,
    scheduledFor: request.scheduledFor,
    sentAt: request.sentAt,
    openedAt: request.openedAt,
    clickedAt: request.clickedAt,
    reminderCount: request.reminderCount,
    matchedReviewId: request.matchedReviewId,
    createdAt: request.createdAt,
  }
}
