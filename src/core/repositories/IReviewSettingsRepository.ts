import type { ReviewSettings, ReviewSettingsInput } from '@/core/entities/ReviewSettings'

export interface IReviewSettingsRepository {
  get(): Promise<ReviewSettings | null>
  upsert(input: ReviewSettingsInput): Promise<ReviewSettings>
}
