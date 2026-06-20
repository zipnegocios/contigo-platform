'use client'

import { Phone, MapPin, FileText, ArrowRight, Mail, StickyNote, type LucideIcon } from 'lucide-react'
import type { LeadActivityDTO } from '@/presentation/types/LeadActivityDTO'

const ICONS: Record<string, LucideIcon> = {
  stage_change: ArrowRight,
  call_scheduled: Phone,
  call_completed: Phone,
  call_cancelled: Phone,
  visit_scheduled: MapPin,
  visit_completed: MapPin,
  visit_cancelled: MapPin,
  document_uploaded: FileText,
  document_sent: FileText,
  email_sent: Mail,
  note: StickyNote,
}

const LABELS: Record<string, (payload: Record<string, unknown>) => string> = {
  stage_change: (p) => `Stage changed from "${p.from ?? '—'}" to "${p.to}"`,
  call_scheduled: (p) => `Call scheduled for ${new Date(p.scheduledAt as string).toLocaleString()}`,
  call_completed: () => 'Call completed',
  call_cancelled: () => 'Call cancelled',
  visit_scheduled: (p) => `Visit scheduled for ${new Date(p.scheduledAt as string).toLocaleString()}`,
  visit_completed: () => 'Visit completed',
  visit_cancelled: () => 'Visit cancelled',
  document_uploaded: (p) => `Document received: ${p.fileName}`,
  document_sent: (p) => `Document sent to client: ${p.fileName}`,
  note: (p) => (p.text as string) ?? 'Note added',
}

export function LeadActivityTimeline({ activities }: { activities: LeadActivityDTO[] }) {
  if (!activities.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No activity recorded yet.</p>
  }

  return (
    <ol className="space-y-4 border-l pl-4">
      {activities.map((a) => {
        const Icon = ICONS[a.type] ?? StickyNote
        const label = LABELS[a.type]?.(a.payload) ?? a.type
        return (
          <li key={a.id} className="relative">
            <span className="absolute -left-[1.4rem] flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <Icon className="h-3 w-3" />
            </span>
            <p className="text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
          </li>
        )
      })}
    </ol>
  )
}
