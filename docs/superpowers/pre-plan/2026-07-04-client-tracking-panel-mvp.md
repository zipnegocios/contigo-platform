# Orden de trabajo — Client Tracking Panel (MVP informativo)

**Fecha:** 2026-07-04
**Rama base:** `main` (verificar con `git branch --show-current` antes de empezar — NO trabajar sobre `alpha`)
**Objetivo:** Evolucionar `/quote-status/[token]` de página estática de estado a un micro-panel informativo para el cliente: estado del proyecto con vocabulario de cara al cliente, presupuestos y facturas descargables, agenda de llamadas/visitas (solo lectura), y una caja de mensajes bidireccional con notificaciones (campana + email) en ambos lados.

**Decisiones ya tomadas (no re-abrir):**
1. Sin cuentas de usuario, sin auth, sin Google login. El `trackingToken` UUID es el único identificador (capability URL). Las cuentas de cliente quedan como evolución futura documentada, fuera de este alcance.
2. Las facturas se generan en Xero y se suben manualmente como PDF — `invoice` es una categoría de documento, NO un módulo de facturación.
3. Notificaciones de mensajes sin leer: campana en el panel del cliente, campana + badge en kanban/sidebar del admin, y emails de notificación cruzados vía Resend para ambos lados (email sin el contenido del mensaje — solo aviso + link, para centralizar la conversación en el panel).
4. Sin reagendamiento de eventos en este MVP — si el cliente quiere cambiar una cita, lo pide por la caja de mensajes.
5. El panel muestra SOLO documentos con `direction = 'admin_sent'`. Nunca `internal`. Los `client_upload` (adjuntos originales del quote) pueden mostrarse como "Your attachments" de solo lectura.

---

## Fase A — Auditoría previa (OBLIGATORIA antes de escribir código)

No asumir nada. Confirmar con evidencia y reportar hallazgos antes de continuar:

- [ ] **A.1 — Fuente de verdad del estado.** La página actual `app/quote-status/[token]/page.tsx` renderiza el timeline desde `quote.status`. Según la Fase 5b (Task 12b), el `<Select>` de `Quote.status` fue removido del `QuoteDetailPanel` y reemplazado por el selector de `LeadStage`/`stageId`. **Verificar si `quote.status` sigue siendo actualizado por algún flujo activo** (buscar escrituras a `quotes.status` en `app/api/**` y use cases). Si quedó congelado, el panel DEBE leer el pipeline stage del lead asociado (`leads.stageId` → `pipeline_stages`), no `quote.status`. Reportar el hallazgo con las rutas de archivo exactas.
- [ ] **A.2 — Relación quote → lead.** Confirmar cómo resolver el lead desde el token: `quotes.trackingToken` → `quote.id` → `leads.quoteId`. Verificar en `DrizzleLeadRepository` si existe `findByQuoteId` o equivalente; si no, anotar que hay que crearlo.
- [ ] **A.3 — Flujo de presigned GET existente.** Localizar el endpoint admin que firma URLs de lectura sobre `contigo-quotes` (referenciado en Fase 5b Task 12d como `GET /api/admin/leads/[id]/attachments?key=...`) y el servicio R2 subyacente (`R2StorageService` o similar). El endpoint público del panel reutilizará el mismo servicio de firmado — confirmar nombre y firma del método.
- [ ] **A.4 — Estado real de `ResendEmailService`.** Confirmar en `src/infrastructure/services/ResendEmailService.ts`: (a) `sendAdminNotification` usa `from: 'noreply@contigo-constructions.com.au'` (dominio CON guión — incorrecto), (b) ningún método lee `process.env.RESEND_FROM_EMAIL`. Confirmar también qué interfaz expone `IEmailService`.
- [ ] **A.5 — Layout del admin.** Identificar el componente del sidebar del admin (para la campana global) y confirmar la estructura actual de las cards en `LeadsKanban.tsx` y filas en `LeadsTable.tsx` (para el badge por lead).
- [ ] **A.6 — Enum de categorías de documento.** Confirmar valores actuales de `lead_document_category` en `schema.ts` y en `src/core/entities/LeadDocument.ts` (se espera: `reference_photo`, `site_photo`, `quote_pdf`, `contract`, `other`).

**Entregable de la fase:** reporte corto de hallazgos en el chat (no archivo) con decisión confirmada de A.1 antes de tocar la Fase 1.

---

## Fase 0 — Activación de Resend

### Task 0.1 — Infraestructura (manual, la ejecuta Gustavo — documentar como checklist)

- [ ] Resend dashboard → Domains → Add `contigoconstructions.com.au`.
- [ ] Agregar en Cloudflare DNS los registros SPF/DKIM/DMARC que Resend indique (los TXT/CNAME de verificación en modo **DNS only**, no proxied).
- [ ] Crear API key de producción (permiso: sending only).
- [ ] Setear en EasyPanel: `RESEND_API_KEY`, `RESEND_FROM_EMAIL=noreply@contigoconstructions.com.au`.
- [ ] Verificar estado "Verified" del dominio en Resend antes de deployar la Fase 2.

### Task 0.2 — Fix del servicio de email

**Files:** Modify `src/infrastructure/services/ResendEmailService.ts`

- [ ] Agregar helper privado `getFromAddress()` que lea `process.env.RESEND_FROM_EMAIL` con fallback explícito a `noreply@contigoconstructions.com.au` (SIN guión).
- [ ] Reemplazar ambos `from:` hardcodeados (incluido el dominio con guión en `sendAdminNotification`) por el helper.
- [ ] `pnpm build`.
- [ ] **Commit:** `fix: read RESEND_FROM_EMAIL from env and correct hyphenated sender domain`

---

## Fase 1 — Panel read-only

### Task 1.1 — Migración: categoría `invoice`

**Files:** Modify `src/infrastructure/db/schema.ts`, `src/core/entities/LeadDocument.ts`

- [ ] Agregar `'invoice'` al enum `lead_document_category` en schema y al union type de la entidad.
- [ ] `npx drizzle-kit generate` — la migración debe ser SOLO `ALTER TYPE ... ADD VALUE 'invoice'` (aditiva). Revisar el SQL generado antes de aplicar.
- [ ] Agregar el label `invoice: 'Invoice'` en `CATEGORY_LABELS` de `LeadDocumentsPanel.tsx` para que el admin pueda categorizar los PDFs de Xero al subirlos.
- [ ] `pnpm build`. **Commit.**

### Task 1.2 — Data layer del panel público

**Files:**
- Create: `src/application/use-cases/portal/GetTrackingPanelDataUseCase.ts`
- Modify (si A.2 lo requiere): `src/core/repositories/ILeadRepository.ts`, `DrizzleLeadRepository.ts` (agregar `findByQuoteId`)

El use case recibe el token y devuelve un DTO único con todo lo que el panel renderiza:

```typescript
interface TrackingPanelDTO {
  quote: { name, service, message, createdAt, attachmentUrls }
  clientStage: { key, label, description } // mapeado, ver Task 1.3
  documents: Array<{ id, fileName, category, createdAt }> // SOLO direction='admin_sent', sin archivedAt
  events: Array<{ id, type, scheduledAt, durationMinutes, location }> // status != 'cancelled'
  messages: Array<{ id, authorType, body, createdAt }> // Fase 2; devolver [] hasta entonces
  unreadStaffMessages: number // Fase 2
}
```

Reglas duras:
- [ ] NUNCA incluir en el DTO: `fileKey`, notas internas, `estimatedValue`, datos de `adminUsers`, documentos `internal`, eventos `cancelled`.
- [ ] Si el token no existe → `null` → la página hace `notFound()` (comportamiento actual).
- [ ] `pnpm build`. **Commit.**

### Task 1.3 — Mapeo de estados de cara al cliente

**Files:** Create `src/presentation/lib/clientStageLabels.ts`

Mapeo estático por `pipeline_stages.key` (NO tocar la tabla `pipeline_stages` en este MVP):

```typescript
export const CLIENT_STAGE_LABELS: Record<string, { label: string; description: string }> = {
  prospect:  { label: 'Request Received', description: "We've received your request and our team is reviewing the details." },
  contacted: { label: 'In Review',        description: 'Our team is assessing your project and may reach out with questions.' },
  quoted:    { label: 'Quote Ready',      description: 'Your quote is ready — you can view it in the documents section below.' },
  won:       { label: 'Project Confirmed', description: "Your project is confirmed. We'll keep you updated here." },
  lost:      { label: 'Closed',           description: 'This request has been closed. Feel free to contact us anytime.' },
}
export const CLIENT_STAGE_FALLBACK = { label: 'In Progress', description: 'Your project is moving forward.' }
```

- [ ] Fallback obligatorio: los stages son data-driven y el admin puede crear stages nuevos — un key desconocido NUNCA debe romper el panel ni filtrar el label interno.
- [ ] El timeline de progreso de la página se reconstruye sobre el orden de `pipeline_stages.position` (excluyendo el stage con `terminalKind='lost'` del camino "feliz").
- [ ] **Commit.**

### Task 1.4 — Endpoint público de descarga de documentos

**Files:** Create `app/api/quote-status/[token]/documents/[documentId]/route.ts`

- [ ] GET: resolver token → quote → lead; buscar el documento por id; validar `document.leadId === lead.id` Y `direction === 'admin_sent'` Y `archivedAt IS NULL`. Si cualquier condición falla → 404 (no 403 — no revelar existencia).
- [ ] Devolver `{ url }` con presigned GET de expiración corta (5 min) usando el servicio confirmado en A.3.
- [ ] Los adjuntos originales del cliente (`quote.attachmentUrls`) se sirven por el mismo endpoint con un parámetro alternativo o endpoint hermano, validando que el key pertenece al array del quote — mismo principio de scoping.
- [ ] `pnpm build`. **Commit.**

### Task 1.5 — UI del panel

**Files:** Modify `app/quote-status/[token]/page.tsx` + componentes nuevos en `src/presentation/components/portal/`:
- `TrackingStatusCard.tsx` (client stage + timeline)
- `TrackingDocumentsList.tsx` (agrupado: Quotes / Invoices / Other; click → fetch presigned → abrir en tab nueva)
- `TrackingScheduleList.tsx` (próximos y pasados; tipo, fecha en `en-AU` con TZ `Australia/Adelaide`, duración, ubicación)

- [ ] `export const metadata = { robots: { index: false, follow: false } }` en la página — las URLs con token NUNCA deben indexarse.
- [ ] Server Component para el fetch inicial (mismo patrón actual de la página).
- [ ] Estilo: tokens del design system existentes (ivory `#FAF6F0` / dark `#1E1A16` / gold), consistente con la página actual. Sin dependencias nuevas.
- [ ] Estados vacíos amables ("No documents yet — we'll notify you by email when your quote is ready.").
- [ ] `pnpm build`. **Commit.**

---

## Fase 2 — Mensajes + notificaciones

### Task 2.1 — Schema `lead_messages`

**Files:** Modify `src/infrastructure/db/schema.ts`

```typescript
export const leadMessageAuthorEnum = pgEnum('lead_message_author', ['client', 'staff'])

export const leadMessages = pgTable('lead_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  authorType: leadMessageAuthorEnum('author_type').notNull(),
  authorId: uuid('author_id').references(() => adminUsers.id, { onDelete: 'set null' }), // null cuando client
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp('read_at', { withTimezone: true }), // leído por la contraparte
}, (t) => [
  index('idx_lead_messages_lead_id').on(t.leadId),
  index('idx_lead_messages_unread').on(t.leadId, t.authorType, t.readAt),
])
```

Semántica de `readAt`: como solo hay dos partes, un único campo alcanza — un mensaje `client` se marca leído cuando el staff abre la conversación, y viceversa.

- [ ] Entidad `LeadMessage` + `ILeadMessageRepository` + `DrizzleLeadMessageRepository` (mismo patrón constructor privado + `create()`/`reconstruct()` que `LeadNote`).
- [ ] Repo: `save`, `findByLeadId`, `countUnread(leadId, authorType)`, `countUnreadGroupedByLead(authorType)` (para el badge del kanban en una sola query), `markAsRead(leadId, authorType)`.
- [ ] Migración aditiva, `npx drizzle-kit generate`, revisar SQL. `pnpm build`. **Commit.**

### Task 2.2 — Use cases + emails

**Files:**
- Create: `src/application/use-cases/portal/PostClientMessageUseCase.ts`, `src/application/use-cases/leads/PostStaffMessageUseCase.ts`
- Modify: `src/core/services/IEmailService.ts`, `src/infrastructure/services/ResendEmailService.ts`

- [ ] `PostClientMessageUseCase`: valida (body 1–2000 chars, trim, no vacío), persiste con `authorType: 'client'`, loguea en `lead_activities` (`type: 'message_received'` o el patrón que exista), y dispara `sendNewMessageNotificationToAdmin(lead, quote)`.
- [ ] `PostStaffMessageUseCase`: persiste con `authorType: 'staff'` + `authorId`, loguea actividad, dispara `sendNewMessageNotificationToClient(quote)`.
- [ ] Templates Resend nuevos (mismo estilo visual de los existentes — colores hardcodeados permitidos, excepción Bucket 3):
  - **Al admin:** asunto `[New Message] {service} — {name}`, cuerpo con aviso + botón a `{siteUrl}/admin/leads/{leadId}` (o `/admin/leads?leadId=...` según A.5). Destinatario: `ADMIN_EMAIL`.
  - **Al cliente:** asunto `New message about your {service} project`, aviso SIN el contenido del mensaje + botón a `{siteUrl}/quote-status/{trackingToken}`.
- [ ] Manejo de errores: si Resend falla, el mensaje YA quedó persistido — loguear el error, no romper la request (mismo criterio que el flujo de quotes).
- [ ] `pnpm build`. **Commit.**

### Task 2.3 — Endpoints

**Files (create):**
- `app/api/quote-status/[token]/messages/route.ts` — GET (lista) / POST (crear, Zod). El GET marca `markAsRead(leadId, 'staff')` (el cliente está viendo los mensajes del staff).
- `app/api/quote-status/[token]/messages/unread-count/route.ts` — GET liviano `{ count }` para la campana del cliente (NO marca leído).
- `app/api/admin/leads/[id]/messages/route.ts` — GET/POST con `auth()` + `hasPermission('leads.edit')` (o el scope que exista para leads — confirmar en A.5). El GET marca `markAsRead(leadId, 'client')`.
- `app/api/admin/messages/unread/route.ts` — GET `{ total, byLead: Record<leadId, count> }` usando `countUnreadGroupedByLead('client')`.

- [ ] Todos los endpoints públicos: resolver token→lead y scope estricto; token inexistente → 404.
- [ ] `pnpm build`. **Commit.**

### Task 2.4 — UI cliente: caja de mensajes + campana

**Files:** Create `src/presentation/components/portal/TrackingMessages.tsx`, `src/presentation/components/portal/TrackingBell.tsx`; Modify la página del panel.

- [ ] `TrackingMessages` (`'use client'`): hilo cronológico (burbujas diferenciadas client/staff, timestamp `en-AU`), textarea + botón Send, optimistic append con rollback en error, toast de confirmación.
- [ ] `TrackingBell`: campana en el header del panel; count inicial server-side desde el DTO; polling suave al endpoint `unread-count` cada 60s (`setInterval` con cleanup); al hacer scroll/click a la sección de mensajes, el GET de mensajes ya marca leído → refrescar el count.
- [ ] `pnpm build`. **Commit.**

### Task 2.5 — UI admin: tab Messages + campana sidebar + badge kanban

**Files:**
- Create: `src/presentation/components/admin/LeadMessagesPanel.tsx`, `src/presentation/components/admin/AdminMessagesBell.tsx`
- Modify: `src/presentation/components/admin/LeadDetailTabs.tsx` (sexta tab `Messages (n)`), `LeadsKanban.tsx` + `LeadsTable.tsx` (badge de no-leídos por lead), el layout/sidebar del admin identificado en A.5.

- [ ] `LeadMessagesPanel`: mismo patrón visual que `LeadEventsPanel`; hilo + respuesta; al montarse dispara el GET que marca leído.
- [ ] `AdminMessagesBell`: en el sidebar; fetch a `/api/admin/messages/unread` con polling 60s; dropdown opcional con los leads con no-leídos (link directo al detalle) — si el dropdown complica, MVP = solo el contador con link a `/admin/leads`.
- [ ] Badge kanban/tabla: puntito/contador gold en la card cuando `byLead[lead.id] > 0`. El fetch del mapa de no-leídos se hace UNA vez a nivel página (server-side o en el componente contenedor), no por card.
- [ ] `pnpm build`. **Commit.**

### Task 2.6 — Rate limiting (infra, manual — Gustavo)

- [ ] Cloudflare → Security → Rate Limiting Rule: `/api/quote-status/*` métodos POST, umbral sugerido 10 req/min por IP, acción Block 1 min. Documentar la regla creada.

---

## Verificación E2E final

- [ ] Submit de quote real en staging/local → email de confirmación llega con el link correcto (dominio sin guión, from = env var).
- [ ] Panel: stage label correcto según pipeline stage del lead (mover la card en el kanban y refrescar el panel).
- [ ] Subir PDF categoría `invoice` como `admin_sent` → aparece en el panel → descarga vía presigned funciona → un documento `internal` NO aparece.
- [ ] Cliente envía mensaje → email al admin + badge en kanban + campana sidebar. Admin responde → email al cliente + campana del panel. Abrir cada lado limpia su contador.
- [ ] Token inventado → 404. `curl -I` de la página → meta robots noindex presente.
- [ ] `pnpm build` limpio.

## Reporte de cambios (obligatorio al cierre)

Archivo `docs/superpowers/reports/2026-07-XX-client-tracking-panel-report.md` con: hallazgos de la Fase A (especialmente A.1), lista de archivos creados/modificados, SQL de migraciones aplicadas, decisiones tomadas durante la implementación y cualquier desviación de esta orden con su justificación.

## Fuera de alcance (roadmap futuro, NO implementar)

Cuentas de cliente (password/Google), reagendamiento de eventos, aceptación/rechazo de presupuestos desde el panel, notificaciones push/websockets (el polling de 60s es deliberado), módulo de facturación (Xero queda externo).
