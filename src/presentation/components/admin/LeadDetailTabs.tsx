'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import type { LeadDTO } from '@/presentation/types/LeadDTO'
import type { LeadEventDTO } from '@/presentation/types/LeadEventDTO'
import type { LeadDocumentDTO } from '@/presentation/types/LeadDocumentDTO'
import type { LeadActivityDTO } from '@/presentation/types/LeadActivityDTO'
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
}

export function LeadDetailTabs({ lead, quote, events, documents, activities }: LeadDetailTabsProps) {
  return (
    <Tabs defaultValue="resumen">
      <TabsList>
        <TabsTrigger value="resumen">Resumen</TabsTrigger>
        <TabsTrigger value="actividad">Actividad ({activities.length})</TabsTrigger>
        <TabsTrigger value="agenda">Llamadas & Visitas ({events.length})</TabsTrigger>
        <TabsTrigger value="documentos">Documentos ({documents.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="resumen">
        <QuoteDetailPanel quote={quote} initialNotes={lead.adminNotes ?? undefined} />
      </TabsContent>

      <TabsContent value="actividad">
        <LeadActivityTimeline activities={activities} />
      </TabsContent>

      <TabsContent value="agenda">
        <LeadEventsPanel leadId={lead.id} events={events} />
      </TabsContent>

      <TabsContent value="documentos">
        <LeadDocumentsPanel
          leadId={lead.id}
          documents={documents}
          clientAttachmentKeys={quote.attachmentUrls}
        />
      </TabsContent>
    </Tabs>
  )
}
