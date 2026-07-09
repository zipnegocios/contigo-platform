export type ReviewSyncTrigger = 'manual' | 'scheduled'
export type ReviewSyncStatus = 'success' | 'partial' | 'failed'

export interface ReviewSyncLog {
  id: string
  trigger: ReviewSyncTrigger
  startedAt: Date
  finishedAt: Date | null
  status: ReviewSyncStatus | null
  newCount: number
  updatedCount: number
  deletedCount: number
  errorMessage: string | null
}

export interface ReviewSyncLogResult {
  status: ReviewSyncStatus
  newCount: number
  updatedCount: number
  deletedCount: number
  errorMessage?: string | null
}

export interface IReviewSyncLogRepository {
  start(trigger: ReviewSyncTrigger): Promise<string> // returns log id
  finish(id: string, result: ReviewSyncLogResult): Promise<void>
  findLatestSuccessful(): Promise<ReviewSyncLog | null>
  findLatest(): Promise<ReviewSyncLog | null> // regardless of status — for the dashboard's "last sync status" card
}
