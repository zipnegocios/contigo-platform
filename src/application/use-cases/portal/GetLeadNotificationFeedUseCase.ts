import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'
import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'
import { LeadActivity, LeadActivityType } from '@/core/entities/LeadActivity'
import { getClientStageLabel } from '@/presentation/lib/clientStageLabels'

export interface LeadNotificationItem {
  id: string
  type: string
  label: string
  createdAt: Date
}

export interface LeadNotificationFeedDTO {
  items: LeadNotificationItem[]
  unreadCount: number
}

/**
 * Allowlist of activity types surfaced in the client-facing notification feed.
 * Deliberately an allowlist (not a denylist) — any future LeadActivityType is
 * hidden by default unless explicitly added here. In particular, `message_received`
 * (the client's own action) must never appear: notifying a client "you sent a
 * message" is noise, not a notification.
 */
const ALLOWED_TYPES = new Set<LeadActivityType>([
  'stage_change',
  'call_scheduled',
  'visit_scheduled',
  'event_scheduled',
  'call_cancelled',
  'visit_cancelled',
  'event_cancelled',
  'message_sent',
])

const SCHEDULED_LABELS: Partial<Record<LeadActivityType, string>> = {
  call_scheduled: 'Schedule: Call',
  visit_scheduled: 'Schedule: Site Visit',
  event_scheduled: 'Schedule: Meeting',
  call_cancelled: 'Schedule: Call cancelled',
  visit_cancelled: 'Schedule: Site Visit cancelled',
  event_cancelled: 'Schedule: Meeting cancelled',
}

/**
 * Builds the client-facing notification feed (bell icon) for a lead's tracking
 * panel. Only a small, allowlisted subset of internal `LeadActivity` records are
 * surfaced, each mapped to client-safe wording distinct from the admin-facing
 * `LeadActivityTimeline` labels — no internal stage ids/keys or other
 * implementation details are ever exposed.
 */
export class GetLeadNotificationFeedUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadActivityRepository: ILeadActivityRepository,
    private pipelineStageRepository: IPipelineStageRepository,
  ) {}

  async execute(leadId: string): Promise<LeadNotificationFeedDTO> {
    const [lead, activities] = await Promise.all([
      this.leadRepository.findById(leadId),
      this.leadActivityRepository.findByLeadId(leadId),
    ])

    const allowedActivities = activities.filter((activity) => ALLOWED_TYPES.has(activity.type))

    // Newest-first, matching ILeadActivityRepository.findByLeadId's existing
    // desc(createdAt) ordering — no re-sort needed for a notification feed.
    const items: LeadNotificationItem[] = []
    for (const activity of allowedActivities) {
      items.push({
        id: activity.id,
        type: activity.type,
        label: await this.buildLabel(activity),
        createdAt: activity.createdAt,
      })
    }

    const viewedAt = lead?.notificationsViewedAt ?? null
    const unreadCount =
      viewedAt === null ? items.length : items.filter((item) => item.createdAt > viewedAt).length

    return { items, unreadCount }
  }

  private async buildLabel(activity: LeadActivity): Promise<string> {
    if (activity.type === 'stage_change') {
      const toStageId = activity.payload.to as string | undefined
      const stage = toStageId ? await this.pipelineStageRepository.findById(toStageId) : null
      const stageMeta = getClientStageLabel(stage?.key ?? '')
      return `Status: ${stageMeta.label}`
    }

    if (activity.type === 'message_sent') {
      return 'New message from our team'
    }

    return SCHEDULED_LABELS[activity.type] ?? activity.type
  }
}
