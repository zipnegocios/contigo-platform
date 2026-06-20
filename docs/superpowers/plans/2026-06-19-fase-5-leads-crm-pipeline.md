# Fase 5 — Fusión Inbox/Leads + CRM Pipeline Completo (Llamadas, Visitas, Documentos, Timeline)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para tracking.

**Goal:** Corregir el bug por el cual los leads no aparecen automáticamente en el pipeline al recibir una solicitud de presupuesto; fusionar Inbox y Leads en una sola experiencia de admin; y añadir agenda de llamadas/visitas, gestión documental/fotográfica y timeline de actividad con filtros de fecha.

**Arquitectura:** Mantiene Clean Architecture existente (domain entities → application use cases → infrastructure repositories → presentation components). `Quote` sigue siendo la solicitud inmutable del cliente; `Lead` sigue siendo el envoltorio de CRM. Se agregan tres entidades nuevas (`LeadEvent`, `LeadDocument`, `LeadActivity`) que cuelgan de `Lead` vía `leadId`.

**Tech Stack adicional:** shadcn/ui `Calendar` + `Popover` (rango de fechas), shadcn/ui `Tabs` y `Sheet`/página dedicada para el detalle del lead. Sin librerías nuevas de calendario externo por ahora — `lead_events` es suficiente para una agenda interna; integración con Google Calendar queda fuera de alcance de esta fase.

---

## Diagnóstico (por qué las cards no aparecían)

`CreateQuoteUseCase.execute()` guarda el `Quote` pero nunca crea un `Lead`. El `Lead` solo se creaba de forma perezosa cuando un admin abría `/admin/inbox` y cambiaba el status de un quote manualmente (ver `app/api/admin/quotes/[id]/route.ts`). Resultado: el kanban de `/admin/leads` aparecía vacío hasta que alguien "tocaba" el quote desde Inbox. La Tarea 1 corrige esto en la raíz.

---

## File Structure (adiciones sobre la estructura existente)

```
src/core/
├── entities/
│   ├── LeadEvent.ts        (nuevo — llamadas y visitas)
│   ├── LeadDocument.ts     (nuevo — fotos/documentos)
│   └── LeadActivity.ts     (nuevo — timeline)
└── repositories/
    ├── ILeadEventRepository.ts
    ├── ILeadDocumentRepository.ts
    └── ILeadActivityRepository.ts

src/application/use-cases/leads/
├── CreateLeadForQuoteUseCase.ts     (nuevo — Tarea 1)
├── ChangeLeadStageUseCase.ts        (nuevo — envuelve cambio de stage + log)
├── ScheduleLeadEventUseCase.ts
├── UpdateLeadEventStatusUseCase.ts
├── AttachLeadDocumentUseCase.ts
└── AddLeadNoteUseCase.ts

src/infrastructure/repositories/
├── DrizzleLeadEventRepository.ts
├── DrizzleLeadDocumentRepository.ts
└── DrizzleLeadActivityRepository.ts

src/presentation/components/admin/
├── LeadsViewToggle.tsx         (Kanban ⇄ Tabla)
├── LeadsFilterBar.tsx          (rango de fechas, fecha específica)
├── LeadDetailTabs.tsx          (Resumen | Actividad | Llamadas & Visitas | Documentos)
├── LeadActivityTimeline.tsx
├── LeadEventsPanel.tsx
└── LeadDocumentsPanel.tsx

app/admin/
├── leads/
│   ├── page.tsx              (modificado — kanban/tabla + filtros, reemplaza inbox)
│   └── [id]/page.tsx         (nuevo — detalle completo, reemplaza app/admin/inbox/[id])
└── (eliminar) inbox/         (toda la carpeta)

app/api/admin/leads/
├── route.ts                          (GET con filtros: stage, from, to)
├── [id]/route.ts                     (GET detalle consolidado + PATCH stage/notes)
├── [id]/events/route.ts              (POST crear evento)
├── [id]/events/[eventId]/route.ts    (PATCH status del evento)
└── [id]/documents/route.ts           (POST adjuntar documento/foto)
```

---

## Task Breakdown

### Task 1: Crear el Lead automáticamente al recibir un Quote (FIX CRÍTICO)

**Files:**
- Modify: `src/application/use-cases/CreateQuoteUseCase.ts`
- Create: `src/application/use-cases/leads/CreateLeadForQuoteUseCase.ts`

**Description:** El lead debe nacer en `prospect` en el mismo momento que se guarda el quote, no después.

- [ ] **Step 1: Crear CreateLeadForQuoteUseCase**

```typescript
// src/application/use-cases/leads/CreateLeadForQuoteUseCase.ts
import { Lead } from '@/core/entities/Lead'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class CreateLeadForQuoteUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(quoteId: string): Promise<Lead> {
    const existing = await this.leadRepository.findByQuoteId(quoteId)
    if (existing) return existing

    const lead = Lead.create({ quoteId })
    await this.leadRepository.save(lead)

    const activity = LeadActivity.create({
      leadId: lead.id,
      type: 'stage_change',
      payload: { from: null, to: 'prospect', reason: 'quote_submitted' },
    })
    await this.leadActivityRepository.save(activity)

    return lead
  }
}
```

- [ ] **Step 2: Llamarlo desde CreateQuoteUseCase**

```typescript
// src/application/use-cases/CreateQuoteUseCase.ts
import { Quote, CreateQuoteInput } from '@/core/entities/Quote'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { IEmailService } from '@/core/services/IEmailService'
import { IEmbeddingService } from '@/core/services/IEmbeddingService'
import { CreateLeadForQuoteUseCase } from './leads/CreateLeadForQuoteUseCase'

export class CreateQuoteUseCase {
  constructor(
    private quoteRepository: IQuoteRepository,
    private emailService: IEmailService,
    private embeddingService: IEmbeddingService,
    private createLeadForQuote: CreateLeadForQuoteUseCase, // NUEVO
  ) {}

  async execute(input: CreateQuoteInput): Promise<string> {
    const quote = Quote.create(input)
    await this.quoteRepository.save(quote)

    // NUEVO: el lead nace aquí, no cuando el admin lo "toca"
    await this.createLeadForQuote.execute(quote.id)

    await Promise.all([
      this.emailService.sendQuoteConfirmation(quote),
      this.emailService.sendAdminNotification(quote),
    ])

    this.generateEmbeddingAsync(quote).catch((err) => {
      console.error(`Failed to generate embedding for quote ${quote.id}:`, err)
    })

    return quote.trackingToken
  }

  private async generateEmbeddingAsync(quote: Quote): Promise<void> {
    try {
      const text = `${quote.name} ${quote.service} ${quote.message}`
      const embedding = await this.embeddingService.generateEmbedding(text)
      const quoteWithEmbedding = quote as any
      quoteWithEmbedding.descriptionVector = embedding
      await this.quoteRepository.update(quoteWithEmbedding)
    } catch (error) {
      console.error('Embedding generation failed:', error)
    }
  }
}
```

- [ ] **Step 3: Actualizar app/api/quotes/route.ts para inyectar la dependencia**

```typescript
// app/api/quotes/route.ts
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { CreateLeadForQuoteUseCase } from '@/application/use-cases/leads/CreateLeadForQuoteUseCase'
// ...resto de imports existentes

// dentro del POST handler:
const leadRepository = new DrizzleLeadRepository()
const leadActivityRepository = new DrizzleLeadActivityRepository()
const createLeadForQuote = new CreateLeadForQuoteUseCase(leadRepository, leadActivityRepository)

const useCase = new CreateQuoteUseCase(
  quoteRepository,
  emailService,
  embeddingService,
  createLeadForQuote,
)
```

- [ ] **Step 4: Commit**

```bash
git add src/application/use-cases/CreateQuoteUseCase.ts
git add src/application/use-cases/leads/CreateLeadForQuoteUseCase.ts
git add app/api/quotes/route.ts
git commit -m "fix: crear Lead automáticamente al recibir un Quote (root cause de pipeline vacío)"
```

---

### Task 2: Migración de base de datos — nuevas tablas y enums

**Files:**
- Modify: `src/infrastructure/db/schema.ts`

**Description:** Agregar `lead_events`, `lead_documents`, `lead_activities` y sus enums.

- [ ] **Step 1: Agregar enums (junto a los existentes en schema.ts)**

```typescript
export const leadEventTypeEnum = pgEnum('lead_event_type', ['call', 'site_visit', 'meeting'])

export const leadEventStatusEnum = pgEnum('lead_event_status', [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
])

export const leadDocumentDirectionEnum = pgEnum('lead_document_direction', [
  'client_upload',
  'admin_sent',
  'internal',
])

export const leadDocumentCategoryEnum = pgEnum('lead_document_category', [
  'reference_photo',
  'site_photo',
  'quote_pdf',
  'contract',
  'other',
])

export const leadActivityTypeEnum = pgEnum('lead_activity_type', [
  'stage_change',
  'note',
  'call_scheduled',
  'call_completed',
  'call_cancelled',
  'visit_scheduled',
  'visit_completed',
  'visit_cancelled',
  'document_uploaded',
  'document_sent',
  'email_sent',
  'quote_status_changed',
])
```

- [ ] **Step 2: Agregar las tablas (después de `leads`, antes de `mediaFolders`)**

```typescript
// ============ LEAD EVENTS TABLE (llamadas, visitas, reuniones) ============
export const leadEvents = pgTable(
  'lead_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    type: leadEventTypeEnum('type').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(30),
    status: leadEventStatusEnum('status').notNull().default('scheduled'),
    location: text('location'), // dirección para visitas, link/teléfono para llamadas
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_lead_events_lead_id').on(table.leadId),
    index('idx_lead_events_scheduled_at').on(table.scheduledAt),
    index('idx_lead_events_status').on(table.status),
  ],
)

// ============ LEAD DOCUMENTS TABLE (fotos y documentos) ============
export const leadDocuments = pgTable(
  'lead_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    fileKey: text('file_key').notNull(), // key en R2 (contigo-quotes) o key de media library reusado
    fileName: varchar('file_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }),
    direction: leadDocumentDirectionEnum('direction').notNull(),
    category: leadDocumentCategoryEnum('category').notNull().default('other'),
    sourceMediaId: uuid('source_media_id'), // si se reusó una imagen del Media Library/Portfolio
    uploadedBy: uuid('uploaded_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_lead_documents_lead_id').on(table.leadId),
    index('idx_lead_documents_direction').on(table.direction),
  ],
)

// ============ LEAD ACTIVITIES TABLE (timeline / auditoría) ============
export const leadActivities = pgTable(
  'lead_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    type: leadActivityTypeEnum('type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_lead_activities_lead_id').on(table.leadId),
    index('idx_lead_activities_created_at').on(table.createdAt),
    index('idx_lead_activities_type').on(table.type),
  ],
)
```

- [ ] **Step 3: Generar y revisar la migración**

```bash
pnpm drizzle-kit generate
# revisar el SQL generado en drizzle/ antes de aplicar
pnpm drizzle-kit migrate
```

- [ ] **Step 4: Commit**

```bash
git add src/infrastructure/db/schema.ts drizzle/
git commit -m "feat: agregar tablas lead_events, lead_documents, lead_activities"
```

---

### Task 3: Entidades de dominio

**Files:**
- Create: `src/core/entities/LeadEvent.ts`
- Create: `src/core/entities/LeadDocument.ts`
- Create: `src/core/entities/LeadActivity.ts`

```typescript
// src/core/entities/LeadEvent.ts
export type LeadEventType = 'call' | 'site_visit' | 'meeting'
export type LeadEventStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface CreateLeadEventInput {
  leadId: string
  type: LeadEventType
  scheduledAt: Date
  durationMinutes?: number
  location?: string
  notes?: string
  createdBy?: string
}

export class LeadEvent {
  readonly id: string
  readonly leadId: string
  readonly type: LeadEventType
  readonly scheduledAt: Date
  readonly durationMinutes: number
  readonly status: LeadEventStatus
  readonly location: string | null
  readonly notes: string | null
  readonly createdBy: string | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    leadId: string
    type: LeadEventType
    scheduledAt: Date
    durationMinutes: number
    status: LeadEventStatus
    location: string | null
    notes: string | null
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.type = props.type
    this.scheduledAt = props.scheduledAt
    this.durationMinutes = props.durationMinutes
    this.status = props.status
    this.location = props.location
    this.notes = props.notes
    this.createdBy = props.createdBy
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateLeadEventInput): LeadEvent {
    const now = new Date()
    return new LeadEvent({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      type: input.type,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes ?? 30,
      status: 'scheduled',
      location: input.location ?? null,
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  withStatus(status: LeadEventStatus): LeadEvent {
    return new LeadEvent({ ...this, status, updatedAt: new Date() })
  }

  withNotes(notes: string): LeadEvent {
    return new LeadEvent({ ...this, notes, updatedAt: new Date() })
  }

  static reconstruct(props: {
    id: string
    leadId: string
    type: LeadEventType
    scheduledAt: Date
    durationMinutes: number
    status: LeadEventStatus
    location: string | null
    notes: string | null
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
  }): LeadEvent {
    return new LeadEvent(props)
  }
}
```

```typescript
// src/core/entities/LeadDocument.ts
export type LeadDocumentDirection = 'client_upload' | 'admin_sent' | 'internal'
export type LeadDocumentCategory = 'reference_photo' | 'site_photo' | 'quote_pdf' | 'contract' | 'other'

export interface CreateLeadDocumentInput {
  leadId: string
  fileKey: string
  fileName: string
  mimeType?: string
  direction: LeadDocumentDirection
  category?: LeadDocumentCategory
  sourceMediaId?: string
  uploadedBy?: string
}

export class LeadDocument {
  readonly id: string
  readonly leadId: string
  readonly fileKey: string
  readonly fileName: string
  readonly mimeType: string | null
  readonly direction: LeadDocumentDirection
  readonly category: LeadDocumentCategory
  readonly sourceMediaId: string | null
  readonly uploadedBy: string | null
  readonly createdAt: Date

  private constructor(props: {
    id: string
    leadId: string
    fileKey: string
    fileName: string
    mimeType: string | null
    direction: LeadDocumentDirection
    category: LeadDocumentCategory
    sourceMediaId: string | null
    uploadedBy: string | null
    createdAt: Date
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.fileKey = props.fileKey
    this.fileName = props.fileName
    this.mimeType = props.mimeType
    this.direction = props.direction
    this.category = props.category
    this.sourceMediaId = props.sourceMediaId
    this.uploadedBy = props.uploadedBy
    this.createdAt = props.createdAt
  }

  static create(input: CreateLeadDocumentInput): LeadDocument {
    return new LeadDocument({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      fileKey: input.fileKey,
      fileName: input.fileName,
      mimeType: input.mimeType ?? null,
      direction: input.direction,
      category: input.category ?? 'other',
      sourceMediaId: input.sourceMediaId ?? null,
      uploadedBy: input.uploadedBy ?? null,
      createdAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    leadId: string
    fileKey: string
    fileName: string
    mimeType: string | null
    direction: LeadDocumentDirection
    category: LeadDocumentCategory
    sourceMediaId: string | null
    uploadedBy: string | null
    createdAt: Date
  }): LeadDocument {
    return new LeadDocument(props)
  }
}
```

```typescript
// src/core/entities/LeadActivity.ts
export type LeadActivityType =
  | 'stage_change'
  | 'note'
  | 'call_scheduled'
  | 'call_completed'
  | 'call_cancelled'
  | 'visit_scheduled'
  | 'visit_completed'
  | 'visit_cancelled'
  | 'document_uploaded'
  | 'document_sent'
  | 'email_sent'
  | 'quote_status_changed'

export interface CreateLeadActivityInput {
  leadId: string
  type: LeadActivityType
  payload?: Record<string, unknown>
  createdBy?: string
}

export class LeadActivity {
  readonly id: string
  readonly leadId: string
  readonly type: LeadActivityType
  readonly payload: Record<string, unknown>
  readonly createdBy: string | null
  readonly createdAt: Date

  private constructor(props: {
    id: string
    leadId: string
    type: LeadActivityType
    payload: Record<string, unknown>
    createdBy: string | null
    createdAt: Date
  }) {
    this.id = props.id
    this.leadId = props.leadId
    this.type = props.type
    this.payload = props.payload
    this.createdBy = props.createdBy
    this.createdAt = props.createdAt
  }

  static create(input: CreateLeadActivityInput): LeadActivity {
    return new LeadActivity({
      id: crypto.randomUUID(),
      leadId: input.leadId,
      type: input.type,
      payload: input.payload ?? {},
      createdBy: input.createdBy ?? null,
      createdAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    leadId: string
    type: LeadActivityType
    payload: Record<string, unknown>
    createdBy: string | null
    createdAt: Date
  }): LeadActivity {
    return new LeadActivity(props)
  }
}
```

- [ ] **Commit**

```bash
git add src/core/entities/LeadEvent.ts src/core/entities/LeadDocument.ts src/core/entities/LeadActivity.ts
git commit -m "feat: agregar entidades LeadEvent, LeadDocument, LeadActivity"
```

---

### Task 4: Interfaces de repositorio + implementaciones Drizzle

**Files:**
- Create: `src/core/repositories/ILeadEventRepository.ts`, `ILeadDocumentRepository.ts`, `ILeadActivityRepository.ts`
- Create: `src/infrastructure/repositories/DrizzleLeadEventRepository.ts`, `DrizzleLeadDocumentRepository.ts`, `DrizzleLeadActivityRepository.ts`

- [ ] **Step 1: Interfaces**

```typescript
// src/core/repositories/ILeadEventRepository.ts
import { LeadEvent } from '@/core/entities/LeadEvent'

export interface ILeadEventRepository {
  save(event: LeadEvent): Promise<void>
  findById(id: string): Promise<LeadEvent | null>
  findByLeadId(leadId: string): Promise<LeadEvent[]>
  findUpcoming(from: Date, to: Date): Promise<LeadEvent[]> // para el calendario global de admin
  update(event: LeadEvent): Promise<void>
}
```

```typescript
// src/core/repositories/ILeadDocumentRepository.ts
import { LeadDocument } from '@/core/entities/LeadDocument'

export interface ILeadDocumentRepository {
  save(document: LeadDocument): Promise<void>
  findByLeadId(leadId: string): Promise<LeadDocument[]>
}
```

```typescript
// src/core/repositories/ILeadActivityRepository.ts
import { LeadActivity } from '@/core/entities/LeadActivity'

export interface ILeadActivityRepository {
  save(activity: LeadActivity): Promise<void>
  findByLeadId(leadId: string): Promise<LeadActivity[]>
}
```

- [ ] **Step 2: Implementaciones Drizzle**

```typescript
// src/infrastructure/repositories/DrizzleLeadEventRepository.ts
import { eq, asc, and, gte, lte } from 'drizzle-orm'
import { db } from '../db/client'
import { leadEvents } from '../db/schema'
import { LeadEvent } from '@/core/entities/LeadEvent'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'

export class DrizzleLeadEventRepository implements ILeadEventRepository {
  async save(event: LeadEvent): Promise<void> {
    await db.insert(leadEvents).values({
      id: event.id,
      leadId: event.leadId,
      type: event.type,
      scheduledAt: event.scheduledAt,
      durationMinutes: event.durationMinutes,
      status: event.status,
      location: event.location,
      notes: event.notes,
      createdBy: event.createdBy,
    })
  }

  async findById(id: string): Promise<LeadEvent | null> {
    const rows = await db.select().from(leadEvents).where(eq(leadEvents.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByLeadId(leadId: string): Promise<LeadEvent[]> {
    const rows = await db
      .select()
      .from(leadEvents)
      .where(eq(leadEvents.leadId, leadId))
      .orderBy(asc(leadEvents.scheduledAt))
    return rows.map(this.mapRow)
  }

  async findUpcoming(from: Date, to: Date): Promise<LeadEvent[]> {
    const rows = await db
      .select()
      .from(leadEvents)
      .where(and(gte(leadEvents.scheduledAt, from), lte(leadEvents.scheduledAt, to)))
      .orderBy(asc(leadEvents.scheduledAt))
    return rows.map(this.mapRow)
  }

  async update(event: LeadEvent): Promise<void> {
    await db
      .update(leadEvents)
      .set({
        status: event.status,
        notes: event.notes,
        scheduledAt: event.scheduledAt,
        durationMinutes: event.durationMinutes,
        updatedAt: event.updatedAt,
      })
      .where(eq(leadEvents.id, event.id))
  }

  private mapRow(row: any): LeadEvent {
    return LeadEvent.reconstruct({
      id: row.id,
      leadId: row.leadId,
      type: row.type,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      status: row.status,
      location: row.location,
      notes: row.notes,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
```

```typescript
// src/infrastructure/repositories/DrizzleLeadDocumentRepository.ts
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { leadDocuments } from '../db/schema'
import { LeadDocument } from '@/core/entities/LeadDocument'
import { ILeadDocumentRepository } from '@/core/repositories/ILeadDocumentRepository'

export class DrizzleLeadDocumentRepository implements ILeadDocumentRepository {
  async save(document: LeadDocument): Promise<void> {
    await db.insert(leadDocuments).values({
      id: document.id,
      leadId: document.leadId,
      fileKey: document.fileKey,
      fileName: document.fileName,
      mimeType: document.mimeType,
      direction: document.direction,
      category: document.category,
      sourceMediaId: document.sourceMediaId,
      uploadedBy: document.uploadedBy,
    })
  }

  async findByLeadId(leadId: string): Promise<LeadDocument[]> {
    const rows = await db
      .select()
      .from(leadDocuments)
      .where(eq(leadDocuments.leadId, leadId))
      .orderBy(desc(leadDocuments.createdAt))

    return rows.map((row) =>
      LeadDocument.reconstruct({
        id: row.id,
        leadId: row.leadId,
        fileKey: row.fileKey,
        fileName: row.fileName,
        mimeType: row.mimeType,
        direction: row.direction,
        category: row.category,
        sourceMediaId: row.sourceMediaId,
        uploadedBy: row.uploadedBy,
        createdAt: row.createdAt,
      }),
    )
  }
}
```

```typescript
// src/infrastructure/repositories/DrizzleLeadActivityRepository.ts
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { leadActivities } from '../db/schema'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class DrizzleLeadActivityRepository implements ILeadActivityRepository {
  async save(activity: LeadActivity): Promise<void> {
    await db.insert(leadActivities).values({
      id: activity.id,
      leadId: activity.leadId,
      type: activity.type,
      payload: activity.payload,
      createdBy: activity.createdBy,
    })
  }

  async findByLeadId(leadId: string): Promise<LeadActivity[]> {
    const rows = await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt))

    return rows.map((row) =>
      LeadActivity.reconstruct({
        id: row.id,
        leadId: row.leadId,
        type: row.type,
        payload: row.payload as Record<string, unknown>,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
      }),
    )
  }
}
```

- [ ] **Commit**

```bash
git add src/core/repositories/ILead*.ts src/infrastructure/repositories/DrizzleLead*.ts
git commit -m "feat: repositorios para LeadEvent, LeadDocument, LeadActivity"
```

---

### Task 5: Use cases que conectan todo con el timeline

**Files:**
- Create: `src/application/use-cases/leads/ScheduleLeadEventUseCase.ts`
- Create: `src/application/use-cases/leads/UpdateLeadEventStatusUseCase.ts`
- Create: `src/application/use-cases/leads/AttachLeadDocumentUseCase.ts`
- Create: `src/application/use-cases/leads/ChangeLeadStageUseCase.ts`

**Description:** Cada acción de negocio relevante debe escribir una entrada en `lead_activities`. Esto es lo que alimenta el tab "Actividad" sin esfuerzo manual.

```typescript
// src/application/use-cases/leads/ScheduleLeadEventUseCase.ts
import { LeadEvent, LeadEventType } from '@/core/entities/LeadEvent'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class ScheduleLeadEventUseCase {
  constructor(
    private leadEventRepository: ILeadEventRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(input: {
    leadId: string
    type: LeadEventType
    scheduledAt: Date
    durationMinutes?: number
    location?: string
    notes?: string
    createdBy?: string
  }): Promise<LeadEvent> {
    const event = LeadEvent.create(input)
    await this.leadEventRepository.save(event)

    const activity = LeadActivity.create({
      leadId: input.leadId,
      type: input.type === 'call' ? 'call_scheduled' : 'visit_scheduled',
      payload: { eventId: event.id, scheduledAt: input.scheduledAt.toISOString(), location: input.location },
      createdBy: input.createdBy,
    })
    await this.leadActivityRepository.save(activity)

    return event
  }
}
```

```typescript
// src/application/use-cases/leads/UpdateLeadEventStatusUseCase.ts
import { LeadEventStatus } from '@/core/entities/LeadEvent'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadEventRepository } from '@/core/repositories/ILeadEventRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

const STATUS_TO_ACTIVITY = {
  completed: { call: 'call_completed', site_visit: 'visit_completed', meeting: 'visit_completed' },
  cancelled: { call: 'call_cancelled', site_visit: 'visit_cancelled', meeting: 'visit_cancelled' },
} as const

export class UpdateLeadEventStatusUseCase {
  constructor(
    private leadEventRepository: ILeadEventRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(eventId: string, status: LeadEventStatus, createdBy?: string): Promise<void> {
    const event = await this.leadEventRepository.findById(eventId)
    if (!event) throw new Error('Lead event not found')

    const updated = event.withStatus(status)
    await this.leadEventRepository.update(updated)

    const activityType = (STATUS_TO_ACTIVITY as any)[status]?.[event.type]
    if (activityType) {
      const activity = LeadActivity.create({
        leadId: event.leadId,
        type: activityType,
        payload: { eventId: event.id },
        createdBy,
      })
      await this.leadActivityRepository.save(activity)
    }
  }
}
```

```typescript
// src/application/use-cases/leads/AttachLeadDocumentUseCase.ts
import { LeadDocument, CreateLeadDocumentInput } from '@/core/entities/LeadDocument'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadDocumentRepository } from '@/core/repositories/ILeadDocumentRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class AttachLeadDocumentUseCase {
  constructor(
    private leadDocumentRepository: ILeadDocumentRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(input: CreateLeadDocumentInput): Promise<LeadDocument> {
    const document = LeadDocument.create(input)
    await this.leadDocumentRepository.save(document)

    const activity = LeadActivity.create({
      leadId: input.leadId,
      type: input.direction === 'admin_sent' ? 'document_sent' : 'document_uploaded',
      payload: { documentId: document.id, fileName: input.fileName, category: input.category },
      createdBy: input.uploadedBy,
    })
    await this.leadActivityRepository.save(activity)

    return document
  }
}
```

```typescript
// src/application/use-cases/leads/ChangeLeadStageUseCase.ts
import { Lead, LeadStage } from '@/core/entities/Lead'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class ChangeLeadStageUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(leadId: string, newStage: LeadStage, createdBy?: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId)
    if (!lead) throw new Error('Lead not found')

    const previousStage = lead.stage
    const updated = lead.withStage(newStage)
    await this.leadRepository.update(updated)

    if (previousStage !== newStage) {
      const activity = LeadActivity.create({
        leadId,
        type: 'stage_change',
        payload: { from: previousStage, to: newStage },
        createdBy,
      })
      await this.leadActivityRepository.save(activity)
    }

    return updated
  }
}
```

- [ ] **Step: Reemplazar la lógica inline de `app/api/admin/leads/[id]/route.ts` y `app/api/admin/quotes/[id]/route.ts` para usar `ChangeLeadStageUseCase` en vez de llamar `leadRepo.update()` directo.** Esto asegura que **todo** cambio de etapa quede registrado en el timeline, sin importar desde qué pantalla se origine (kanban drag-drop o panel de detalle).

- [ ] **Commit**

```bash
git add src/application/use-cases/leads/
git commit -m "feat: use cases de agenda, documentos y cambio de etapa con logging automático a timeline"
```

---

### Task 6: API routes

**Files:**
- Create: `app/api/admin/leads/[id]/events/route.ts`
- Create: `app/api/admin/leads/[id]/events/[eventId]/route.ts`
- Create: `app/api/admin/leads/[id]/documents/route.ts`
- Modify: `app/api/admin/leads/[id]/route.ts` (GET consolidado: quote + lead + events + documents + activities)
- Modify: `app/api/admin/leads/route.ts` (GET con filtros `stage`, `from`, `to`)

- [ ] **Step 1: POST crear evento**

```typescript
// app/api/admin/leads/[id]/events/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { ScheduleLeadEventUseCase } from '@/application/use-cases/leads/ScheduleLeadEventUseCase'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, scheduledAt, durationMinutes, location, notes } = body

  if (!type || !scheduledAt) {
    return Response.json({ error: 'type y scheduledAt son requeridos' }, { status: 400 })
  }

  const useCase = new ScheduleLeadEventUseCase(
    new DrizzleLeadEventRepository(),
    new DrizzleLeadActivityRepository(),
  )

  const event = await useCase.execute({
    leadId: params.id,
    type,
    scheduledAt: new Date(scheduledAt),
    durationMinutes,
    location,
    notes,
    createdBy: (session.user as any)?.id,
  })

  return Response.json({ success: true, event }, { status: 201 })
}
```

- [ ] **Step 2: PATCH status de evento**

```typescript
// app/api/admin/leads/[id]/events/[eventId]/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { UpdateLeadEventStatusUseCase } from '@/application/use-cases/leads/UpdateLeadEventStatusUseCase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; eventId: string } },
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await request.json()
  const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show']
  if (!validStatuses.includes(status)) {
    return Response.json({ error: 'status inválido' }, { status: 400 })
  }

  const useCase = new UpdateLeadEventStatusUseCase(
    new DrizzleLeadEventRepository(),
    new DrizzleLeadActivityRepository(),
  )
  await useCase.execute(params.eventId, status, (session.user as any)?.id)

  return Response.json({ success: true })
}
```

- [ ] **Step 3: POST adjuntar documento (dos modos: reusar del Media Library o subir nuevo a R2)**

```typescript
// app/api/admin/leads/[id]/documents/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { AttachLeadDocumentUseCase } from '@/application/use-cases/leads/AttachLeadDocumentUseCase'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { fileKey, fileName, mimeType, direction, category, sourceMediaId } = body

  if (!fileKey || !fileName || !direction) {
    return Response.json({ error: 'fileKey, fileName y direction son requeridos' }, { status: 400 })
  }

  const useCase = new AttachLeadDocumentUseCase(
    new DrizzleLeadDocumentRepository(),
    new DrizzleLeadActivityRepository(),
  )

  const document = await useCase.execute({
    leadId: params.id,
    fileKey,
    fileName,
    mimeType,
    direction,
    category,
    sourceMediaId,
    uploadedBy: (session.user as any)?.id,
  })

  return Response.json({ success: true, document }, { status: 201 })
}
```

> Nota: cuando `direction = 'admin_sent'` y el archivo viene del Media Library existente, `fileKey` y `sourceMediaId` apuntan a la imagen ya subida — no se duplica storage en R2. Cuando es una foto nueva específica del cliente, el front primero pide un presigned URL al endpoint existente de upload (`/api/admin/upload/presign`) y luego llama a este endpoint con el `fileKey` resultante.

- [ ] **Step 4: GET detalle consolidado del lead**

```typescript
// app/api/admin/leads/[id]/route.ts (agregar GET, mantener el PATCH ya existente)
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const leadRepo = new DrizzleLeadRepository()
  const lead = await leadRepo.findById(params.id)
  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 })

  const [quote, events, documents, activities] = await Promise.all([
    new DrizzleQuoteRepository().findById(lead.quoteId),
    new DrizzleLeadEventRepository().findByLeadId(lead.id),
    new DrizzleLeadDocumentRepository().findByLeadId(lead.id),
    new DrizzleLeadActivityRepository().findByLeadId(lead.id),
  ])

  return Response.json({ lead, quote, events, documents, activities })
}
```

- [ ] **Step 5: Filtros de fecha en el listado**

```typescript
// app/api/admin/leads/route.ts
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage') ?? undefined
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined

  const leadRepo = new DrizzleLeadRepository()
  const quoteRepo = new DrizzleQuoteRepository()

  const leads = await leadRepo.findAllFiltered({ stage, createdFrom: from, createdTo: to })
  const enriched = await Promise.all(
    leads.map(async (lead) => ({ ...lead, quote: await quoteRepo.findById(lead.quoteId) })),
  )

  return Response.json({ leads: enriched })
}
```

```typescript
// src/infrastructure/repositories/DrizzleLeadRepository.ts — AGREGAR este método
import { and, gte, lte, eq } from 'drizzle-orm'
import { quotes } from '../db/schema'

async findAllFiltered(filters: {
  stage?: string
  createdFrom?: Date
  createdTo?: Date
}): Promise<Lead[]> {
  const conditions = []
  if (filters.stage) conditions.push(eq(leads.stage, filters.stage as any))

  // El filtro de fecha se aplica sobre quotes.createdAt (fecha real de la solicitud)
  // requiere join porque leads.updatedAt cambia con cada movimiento de stage
  const rows = await db
    .select({ lead: leads, quote: quotes })
    .from(leads)
    .innerJoin(quotes, eq(leads.quoteId, quotes.id))
    .where(
      and(
        ...conditions,
        filters.createdFrom ? gte(quotes.createdAt, filters.createdFrom) : undefined,
        filters.createdTo ? lte(quotes.createdAt, filters.createdTo) : undefined,
      ),
    )
    .orderBy(desc(leads.updatedAt))

  return rows.map((r) => this.mapRowToLead(r.lead))
}
```

- [ ] **Commit**

```bash
git add app/api/admin/leads/
git add src/infrastructure/repositories/DrizzleLeadRepository.ts
git commit -m "feat: API routes para eventos, documentos, detalle consolidado y filtros de fecha"
```

---

### Task 7: Fusión visual — eliminar Inbox del sidebar

**Files:**
- Modify: `src/presentation/components/admin/AdminSidebar.tsx`
- Delete: `app/admin/inbox/` (carpeta completa)

- [ ] **Step 1: Quitar el item "Inbox" del array `navItems`**

```typescript
// src/presentation/components/admin/AdminSidebar.tsx
const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  // { label: 'Inbox', href: '/admin/inbox', icon: Inbox },  ← ELIMINAR esta línea
  { label: 'Projects', href: '/admin/projects', icon: FolderOpen },
  { label: 'Services', href: '/admin/services', icon: Briefcase },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
  { label: 'Media Library', href: '/admin/media', icon: Images },
  { label: 'Leads', href: '/admin/leads', icon: Trello },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]
```

- [ ] **Step 2: Borrar la carpeta Inbox**

```bash
git rm -r app/admin/inbox
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/admin/AdminSidebar.tsx
git commit -m "refactor: fusionar Inbox dentro de Leads, eliminar ruta /admin/inbox"
```

---

### Task 8: Vista Kanban/Tabla con filtros de fecha

**Files:**
- Create: `src/presentation/components/admin/LeadsViewToggle.tsx`
- Create: `src/presentation/components/admin/LeadsFilterBar.tsx`
- Modify: `app/admin/leads/page.tsx`

**Description:** El kanban ya existe (`LeadsKanban`); se agrega un toggle a vista de tabla (reusando el diseño de la `QuoteInboxTable` original pero apuntando a `leads` en vez de `quotes`) y una barra de filtros de fecha arriba.

- [ ] **Step 1: Filter bar con rango de fechas y fecha específica (shadcn Calendar + Popover)**

```typescript
// src/presentation/components/admin/LeadsFilterBar.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

const presets = [
  { label: 'Hoy', getRange: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Últimos 7 días', getRange: () => ({ from: new Date(Date.now() - 6 * 86400000), to: new Date() }) },
  { label: 'Este mes', getRange: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date() }) },
]

export function LeadsFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [range, setRange] = useState<DateRange | undefined>()

  const applyRange = (r: DateRange | undefined) => {
    setRange(r)
    const params = new URLSearchParams(searchParams.toString())
    if (r?.from) params.set('from', r.from.toISOString().split('T')[0])
    else params.delete('from')
    if (r?.to) params.set('to', r.to.toISOString().split('T')[0])
    else params.delete('to')
    router.push(`/admin/leads?${params.toString()}`)
  }

  const clear = () => applyRange(undefined)

  return (
    <div className="flex items-center gap-2">
      {presets.map((p) => (
        <Button key={p.label} variant="outline" size="sm" onClick={() => applyRange(p.getRange())}>
          {p.label}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            {range?.from
              ? `${range.from.toLocaleDateString()}${range.to ? ' – ' + range.to.toLocaleDateString() : ''}`
              : 'Rango de fechas'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="range" selected={range} onSelect={applyRange} numberOfMonths={2} />
        </PopoverContent>
      </Popover>

      {(searchParams.get('from') || searchParams.get('to')) && (
        <Button variant="ghost" size="sm" onClick={clear} className="gap-1">
          <X className="h-3 w-3" /> Limpiar
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Toggle Kanban/Tabla**

```typescript
// src/presentation/components/admin/LeadsViewToggle.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LeadsViewToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('view') ?? 'kanban'

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    router.push(`/admin/leads?${params.toString()}`)
  }

  return (
    <div className="flex rounded-lg border p-1">
      <Button variant={current === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('kanban')}>
        <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
      </Button>
      <Button variant={current === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('table')}>
        <List className="h-4 w-4 mr-1" /> Tabla
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Página principal de Leads usando ambos**

```typescript
// app/admin/leads/page.tsx
import { LeadsKanban } from '@/presentation/components/admin/LeadsKanban'
import { LeadsTable } from '@/presentation/components/admin/LeadsTable' // nuevo, basado en QuoteInboxTable
import { LeadsFilterBar } from '@/presentation/components/admin/LeadsFilterBar'
import { LeadsViewToggle } from '@/presentation/components/admin/LeadsViewToggle'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; from?: string; to?: string }>
}) {
  const { view = 'kanban', from, to } = await searchParams

  const leadRepo = new DrizzleLeadRepository()
  const quoteRepo = new DrizzleQuoteRepository()

  const leads = await leadRepo.findAllFiltered({
    createdFrom: from ? new Date(from) : undefined,
    createdTo: to ? new Date(to) : undefined,
  })

  const enriched = await Promise.all(
    leads.map(async (lead) => ({ ...lead, quote: await quoteRepo.findById(lead.quoteId) })),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Solicitudes de presupuesto y su seguimiento</p>
        </div>
        <LeadsViewToggle />
      </div>

      <LeadsFilterBar />

      {view === 'kanban' ? <LeadsKanban leads={enriched} /> : <LeadsTable leads={enriched} />}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/presentation/components/admin/LeadsFilterBar.tsx
git add src/presentation/components/admin/LeadsViewToggle.tsx
git add app/admin/leads/page.tsx
git commit -m "feat: vista kanban/tabla con filtros por rango y fecha específica"
```

---

### Task 9: Vista de detalle completo del lead (Resumen | Actividad | Llamadas & Visitas | Documentos)

**Files:**
- Create: `app/admin/leads/[id]/page.tsx`
- Create: `src/presentation/components/admin/LeadDetailTabs.tsx`
- Create: `src/presentation/components/admin/LeadActivityTimeline.tsx`
- Create: `src/presentation/components/admin/LeadEventsPanel.tsx`
- Create: `src/presentation/components/admin/LeadDocumentsPanel.tsx`

**Description:** Reemplaza `app/admin/inbox/[id]/page.tsx`. Mantiene todo lo que ya hacía `QuoteDetailPanel` (datos de contacto, mensaje, adjuntos originales, status) dentro del tab "Resumen", y agrega los tabs nuevos.

- [ ] **Step 1: Página de detalle (Server Component, fetch consolidado)**

```typescript
// app/admin/leads/[id]/page.tsx
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { LeadDetailTabs } from '@/presentation/components/admin/LeadDetailTabs'
import { toQuoteDTO } from '@/presentation/types/QuoteDTO'
import { notFound } from 'next/navigation'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const leadRepo = new DrizzleLeadRepository()
  const lead = await leadRepo.findById(id)
  if (!lead) notFound()

  const [quote, events, documents, activities] = await Promise.all([
    new DrizzleQuoteRepository().findById(lead.quoteId),
    new DrizzleLeadEventRepository().findByLeadId(lead.id),
    new DrizzleLeadDocumentRepository().findByLeadId(lead.id),
    new DrizzleLeadActivityRepository().findByLeadId(lead.id),
  ])

  if (!quote) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{quote.name}</h1>
        <p className="text-muted-foreground">{quote.service}</p>
      </div>

      <LeadDetailTabs
        lead={lead}
        quote={toQuoteDTO(quote)}
        events={events}
        documents={documents}
        activities={activities}
      />
    </div>
  )
}
```

- [ ] **Step 2: Tabs**

```typescript
// src/presentation/components/admin/LeadDetailTabs.tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuoteDetailPanel } from './QuoteDetailPanel' // el panel "Resumen" ya existente, se reusa tal cual
import { LeadActivityTimeline } from './LeadActivityTimeline'
import { LeadEventsPanel } from './LeadEventsPanel'
import { LeadDocumentsPanel } from './LeadDocumentsPanel'

export function LeadDetailTabs({ lead, quote, events, documents, activities }: any) {
  return (
    <Tabs defaultValue="resumen">
      <TabsList>
        <TabsTrigger value="resumen">Resumen</TabsTrigger>
        <TabsTrigger value="actividad">Actividad ({activities.length})</TabsTrigger>
        <TabsTrigger value="agenda">Llamadas & Visitas ({events.length})</TabsTrigger>
        <TabsTrigger value="documentos">Documentos ({documents.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="resumen">
        <QuoteDetailPanel
          quoteId={quote.id}
          initialStatus={quote.status}
          name={quote.name}
          email={quote.email}
          phone={quote.phone}
          service={quote.service}
          message={quote.message}
          trackingToken={quote.trackingToken}
          createdAt={quote.createdAt}
        />
      </TabsContent>

      <TabsContent value="actividad">
        <LeadActivityTimeline activities={activities} />
      </TabsContent>

      <TabsContent value="agenda">
        <LeadEventsPanel leadId={lead.id} events={events} />
      </TabsContent>

      <TabsContent value="documentos">
        <LeadDocumentsPanel leadId={lead.id} documents={documents} />
      </TabsContent>
    </Tabs>
  )
}
```

- [ ] **Step 3: Timeline (solo lectura, formatea cada tipo de actividad)**

```typescript
// src/presentation/components/admin/LeadActivityTimeline.tsx
'use client'

import { Phone, MapPin, FileText, ArrowRight, Mail, StickyNote } from 'lucide-react'

const ICONS: Record<string, any> = {
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

const LABELS: Record<string, (payload: any) => string> = {
  stage_change: (p) => `Etapa cambiada de "${p.from ?? '—'}" a "${p.to}"`,
  call_scheduled: (p) => `Llamada agendada para ${new Date(p.scheduledAt).toLocaleString()}`,
  call_completed: () => 'Llamada completada',
  call_cancelled: () => 'Llamada cancelada',
  visit_scheduled: (p) => `Visita agendada para ${new Date(p.scheduledAt).toLocaleString()}`,
  visit_completed: () => 'Visita completada',
  visit_cancelled: () => 'Visita cancelada',
  document_uploaded: (p) => `Documento recibido: ${p.fileName}`,
  document_sent: (p) => `Documento enviado al cliente: ${p.fileName}`,
  note: (p) => p.text ?? 'Nota agregada',
}

export function LeadActivityTimeline({ activities }: { activities: any[] }) {
  if (!activities.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Sin actividad registrada todavía.</p>
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
```

- [ ] **Step 4: Panel de agenda (formulario para programar + lista, con acciones completar/cancelar)**

```typescript
// src/presentation/components/admin/LeadEventsPanel.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function LeadEventsPanel({ leadId, events }: { leadId: string; events: any[] }) {
  const router = useRouter()
  const [type, setType] = useState<'call' | 'site_visit' | 'meeting'>('call')
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  const schedule = async () => {
    if (!scheduledAt) return toast.error('Selecciona fecha y hora')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, scheduledAt, location }),
      })
      if (!res.ok) throw new Error()
      toast.success('Evento agendado')
      setScheduledAt('')
      setLocation('')
      router.refresh()
    } catch {
      toast.error('No se pudo agendar')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (eventId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success('Actualizado')
      router.refresh()
    } catch {
      toast.error('No se pudo actualizar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border p-4">
        <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded border px-3 py-2 text-sm">
          <option value="call">Llamada</option>
          <option value="site_visit">Visita a obra</option>
          <option value="meeting">Reunión</option>
        </select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Dirección / link / teléfono"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded border px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <Button onClick={schedule} disabled={loading}>Agendar</Button>
      </div>

      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">
                {e.type === 'call' ? 'Llamada' : e.type === 'site_visit' ? 'Visita a obra' : 'Reunión'} —{' '}
                {new Date(e.scheduledAt).toLocaleString()}
              </p>
              {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={e.status === 'completed' ? 'default' : 'secondary'}>{e.status}</Badge>
              {e.status === 'scheduled' && (
                <>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(e.id, 'completed')}>Completar</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(e.id, 'cancelled')}>Cancelar</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Panel de documentos** — implementa dos acciones: "Adjuntar desde Media Library" (abre un picker reusando el componente que ya tienes en `/admin/media`, filtra por imágenes publicadas, y al seleccionar llama a `/api/admin/leads/[id]/documents` con `direction: 'admin_sent'` + `sourceMediaId`) y "Subir nuevo archivo" (usa el flujo de presigned URL existente, luego llama al mismo endpoint con `direction: 'admin_sent'` y sin `sourceMediaId`). Las fotos que el cliente ya mandó en el formulario original (`quote.attachmentUrls`) se muestran aquí también, de solo lectura, con `direction: 'client_upload'`, para no perder ese contexto. *(Código omitido aquí por extensión — sigue el mismo patrón que `LeadEventsPanel`; se construye como subtarea independiente dado que depende del componente de picker del Media Library, que conviene revisar primero.)*

- [ ] **Commit**

```bash
git add app/admin/leads/[id]/page.tsx
git add src/presentation/components/admin/LeadDetailTabs.tsx
git add src/presentation/components/admin/LeadActivityTimeline.tsx
git add src/presentation/components/admin/LeadEventsPanel.tsx
git commit -m "feat: vista de detalle completo del lead con tabs (resumen, actividad, agenda, documentos)"
```

---

### Task 10: Hacer clickeable la card del kanban hacia el detalle

**Files:**
- Modify: `src/presentation/components/admin/LeadsKanban.tsx`

- [ ] **Step 1: Envolver cada `Card` en un `Link` hacia `/admin/leads/[id]`, sin romper el drag-and-drop**

```typescript
// dentro de LeadsKanban.tsx, en el render de cada card:
import Link from 'next/link'

// ...
<Card
  key={lead.id}
  draggable
  onDragStart={(e) => handleDragStart(e, lead.id)}
  className={`transition ${draggedId === lead.id ? 'opacity-50' : ''}`}
>
  <Link href={`/admin/leads/${lead.id}`} className="block cursor-pointer">
    <CardContent className="pt-4 text-sm">
      <p className="font-medium">{lead.quote?.name}</p>
      <p className="text-xs text-muted-foreground">{lead.quote?.service}</p>
      {lead.estimatedValue && (
        <p className="text-xs font-semibold mt-2">${(lead.estimatedValue / 100).toFixed(2)}</p>
      )}
    </CardContent>
  </Link>
</Card>
```

> Nota: el `draggable` queda en el `Card` exterior y el `Link` queda adentro — así el drag-and-drop para mover de columna sigue funcionando y el click corto (sin arrastrar) navega al detalle. Si el navegador detecta conflicto entre drag y click, envolver el contenido del link en un `onClick` que verifique que no hubo `dragstart` reciente (patrón común: flag `wasDragged` reseteado en `onDragEnd`).

- [ ] **Commit**

```bash
git add src/presentation/components/admin/LeadsKanban.tsx
git commit -m "feat: las cards del kanban abren el detalle completo del lead al hacer click"
```

---

### Task 11 (OPCIONAL — decidir antes de ejecutar): Ampliar las etapas del pipeline

**Decisión pendiente con Gustavo:** ¿mantener `prospect → contacted → quoted → won → lost`, o pasar a un pipeline más granular que refleje visitas y negociación?

```typescript
export const leadStageEnum = pgEnum('lead_stage', [
  'prospect',
  'contacted',
  'site_visit_scheduled',
  'quoted',
  'negotiation',
  'won',
  'lost',
])
```

Esto implica: migración del enum (Postgres requiere `ALTER TYPE ... ADD VALUE` o recrear el enum), actualizar `stageConfig` en `LeadsKanban.tsx` (de 5 a 7 columnas), y el mapeo `mapQuoteStatusToLeadStage` en `app/api/admin/quotes/[id]/route.ts`. **No ejecutar esta tarea hasta confirmar** — se deja documentada para no perder la idea, pero las Tareas 1–10 funcionan perfectamente con el enum actual de 5 etapas.

---

## Resumen de impacto

| Problema original | Solución |
|---|---|
| Cards no aparecían por defecto en Prospect | Tarea 1 — Lead se crea junto con el Quote |
| Inbox y Leads separados | Tareas 7–8 — Inbox eliminado, todo vive en `/admin/leads` (kanban + tabla) |
| Sin detalle completo al abrir una card | Tareas 9–10 — página de detalle con tabs, accesible por click |
| Sin agenda de llamadas/visitas | Tarea 5 (ScheduleLeadEventUseCase) + Tarea 9 (LeadEventsPanel) |
| Sin gestión documental/fotográfica bidireccional | Tarea 5 (AttachLeadDocumentUseCase) + Tarea 9 (LeadDocumentsPanel), reusando Media Library |
| Sin tracking de todo lo que pasa en la negociación | Tarea 5 (logging automático) + Tarea 9 (LeadActivityTimeline) |
| Sin filtros por fecha en el pipeline | Tarea 6 (API) + Tarea 8 (UI con presets + rango + Calendar) |

---

**Versión:** 1.0
**Próximo paso:** ejecutar con subagent-driven-development, tarea por tarea, validando build (`pnpm build`) después de cada una.
