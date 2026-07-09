import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleReviewSettingsRepository } from '@/infrastructure/repositories/DrizzleReviewSettingsRepository'

const DEFAULTS = {
  syncFrequencyMinutes: 15,
  requestDelayDays: 3,
  maxRemindersPerRequest: 2,
  reminderIntervalDays: 7,
  minStarsPublic: 4,
  defaultDisplayMode: 'carousel' as const,
  websiteVisibilityFlags: { showReviewerName: true, showReviewerAvatar: true, showDate: true, showTags: false },
  automationRules: [],
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.settings'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await new DrizzleReviewSettingsRepository().get()
    return Response.json({ settings: settings ?? { id: null, updatedAt: null, ...DEFAULTS } })
  } catch (error) {
    console.error('Error fetching review settings:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'reviews.settings'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const repository = new DrizzleReviewSettingsRepository()
    const existing = await repository.get()

    const settings = await repository.upsert({
      syncFrequencyMinutes: body.syncFrequencyMinutes ?? existing?.syncFrequencyMinutes ?? DEFAULTS.syncFrequencyMinutes,
      requestDelayDays: body.requestDelayDays ?? existing?.requestDelayDays ?? DEFAULTS.requestDelayDays,
      maxRemindersPerRequest:
        body.maxRemindersPerRequest ?? existing?.maxRemindersPerRequest ?? DEFAULTS.maxRemindersPerRequest,
      reminderIntervalDays: body.reminderIntervalDays ?? existing?.reminderIntervalDays ?? DEFAULTS.reminderIntervalDays,
      minStarsPublic: body.minStarsPublic ?? existing?.minStarsPublic ?? DEFAULTS.minStarsPublic,
      defaultDisplayMode: body.defaultDisplayMode ?? existing?.defaultDisplayMode ?? DEFAULTS.defaultDisplayMode,
      websiteVisibilityFlags:
        body.websiteVisibilityFlags ?? existing?.websiteVisibilityFlags ?? DEFAULTS.websiteVisibilityFlags,
      automationRules: body.automationRules ?? existing?.automationRules ?? DEFAULTS.automationRules,
    })

    return Response.json({ success: true, settings })
  } catch (error) {
    console.error('Error updating review settings:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
