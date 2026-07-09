export interface ReviewWebsiteVisibilityFlags {
  showReviewerName?: boolean
  showReviewerAvatar?: boolean
  showDate?: boolean
  showTags?: boolean
  [key: string]: boolean | undefined
}

export interface ReviewAutomationRule {
  id: string
  trigger: 'new_review' | 'low_rating' | 'high_rating'
  action: 'notify_admin_email' | 'create_lead_task' | 'thank_you_reminder'
  isEnabled: boolean
}

export interface ReviewSettings {
  id: string
  syncFrequencyMinutes: number
  requestDelayDays: number
  maxRemindersPerRequest: number
  reminderIntervalDays: number
  minStarsPublic: number
  defaultDisplayMode: 'carousel' | 'grid'
  websiteVisibilityFlags: ReviewWebsiteVisibilityFlags
  automationRules: ReviewAutomationRule[]
  updatedAt: Date
}

export type ReviewSettingsInput = Omit<ReviewSettings, 'id' | 'updatedAt'>
