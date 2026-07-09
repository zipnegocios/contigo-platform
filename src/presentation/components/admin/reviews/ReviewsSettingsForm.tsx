'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Switch } from '@/presentation/components/ui/switch'
import { Badge } from '@/presentation/components/ui/badge'
import { ReviewsPreviewPanel } from './ReviewsPreviewPanel'
import type { ReviewWebsiteVisibilityFlags, ReviewAutomationRule } from '@/core/entities/ReviewSettings'

interface SettingsFormValues {
  syncFrequencyMinutes: number
  requestDelayDays: number
  maxRemindersPerRequest: number
  reminderIntervalDays: number
  minStarsPublic: number
  defaultDisplayMode: 'carousel' | 'grid'
  websiteVisibilityFlags: ReviewWebsiteVisibilityFlags
  automationRules: ReviewAutomationRule[]
}

const AUTOMATION_RULE_LABEL: Record<string, string> = {
  'default-new-review-notify': 'Notify admin by email on every new review',
  'default-low-rating-notify': 'Notify admin by email when rating ≤ 2★',
  'default-low-rating-task': 'Create a follow-up task when rating ≤ 2★ (if matched to a lead)',
  'default-high-rating-thanks': 'Create a "send thank-you" task on 5★ reviews (if matched to a lead)',
}

interface ConnectionStatus {
  label: string
  tone: 'ok' | 'error' | 'idle'
  detail: string | null | undefined
}

const TONE_STYLE: Record<ConnectionStatus['tone'], { bg: string; color: string }> = {
  ok: { bg: 'rgba(34,197,94,0.12)', color: '#15803d' },
  error: { bg: 'rgba(220,38,38,0.12)', color: '#dc2626' },
  idle: { bg: 'rgba(107,101,96,0.1)', color: '#6B6560' },
}

export function ReviewsSettingsForm({
  initialSettings,
  connectionStatus,
}: {
  initialSettings: SettingsFormValues
  connectionStatus: ConnectionStatus
}) {
  const router = useRouter()
  const [values, setValues] = useState<SettingsFormValues>(initialSettings)
  const [saving, setSaving] = useState(false)

  function updateFlag(key: keyof ReviewWebsiteVisibilityFlags, value: boolean) {
    setValues((prev) => ({ ...prev, websiteVisibilityFlags: { ...prev.websiteVisibilityFlags, [key]: value } }))
  }

  function toggleRule(ruleId: string, isEnabled: boolean) {
    setValues((prev) => ({
      ...prev,
      automationRules: prev.automationRules.map((rule) => (rule.id === ruleId ? { ...rule, isEnabled } : rule)),
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/reviews/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save settings')
      toast.success('Settings saved')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ border: '1px solid rgba(226, 192, 99, 0.15)' }}>
        <div>
          <p className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>
            Google Business Profile connection
          </p>
          {connectionStatus.detail && (
            <p className="text-fluid-xs mt-0.5" style={{ color: 'var(--neutral-600)' }}>
              {connectionStatus.detail}
            </p>
          )}
        </div>
        <Badge style={{ backgroundColor: TONE_STYLE[connectionStatus.tone].bg, color: TONE_STYLE[connectionStatus.tone].color }}>
          {connectionStatus.label}
        </Badge>
      </div>

      <section className="space-y-4">
        <h2 className="text-fluid-lg font-semibold" style={{ color: 'var(--neutral-800)' }}>
          Sync
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Sync frequency (minutes)</Label>
            <Input
              type="number"
              min={5}
              value={values.syncFrequencyMinutes}
              onChange={(e) => setValues((prev) => ({ ...prev, syncFrequencyMinutes: Number(e.target.value) }))}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-fluid-lg font-semibold" style={{ color: 'var(--neutral-800)' }}>
          Public website
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Minimum stars shown publicly</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={values.minStarsPublic}
              onChange={(e) => setValues((prev) => ({ ...prev, minStarsPublic: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Display mode</Label>
            <select
              value={values.defaultDisplayMode}
              onChange={(e) => setValues((prev) => ({ ...prev, defaultDisplayMode: e.target.value as 'carousel' | 'grid' }))}
              className="h-9 w-full rounded-md px-3 text-fluid-sm"
              style={{ border: '1px solid rgba(226,192,99,0.3)' }}
            >
              <option value="carousel">Carousel</option>
              <option value="grid">Grid</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {(
            [
              ['showReviewerName', 'Show reviewer name'],
              ['showReviewerAvatar', 'Show reviewer avatar'],
              ['showDate', 'Show review date'],
              ['showTags', 'Show tags'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label>{label}</Label>
              <Switch
                checked={values.websiteVisibilityFlags[key] ?? false}
                onCheckedChange={(checked) => updateFlag(key, checked)}
              />
            </div>
          ))}
        </div>
      </section>

      <ReviewsPreviewPanel
        minStarsPublic={values.minStarsPublic}
        defaultDisplayMode={values.defaultDisplayMode}
        websiteVisibilityFlags={values.websiteVisibilityFlags}
      />

      <section className="space-y-4">
        <h2 className="text-fluid-lg font-semibold" style={{ color: 'var(--neutral-800)' }}>
          Review requests
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Delay after "won" (days)</Label>
            <Input
              type="number"
              min={0}
              value={values.requestDelayDays}
              onChange={(e) => setValues((prev) => ({ ...prev, requestDelayDays: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max reminders</Label>
            <Input
              type="number"
              min={0}
              value={values.maxRemindersPerRequest}
              onChange={(e) => setValues((prev) => ({ ...prev, maxRemindersPerRequest: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reminder interval (days)</Label>
            <Input
              type="number"
              min={1}
              value={values.reminderIntervalDays}
              onChange={(e) => setValues((prev) => ({ ...prev, reminderIntervalDays: Number(e.target.value) }))}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-fluid-lg font-semibold" style={{ color: 'var(--neutral-800)' }}>
          Automation rules
        </h2>
        <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
          Evaluated on every sync for newly received reviews. The lead-task rules only fire when a review is matched
          to a lead (reviewed-inference).
        </p>
        <div className="space-y-3">
          {values.automationRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between gap-4">
              <Label className="flex-1">{AUTOMATION_RULE_LABEL[rule.id] ?? rule.id}</Label>
              <Switch checked={rule.isEnabled} onCheckedChange={(checked) => toggleRule(rule.id, checked)} />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </div>
  )
}
