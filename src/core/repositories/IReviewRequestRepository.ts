import { ReviewRequest, ReviewRequestStatus } from '@/core/entities/ReviewRequest'

export interface IReviewRequestRepository {
  save(request: ReviewRequest): Promise<void>
  update(request: ReviewRequest): Promise<void>
  findById(id: string): Promise<ReviewRequest | null>
  findByLeadId(leadId: string): Promise<ReviewRequest[]>
  findDueToSend(asOf: Date): Promise<ReviewRequest[]> // status='scheduled' and scheduledFor <= asOf
  findDueForReminder(asOf: Date): Promise<ReviewRequest[]> // status='sent'/'opened' and nextReminderAt <= asOf
  findByStatus(status: ReviewRequestStatus): Promise<ReviewRequest[]>
  findAll(): Promise<ReviewRequest[]>
  findAwaitingMatch(): Promise<ReviewRequest[]> // status in sent/opened/clicked, sentAt not null — candidates for reviewed-inference
}
