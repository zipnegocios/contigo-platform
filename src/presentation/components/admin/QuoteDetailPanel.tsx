'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Quote, QuoteStatus } from '@/core/entities/Quote'

interface QuoteDetailPanelProps {
  quote: Quote
  initialNotes?: string
}

export function QuoteDetailPanel({ quote, initialNotes }: QuoteDetailPanelProps) {
  const router = useRouter()
  const [status, setStatus] = useState<QuoteStatus>(quote.status)
  const [notes, setNotes] = useState(initialNotes || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update quote')
      }

      toast.success('Quote updated successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update quote')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Quote Details */}
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="mt-1 text-lg">{quote.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="mt-1 text-lg">{quote.email.toString()}</p>
            </div>
            {quote.phone && (
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p className="mt-1 text-lg">{quote.phone.toString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Service Requested</label>
              <p className="mt-1 text-lg">{quote.service}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{quote.message}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Tracking Token</label>
              <p className="mt-1 text-xs font-mono break-all">{quote.trackingToken}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Submitted</label>
              <p className="mt-1">{quote.createdAt.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status & Notes Editor */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={(value) => setStatus(value as QuoteStatus)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add private notes about this quote..."
                className="mt-2 min-h-32"
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
