import { eq, and, lte, inArray, isNotNull, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { reviewRequests } from '../db/schema'
import { ReviewRequest, ReviewRequestStatus } from '@/core/entities/ReviewRequest'
import { IReviewRequestRepository } from '@/core/repositories/IReviewRequestRepository'

type ReviewRequestRow = typeof reviewRequests.$inferSelect

function mapRow(row: ReviewRequestRow): ReviewRequest {
  return ReviewRequest.reconstruct({
    id: row.id,
    leadId: row.leadId,
    contactEmail: row.contactEmail,
    contactName: row.contactName,
    status: row.status,
    templateId: row.templateId,
    scheduledFor: row.scheduledFor,
    sentAt: row.sentAt,
    openedAt: row.openedAt,
    clickedAt: row.clickedAt,
    reminderCount: row.reminderCount,
    nextReminderAt: row.nextReminderAt,
    matchedReviewId: row.matchedReviewId,
    createdAt: row.createdAt,
  })
}

export class DrizzleReviewRequestRepository implements IReviewRequestRepository {
  async save(request: ReviewRequest): Promise<void> {
    await db.insert(reviewRequests).values({
      id: request.id,
      leadId: request.leadId,
      contactEmail: request.contactEmail,
      contactName: request.contactName,
      status: request.status,
      templateId: request.templateId,
      scheduledFor: request.scheduledFor,
      sentAt: request.sentAt,
      openedAt: request.openedAt,
      clickedAt: request.clickedAt,
      reminderCount: request.reminderCount,
      nextReminderAt: request.nextReminderAt,
      matchedReviewId: request.matchedReviewId,
    })
  }

  async update(request: ReviewRequest): Promise<void> {
    await db
      .update(reviewRequests)
      .set({
        status: request.status,
        sentAt: request.sentAt,
        openedAt: request.openedAt,
        clickedAt: request.clickedAt,
        reminderCount: request.reminderCount,
        nextReminderAt: request.nextReminderAt,
        matchedReviewId: request.matchedReviewId,
      })
      .where(eq(reviewRequests.id, request.id))
  }

  async findById(id: string): Promise<ReviewRequest | null> {
    const rows = await db.select().from(reviewRequests).where(eq(reviewRequests.id, id)).limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  }

  async findByLeadId(leadId: string): Promise<ReviewRequest[]> {
    const rows = await db
      .select()
      .from(reviewRequests)
      .where(eq(reviewRequests.leadId, leadId))
      .orderBy(desc(reviewRequests.createdAt))
    return rows.map(mapRow)
  }

  async findDueToSend(asOf: Date): Promise<ReviewRequest[]> {
    const rows = await db
      .select()
      .from(reviewRequests)
      .where(and(eq(reviewRequests.status, 'scheduled'), lte(reviewRequests.scheduledFor, asOf)))
    return rows.map(mapRow)
  }

  async findDueForReminder(asOf: Date): Promise<ReviewRequest[]> {
    const rows = await db
      .select()
      .from(reviewRequests)
      .where(
        and(
          inArray(reviewRequests.status, ['sent', 'opened']),
          isNotNull(reviewRequests.nextReminderAt),
          lte(reviewRequests.nextReminderAt, asOf),
        ),
      )
    return rows.map(mapRow)
  }

  async findByStatus(status: ReviewRequestStatus): Promise<ReviewRequest[]> {
    const rows = await db.select().from(reviewRequests).where(eq(reviewRequests.status, status))
    return rows.map(mapRow)
  }

  async findAll(): Promise<ReviewRequest[]> {
    const rows = await db.select().from(reviewRequests).orderBy(desc(reviewRequests.createdAt))
    return rows.map(mapRow)
  }

  async findAwaitingMatch(): Promise<ReviewRequest[]> {
    const rows = await db
      .select()
      .from(reviewRequests)
      .where(and(inArray(reviewRequests.status, ['sent', 'opened', 'clicked']), isNotNull(reviewRequests.sentAt)))
    return rows.map(mapRow)
  }
}
