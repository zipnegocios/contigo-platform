'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { Lead } from '@/core/entities/Lead'
import { Quote } from '@/core/entities/Quote'

interface LeadsKanbanProps {
  leads: Array<{
    id: string
    quoteId: string
    stage: string
    adminNotes: string | null
    estimatedValue: number | null
    updatedAt: Date
    quote: Quote | null
  }>
}

const stages = ['prospect', 'contacted', 'quoted', 'won', 'lost']
const stageLabels: Record<string, string> = {
  prospect: 'Prospect',
  contacted: 'Contacted',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
}

const stageColors: Record<string, string> = {
  prospect: 'bg-blue-100',
  contacted: 'bg-yellow-100',
  quoted: 'bg-purple-100',
  won: 'bg-green-100',
  lost: 'bg-red-100',
}

const stageBorderColors: Record<string, string> = {
  prospect: 'border-blue-200',
  contacted: 'border-yellow-200',
  quoted: 'border-purple-200',
  won: 'border-green-200',
  lost: 'border-red-200',
}

const stageBadgeColors: Record<string, string> = {
  prospect: 'bg-blue-200 text-blue-800',
  contacted: 'bg-yellow-200 text-yellow-800',
  quoted: 'bg-purple-200 text-purple-800',
  won: 'bg-green-200 text-green-800',
  lost: 'bg-red-200 text-red-800',
}

export function LeadsKanban({ leads: initialLeads }: LeadsKanbanProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const groupedByStage = stages.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((l) => l.stage === stage)
      return acc
    },
    {} as Record<string, typeof initialLeads>,
  )

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    if (!draggedId || isLoading) return

    const lead = leads.find((l) => l.id === draggedId)
    if (!lead || lead.stage === targetStage) {
      setDraggedId(null)
      return
    }

    // Store original state for rollback
    const originalLeads = leads

    // Optimistic update
    const newLeads = leads.map((l) =>
      l.id === draggedId ? { ...l, stage: targetStage, updatedAt: new Date() } : l,
    )
    setLeads(newLeads)
    setDraggedId(null)
    setIsLoading(true)

    // Save to API
    try {
      const response = await fetch(`/api/admin/leads/${draggedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update lead: ${response.statusText}`)
      }

      toast.success(`Lead moved to ${stageLabels[targetStage]}`)
    } catch (error) {
      // Revert optimistic update
      setLeads(originalLeads)
      toast.error(error instanceof Error ? error.message : 'Failed to move lead')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only leave if we're leaving the entire stage column
    if (e.currentTarget === e.target) {
      e.currentTarget.classList.remove('opacity-50')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-screen bg-gray-50 p-4 rounded-lg">
      {stages.map((stage) => (
        <div key={stage} className="flex flex-col">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-gray-700">{stageLabels[stage]}</h2>
              <Badge variant="secondary" className={`${stageBadgeColors[stage]} font-medium`}>
                {groupedByStage[stage].length}
              </Badge>
            </div>
            <div className="h-1 bg-gradient-to-r from-gray-200 to-transparent mt-2"></div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
            onDragLeave={handleDragLeave}
            className={`flex-1 space-y-3 p-3 rounded-lg border-2 border-dashed ${stageBorderColors[stage]} ${stageColors[stage]} transition-opacity min-h-96`}
          >
            {groupedByStage[stage].length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Drop leads here
              </div>
            ) : (
              groupedByStage[stage].map((lead) => (
                <Card
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                    draggedId === lead.id ? 'opacity-50' : ''
                  } border-0 bg-white`}
                >
                  <CardContent className="pt-4 text-sm space-y-2">
                    <div>
                      <p className="font-semibold text-gray-900 truncate">
                        {lead.quote?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{lead.quote?.email || '-'}</p>
                    </div>
                    {lead.quote?.service && (
                      <p className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded w-fit">
                        {lead.quote.service}
                      </p>
                    )}
                    {lead.estimatedValue && (
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs text-gray-600">Est. Value:</span>
                        <span className="font-bold text-green-700">
                          ${(lead.estimatedValue / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {lead.adminNotes && (
                      <p className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2">
                        {lead.adminNotes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
