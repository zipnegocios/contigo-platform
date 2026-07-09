import Link from 'next/link'
import { DrizzleReviewSettingsRepository } from '@/infrastructure/repositories/DrizzleReviewSettingsRepository'
import { DrizzleReviewSyncLogRepository } from '@/infrastructure/repositories/DrizzleReviewSyncLogRepository'
import { ReviewsSettingsForm } from '@/presentation/components/admin/reviews/ReviewsSettingsForm'
import { DEFAULT_AUTOMATION_RULES } from '@/application/use-cases/reviews/RunReviewAutomationRulesUseCase'

export default async function ReviewsSettingsPage() {
  const [settings, lastSync] = await Promise.all([
    new DrizzleReviewSettingsRepository().get(),
    new DrizzleReviewSyncLogRepository().findLatest(),
  ])

  const connectionStatus =
    lastSync?.status === 'failed'
      ? { label: 'Reconnect required', tone: 'error' as const, detail: lastSync.errorMessage }
      : lastSync?.status === 'success'
        ? { label: 'Connected', tone: 'ok' as const, detail: lastSync.finishedAt?.toLocaleString() }
        : { label: 'Not synced yet', tone: 'idle' as const, detail: null }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Review Settings
        </h1>
        <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
          Sync cadence, public visibility and request timing.{' '}
          <Link href="/admin/reviews" className="underline" style={{ color: 'var(--contigo-primary)' }}>
            Back to reviews
          </Link>
        </p>
      </div>

      <ReviewsSettingsForm
        initialSettings={{
          syncFrequencyMinutes: settings?.syncFrequencyMinutes ?? 15,
          requestDelayDays: settings?.requestDelayDays ?? 3,
          maxRemindersPerRequest: settings?.maxRemindersPerRequest ?? 2,
          reminderIntervalDays: settings?.reminderIntervalDays ?? 7,
          minStarsPublic: settings?.minStarsPublic ?? 4,
          defaultDisplayMode: settings?.defaultDisplayMode ?? 'carousel',
          websiteVisibilityFlags: settings?.websiteVisibilityFlags ?? {
            showReviewerName: true,
            showReviewerAvatar: true,
            showDate: true,
            showTags: false,
          },
          automationRules: settings?.automationRules?.length ? settings.automationRules : DEFAULT_AUTOMATION_RULES,
        }}
        connectionStatus={connectionStatus}
      />
    </div>
  )
}
