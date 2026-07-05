'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useSSE } from '@/presentation/hooks/useSSE'

interface MessageItem {
  id: string
  authorType: string
  body: string
  createdAt: Date | string
}

interface TrackingMessagesProps {
  token: string
  messages: MessageItem[]
}

const MAX_BODY_LENGTH = 2000

function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-AU', {
    timeZone: 'Australia/Adelaide',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MessageBubble({ message }: { message: MessageItem }) {
  const isClient = message.authorType === 'client'

  return (
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] rounded-lg px-4 py-3"
        style={{
          background: isClient ? 'rgba(226,192,99,0.18)' : '#FAF6F0',
          border: `1px solid ${isClient ? 'rgba(226,192,99,0.4)' : 'var(--atelier-border)'}`,
        }}
      >
        <p
          className="text-fluid-xs font-semibold uppercase tracking-wide mb-1"
          style={{ color: 'var(--atelier-ink)', opacity: 0.6 }}
        >
          {isClient ? 'You' : 'Contigo Team'}
        </p>
        <p className="text-fluid-sm whitespace-pre-wrap" style={{ color: 'var(--heritage-charcoal)' }}>
          {message.body}
        </p>
        <p className="text-fluid-xs mt-2" style={{ color: 'var(--atelier-ink)', opacity: 0.6 }}>
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

export function TrackingMessages({ token, messages: initialMessages }: TrackingMessagesProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState(false)
  const confirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mount, fetch the authoritative thread — this also marks staff messages
  // as read server-side, so notify the bell once it succeeds.
  useEffect(() => {
    let cancelled = false

    async function loadMessages() {
      try {
        const res = await fetch(`/api/quote-status/${token}/messages`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (Array.isArray(data?.messages)) {
          setMessages(data.messages)
        }
        window.dispatchEvent(new CustomEvent('tracking-messages-read'))
      } catch {
        // Silent — the initial server-rendered messages remain displayed.
      }
    }

    loadMessages()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Passive live updates. Unlike the mount-time fetch above, an SSE snapshot
  // must NEVER trigger the read-marking side effect — only an explicit
  // "user opened the thread" action does that.
  //
  // Race to guard against: a temp-id optimistic message can be appended
  // locally (in handleSend) before its POST request's INSERT has actually
  // committed to the database. If an SSE snapshot lands in that narrow
  // window, it won't yet include the just-sent message. Wholesale-replacing
  // `messages` with that snapshot would make the user's own message
  // disappear until the next tick catches up. To avoid that, we treat the
  // incoming snapshot as authoritative EXCEPT for any locally pending
  // `temp-` message that isn't yet represented in it (matched by body, since
  // a temp message has no real id to match on) — those are preserved by
  // appending them back on top of the snapshot.
  useSSE<{ messages: MessageItem[]; unreadStaffMessages: number }>(
    `/api/quote-status/${token}/messages/stream`,
    (data) => {
      setMessages((prev) => {
        const incoming = data.messages
        const pendingTemp = prev.filter((m) => m.id.startsWith('temp-'))
        if (pendingTemp.length === 0) {
          return incoming
        }
        const stillPending = pendingTemp.filter(
          (temp) => !incoming.some((m) => m.authorType === 'client' && m.body === temp.body),
        )
        return stillPending.length > 0 ? [...incoming, ...stillPending] : incoming
      })
    },
  )

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current)
      }
    }
  }, [])

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (trimmed.length === 0 || trimmed.length > MAX_BODY_LENGTH) {
      return
    }

    setSendError(null)
    setSending(true)

    const tempId = `temp-${Date.now()}`
    const optimisticMessage: MessageItem = {
      id: tempId,
      authorType: 'client',
      body: trimmed,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setDraft('')

    try {
      const res = await fetch(`/api/quote-status/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      })

      if (!res.ok) {
        throw new Error('Failed to send message')
      }

      const data = await res.json()

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? (data.message ?? optimisticMessage) : m)),
      )
      setConfirmation(true)
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current)
      }
      confirmationTimeoutRef.current = setTimeout(() => setConfirmation(false), 2500)
    } catch {
      // Roll back the optimistic append and restore the draft so the client can retry.
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setDraft(trimmed)
      setSendError('Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const canSend = draft.trim().length > 0 && draft.trim().length <= MAX_BODY_LENGTH && !sending

  return (
    <div className="rounded-lg shadow-lg p-8 mb-12" style={{ background: 'white' }}>
      <h3 className="flex items-center gap-2 text-fluid-lg font-bold mb-6" style={{ color: 'var(--heritage-charcoal)' }}>
        <MessageSquare className="w-5 h-5" />
        Messages
      </h3>

      {messages.length === 0 ? (
        <p className="text-fluid-sm mb-6" style={{ color: 'var(--atelier-ink)', opacity: 0.7 }}>
          No messages yet — send us a note and we&apos;ll get back to you here.
        </p>
      ) : (
        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      )}

      <div className="pt-4 border-t" style={{ borderColor: 'var(--atelier-border)' }}>
        <label htmlFor="tracking-message-draft" className="sr-only">
          Write a message
        </label>
        <textarea
          id="tracking-message-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          rows={3}
          maxLength={MAX_BODY_LENGTH}
          className="w-full rounded p-3 text-fluid-sm resize-none focus:outline-none"
          style={{
            border: '1px solid var(--atelier-border)',
            color: 'var(--heritage-charcoal)',
            background: '#FAF6F0',
          }}
        />

        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <div className="min-h-[1.25rem]">
            {sendError && (
              <p className="text-fluid-xs" style={{ color: '#B3261E' }}>
                {sendError}
              </p>
            )}
            {confirmation && !sendError && (
              <p className="text-fluid-xs" style={{ color: '#3E6B4F' }}>
                Message sent.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
