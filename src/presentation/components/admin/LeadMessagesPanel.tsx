'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { useSSE } from '@/presentation/hooks/useSSE'
import type { LeadMessageDTO } from '@/presentation/types/LeadMessageDTO'

interface LeadMessagesPanelProps {
  leadId: string
}

function mapMessage(raw: any): LeadMessageDTO {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    readAt: raw.readAt ? new Date(raw.readAt) : null,
  }
}

export function LeadMessagesPanel({ leadId }: LeadMessagesPanelProps) {
  const [messages, setMessages] = useState<LeadMessageDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const loadMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/messages`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setMessages((json.messages ?? []).map(mapMessage))
    } catch {
      toast.error('Could not load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  // Dedicated per-lead SSE connection: purely an additional live-update path
  // layered on top of the manual loadMessages() calls above/below — it just
  // silently updates `messages`, no loading spinner, no toast.
  useSSE<{ messages: any[] }>(`/api/admin/leads/${leadId}/messages/stream`, (data) => {
    setMessages((data.messages ?? []).map(mapMessage))
  })

  const sendMessage = async () => {
    const body = draft.trim()
    if (!body) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error()
      setDraft('')
      toast.success('Message sent')
      await loadMessages()
    } catch {
      toast.error('Could not send message')
    } finally {
      setSending(false)
    }
  }

  // Messages arrive newest-first from the API; display oldest-first like a thread.
  const chronological = [...messages].reverse()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--contigo-primary)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {chronological.length === 0 ? (
          <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
            No messages yet.
          </p>
        ) : (
          chronological.map((message) => (
            <div
              key={message.id}
              className="rounded-lg p-3"
              style={{
                border: '1px solid #E5DDD0',
                backgroundColor: message.authorType === 'staff' ? 'rgba(226,192,99,0.06)' : '#fff',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-fluid-sm whitespace-pre-wrap break-words" style={{ color: 'var(--neutral-800)' }}>
                  {message.body}
                </p>
                <Badge variant={message.authorType === 'staff' ? 'default' : 'secondary'}>
                  {message.authorType === 'staff' ? 'Staff' : 'Client'}
                </Badge>
              </div>
              <p className="text-fluid-xs mt-1" style={{ color: 'var(--neutral-600)' }}>
                {message.createdAt.toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message to the client…"
          rows={3}
          className="w-full rounded-lg p-3 text-fluid-sm outline-none resize-none"
          style={{ border: '1px solid #E5DDD0', color: 'var(--neutral-800)' }}
        />
        <Button size="sm" onClick={sendMessage} disabled={sending || !draft.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
