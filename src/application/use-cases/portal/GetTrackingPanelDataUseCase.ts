import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { IPipelineStageRepository } from '@/core/repositories/IPipelineStageRepository'
import { ILeadDocumentRepository } from '@/core/repositories/ILeadDocumentRepository'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'
import { getClientStageLabel } from '@/presentation/lib/clientStageLabels'
import { LeadDocumentCategory } from '@/core/entities/LeadDocument'
import { LeadEventType } from '@/core/entities/LeadEvent'

export interface TrackingPanelDTO {
  quote: {
    name: string
    service: string
    message: string
    createdAt: Date
    attachmentUrls: string[]
  }
  clientStage: {
    key: string
    label: string
    description: string
  }
  documents: Array<{
    id: string
    fileName: string
    category: LeadDocumentCategory
    createdAt: Date
  }>
  events: Array<{
    id: string
    type: LeadEventType
    scheduledAt: Date
    durationMinutes: number
    location: string | null
  }>
  messages: Array<{
    id: string
    authorType: string
    body: string
    createdAt: Date
  }>
  unreadStaffMessages: number
}

/**
 * Resolves everything the public tracking panel (`/quote-status/[token]`) needs to
 * render, in a single DTO. The client-facing stage comes from `leads.stageId` →
 * `pipeline_stages`, never from the frozen `quotes.status` field.
 *
 * Only exposes data that is safe for an unauthenticated client to see — no
 * fileKey, internal notes, estimatedValue, adminUsers data, internal documents,
 * or cancelled events.
 */
export class GetTrackingPanelDataUseCase {
  constructor(
    private quoteRepository: IQuoteRepository,
    private leadRepository: ILeadRepository,
    private pipelineStageRepository: IPipelineStageRepository,
    private leadDocumentRepository: ILeadDocumentRepository,
    private leadEventRepository: ILeadEventRepository,
  ) {}

  async execute(token: string): Promise<TrackingPanelDTO | null> {
    const quote = await this.quoteRepository.findByToken(token)
    if (!quote) return null

    const lead = await this.leadRepository.findByQuoteId(quote.id)
    if (!lead) return null

    const stage = await this.pipelineStageRepository.findById(lead.stageId)
    const clientStageMeta = getClientStageLabel(stage?.key ?? '')

    const [allDocuments, allEvents] = await Promise.all([
      this.leadDocumentRepository.findByLeadId(lead.id),
      this.leadEventRepository.findByLeadId(lead.id),
    ])

    const documents = allDocuments
      .filter((doc) => doc.direction === 'admin_sent' && doc.archivedAt === null)
      .map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        category: doc.category,
        createdAt: doc.createdAt,
      }))

    const events = allEvents
      .filter((event) => event.status !== 'cancelled')
      .map((event) => ({
        id: event.id,
        type: event.type,
        scheduledAt: event.scheduledAt,
        durationMinutes: event.durationMinutes,
        location: event.location,
      }))

    return {
      quote: {
        name: quote.name,
        service: quote.service,
        message: quote.message,
        createdAt: quote.createdAt,
        attachmentUrls: quote.attachmentUrls,
      },
      clientStage: {
        key: stage?.key ?? '',
        label: clientStageMeta.label,
        description: clientStageMeta.description,
      },
      documents,
      events,
      messages: [],
      unreadStaffMessages: 0,
    }
  }
}
