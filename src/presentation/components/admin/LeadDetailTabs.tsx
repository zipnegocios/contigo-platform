'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import type { LeadDTO } from '@/presentation/types/LeadDTO'
import type { LeadEventDTO } from '@/presentation/types/LeadEventDTO'
import type { LeadDocumentDTO } from '@/presentation/types/LeadDocumentDTO'
import type { LeadActivityDTO } from '@/presentation/types/LeadActivityDTO'
import type { LeadNoteDTO } from '@/presentation/types/LeadNoteDTO'
import type { LeadContactDTO } from '@/presentation/types/LeadContactDTO'
import type { QuoteDTO } from '@/presentation/types/QuoteDTO'
import { QuoteDetailPanel } from './QuoteDetailPanel'
import { LeadActivityTimeline } from './LeadActivityTimeline'
import { LeadEventsPanel } from './LeadEventsPanel'
import { LeadDocumentsPanel } from './LeadDocumentsPanel'

interface LeadDetailTabsProps {
  lead: LeadDTO
  quote: QuoteDTO
  events: LeadEventDTO[]
  documents: LeadDocumentDTO[]
  activities: LeadActivityDTO[]
  notes: LeadNoteDTO[]
  contacts: LeadContactDTO[]
  onStageChange?: (newStage: string) => void
  onMutated?: () => void
}

export function LeadDetailTabs({
  lead,
  quote,
  events,
  documents,
  activities,
  notes,
  contacts: initialContacts,
  onStageChange,
  onMutated,
}: LeadDetailTabsProps) {
  const [contacts, setContacts] = useState(initialContacts)

  return (
    <Tabs defaultValue="summary">
      <TabsList>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="activity">Activity ({activities.length})</TabsTrigger>
        <TabsTrigger value="calls-visits">Calls & Visits ({events.length})</TabsTrigger>
        <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="summary">
        <QuoteDetailPanel
          leadId={lead.id}
          quote={quote}
          initialStage={lead.stage}
          notes={notes}
          contacts={contacts}
          onContactsChange={setContacts}
          onStageChange={onStageChange}
          onMutated={onMutated}
        />
      </TabsContent>

      <TabsContent value="activity">
        <LeadActivityTimeline activities={activities} />
      </TabsContent>

      <TabsContent value="calls-visits">
        <LeadEventsPanel leadId={lead.id} events={events} />
      </TabsContent>

      <TabsContent value="documents">
        <LeadDocumentsPanel
          leadId={lead.id}
          documents={documents}
          clientAttachmentKeys={quote.attachmentUrls}
        />
      </TabsContent>
    </Tabs>
  )
}
