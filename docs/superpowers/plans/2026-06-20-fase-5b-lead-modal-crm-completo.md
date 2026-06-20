# Fase 5b — Lead Detail Modal + CRM completo (notas, contactos, eventos tipificados, papelera)

> **For agentic workers:** REQUIRED SUB-SKILL: usar superpowers:subagent-driven-development para implementar este plan tarea por tarea, igual que la Fase 5 original. Cada tarea termina con `npm run build` (no hay test framework en este repo) y un commit propio.

## Context

La Fase 5 (fusión Inbox/Leads + CRM Pipeline) ya está en producción: existen `Lead`/`LeadEvent`/`LeadDocument`/`LeadActivity`, sus repositorios, use cases, rutas API, y una página de detalle `/admin/leads/[id]` con 4 tabs. Durante el uso real se identificaron limitaciones que esta fase resuelve:

- Abrir un lead navega a una página completa en vez de superponerse como modal sobre el Kanban/Tabla.
- La card "Manage" solo permite cambiar `Quote.status` (que sincroniza el stage indirectamente) y tiene una sola nota de texto libre — se necesita control directo del Stage y notas múltiples con CRUD completo.
- Varios textos quedaron en español por el idioma del documento de plan original.
- Las secciones de "Resumen" son cards fijas; se piden como acordeón.
- Los adjuntos del formulario de cotización (bucket privado `contigo-quotes`) no tienen preview ni descarga.
- El agendamiento de llamadas/visitas/reuniones es genérico (un campo de texto libre); se necesita un formulario específico por tipo, con una lista de contactos por lead reutilizable.
- No existe ninguna capacidad de archivar/restaurar (papelera de reciclaje) en ningún recurso de Leads/CRM.

**Decisiones confirmadas con el usuario** (no son negociables al implementar):
- El alcance de "CRUD completo / archivable" es **solo el dominio Leads/CRM** (leads, eventos, documentos, notas, contactos). El CMS existente (projects/services/categories) no se toca.
- La papelera de reciclaje aplica a **leads completos Y a cada sub-recurso** (eventos, documentos, notas, contactos) de forma independiente.
- La card "Manage" pierde el selector de `Quote.status`; el **Stage del pipeline** pasa a ser el único control de pipeline visible ahí.
- El campo único `Lead.adminNotes` se **reemplaza por completo** por la lista de notas nueva (con backfill de su valor actual antes de borrar la columna).
- El cambio de Stage dentro del modal debe reflejarse con **actualización optimista** en el Kanban/Tabla de abajo (sin parpadeo de página completa).
- `app/api/admin/quotes/[id]/route.ts` (PATCH) se **elimina** una vez que `QuoteDetailPanel` deje de usarlo — confirmado por grep que es su único caller.

## Arquitectura — piezas nuevas

Dos agregados nuevos se suman a la familia `Lead`/`LeadEvent`/`LeadDocument`/`LeadActivity` ya existente, siguiendo exactamente el mismo layering (`core/entities` → `core/repositories` interface → `infrastructure/repositories` Drizzle → `application/use-cases` → DTO en `presentation/types` → `app/api` routes → componentes):

- **`LeadNote`** — reemplaza `Lead.adminNotes`, CRUD completo por `leadId`.
- **`LeadContact`** — lista de contactos por lead (name/phone/email/role/isPrimary), referenciado por `contactId` desde `LeadEvent.metadata`.

**Convención nueva: `archivedAt: timestamp | null`** en `leads`, `lead_events`, `lead_documents`, `lead_notes`, `lead_contacts`. Es el primer patrón de soft-delete del repo (el resto del CMS usa flags booleanos `published`/`isActive` filtrados en el repositorio — no hay precedente directo, así que se diseña limpio y autocontenido a este dominio).

**Filtrado de archivados — regla deliberada y asimétrica:**
- **`leads`** (puede haber cientos, se listan en Kanban/Tabla): el repositorio excluye archivados por default (`WHERE archived_at IS NULL`), con flag `includeArchived`/`onlyArchived` para la papelera.
- **Sub-recursos** (eventos/documentos/notas/contactos de UN lead, siempre pocos): el endpoint consolidado de detalle devuelve TODOS (archivados incluidos); el filtro "mostrar archivados" se hace en el cliente. Evita un round-trip extra para un toggle de UI, y el volumen por lead nunca justifica paginación.

**`lead_events.metadata: jsonb`** — sigue el precedente ya existente en `lead_activities.payload` (jsonb para datos "estructurados pero variables por tipo"). Forma (discriminated union, validada con zod en la capa de API, no en la DB — igual que `quote-attachment/route.ts` ya hace):
```typescript
type LeadEventMetadata =
  | { kind: 'call'; contactId: string | null }
  | { kind: 'site_visit'; contactId: string | null; mapsLink: string | null; address: string | null; referencePoint: string | null }
  | { kind: 'meeting'; channel: 'google_meet' | 'zoom' | 'teams' | 'whatsapp' | 'other'; link: string | null }
```
Se guarda `contactId` (referencia), no una copia del nombre/teléfono — como los contactos se archivan (no se borran físicamente), la referencia siempre resuelve.

**Archive/restore se implementa reusando `update()`**, no métodos nuevos en cada repositorio: cada entidad gana `.archive()`/`.restore()` (devuelven una nueva instancia con `archivedAt` seteado/limpio), y el `update()` que ya existe persiste el cambio — mismo patrón que `ChangeLeadStageUseCase` ya usa.

**Rutas de archive/restore como sub-rutas dedicadas** (`.../archive/route.ts`, `.../restore/route.ts`) en vez de sobrecargar PATCH con un campo `action` — consistente con el estilo ya usado en este repo (un archivo de ruta por acción).

## Task Breakdown

### Task 1: Schema — `lead_notes`, `lead_contacts`, `archivedAt`, `metadata` (solo aditivo)

**Files:** Modify `src/infrastructure/db/schema.ts`

- [ ] Agregar enum `leadContactRoleEnum` (`'owner' | 'site_manager' | 'spouse' | 'other'`).
- [ ] Agregar tabla `leadNotes` (id, leadId FK cascade, body text, createdBy FK admin_users set null, createdAt, updatedAt, archivedAt nullable) + índices por `leadId` y `archivedAt`.
- [ ] Agregar tabla `leadContacts` (id, leadId FK cascade, name varchar, phone varchar, email varchar nullable, role enum nullable, isPrimary boolean default false, createdAt, updatedAt, archivedAt nullable) + índices.
- [ ] Agregar `archivedAt: timestamp nullable` a `leads`, `leadEvents`, `leadDocuments`.
- [ ] Agregar `metadata: jsonb` (default `'{}'`) a `leadEvents`.
- [ ] **NO tocar `leads.adminNotes` todavía** — eso es la Task 9 (migración separada, después del backfill).
- [ ] `npx drizzle-kit generate`, revisar que el SQL generado sea 100% aditivo (`CREATE TABLE`/`ALTER TABLE ADD COLUMN`, cero `DROP`), commitear schema.ts + migración + meta. NO correr `db:migrate`/`db:push` contra la DB remota en esta tarea — eso es un paso explícito y supervisado al final (ver Task 9 y la sección de Producción).

### Task 2: Entidades — `LeadNote`, `LeadContact`; extender `LeadEvent`/`Lead`/`LeadDocument`

**Files:**
- Create `src/core/entities/LeadNote.ts`, `src/core/entities/LeadContact.ts`
- Modify `src/core/entities/LeadEvent.ts` (agregar `metadata: LeadEventMetadata`, `archivedAt`, métodos `withMetadata()`, `withDetails({scheduledAt?, durationMinutes?, notes?})` para soportar edición completa, `archive()`, `restore()`)
- Modify `src/core/entities/Lead.ts` y `src/core/entities/LeadDocument.ts` (agregar `archivedAt` + `archive()`/`restore()` — mecánico, mismo patrón en los 3)

Seguir exactamente el patrón ya establecido por `LeadEvent`/`LeadDocument`/`LeadActivity`: constructor privado, `static create()`, `static reconstruct()`, métodos `with*` inmutables.

### Task 3: Repositorios — `ILeadNoteRepository`/`ILeadContactRepository` + extender los 3 existentes

**Files (new):** `src/core/repositories/ILeadNoteRepository.ts`, `ILeadContactRepository.ts`, `src/infrastructure/repositories/DrizzleLeadNoteRepository.ts`, `DrizzleLeadContactRepository.ts`

```typescript
interface ILeadNoteRepository {
  save(note: LeadNote): Promise<void>
  findById(id: string): Promise<LeadNote | null>
  findByLeadId(leadId: string): Promise<LeadNote[]>  // incluye archivadas, filtro es client-side
  update(note: LeadNote): Promise<void>
}
// ILeadContactRepository: misma forma
```

**Files (modify):** `ILeadRepository.ts`/`DrizzleLeadRepository.ts` (agregar `includeArchived`/`onlyArchived` a `findAllFiltered`), `ILeadEventRepository.ts`/`DrizzleLeadEventRepository.ts`, `ILeadDocumentRepository.ts`/`DrizzleLeadDocumentRepository.ts` (sin cambios de filtrado — siempre devuelven todo, igual que hoy; el `update()` que ya existe sirve para persistir `archive()`/`restore()` sin tocar el método).

`DrizzleLeadDocumentRepository` necesita un `update()` nuevo (hoy solo tiene `save`+`findByLeadId`, no existe forma de modificar un documento ya guardado).

### Task 4: Use cases

**New, en `src/application/use-cases/leads/`:**
- `AddLeadNoteUseCase.ts` (crea nota + log de actividad tipo `note`)
- `UpdateLeadNoteUseCase.ts` (edita body, sin log — editar notas no se audita, igual que el resto de ediciones menores)
- `ArchiveLeadNoteUseCase.ts`, `RestoreLeadNoteUseCase.ts`
- `CreateLeadContactUseCase.ts`, `UpdateLeadContactUseCase.ts`, `ArchiveLeadContactUseCase.ts`, `RestoreLeadContactUseCase.ts`
- `UpdateLeadEventUseCase.ts` (edición completa: scheduledAt/durationMinutes/metadata/notes — distinto de `UpdateLeadEventStatusUseCase` que sigue siendo solo para Complete/Cancel)
- `ArchiveLeadEventUseCase.ts`, `RestoreLeadEventUseCase.ts`
- `ArchiveLeadDocumentUseCase.ts`, `RestoreLeadDocumentUseCase.ts`
- `ArchiveLeadUseCase.ts`, `RestoreLeadUseCase.ts` (papelera a nivel de lead completo; **no cascada** — archivar un lead no archiva sus sub-recursos, restaurar lo deja exactamente como estaba)

**Modify:** `ScheduleLeadEventUseCase.ts` — aceptar `metadata: LeadEventMetadata` y `durationMinutes` en el input, pasar a `LeadEvent.create()`; el payload de actividad debe incluir `contactId` cuando esté presente.

Cada use case de archive/restore es un wrapper delgado: cargar entidad → `.archive()`/`.restore()` → `update()` del repo correspondiente. No se necesita logging de actividad para archive/restore de sub-recursos (no sobre-auditar).

### Task 5: DTOs

**New:** `src/presentation/types/LeadNoteDTO.ts`, `LeadContactDTO.ts` (mismo patrón `to*DTO()` que ya existe)

**Modify:** `LeadDTO.ts` (quitar `adminNotes`), `LeadEventDTO.ts` (agregar `metadata`, `archivedAt`), `LeadDocumentDTO.ts` (agregar `archivedAt`)

Recordar: TODA entidad nueva debe pasar por su DTO antes de cruzar el límite server→client (las clases reales rompen producción — ya pasó una vez esta sesión).

### Task 6: API routes

Seguir el patrón ya establecido: instanciación inline (`new Drizzle...Repository()`), `auth()` primero, sin contenedor DI.

- [ ] **6a — Notas:** `app/api/admin/leads/[id]/notes/route.ts` (GET lista, POST crear), `.../notes/[noteId]/route.ts` (PATCH editar body), `.../notes/[noteId]/archive/route.ts`, `.../notes/[noteId]/restore/route.ts`
- [ ] **6b — Contactos:** `app/api/admin/leads/[id]/contacts/route.ts` (GET, POST), `.../contacts/[contactId]/route.ts` (PATCH), `.../contacts/[contactId]/archive/route.ts`, `.../restore/route.ts`
- [ ] **6c — Eventos:** modificar `events/route.ts` (POST acepta `metadata`/`durationMinutes`, validar con zod discriminated union por `type`), `events/[eventId]/route.ts` (PATCH: mantener `{status}` para Complete/Cancel, agregar soporte para `{scheduledAt, durationMinutes, metadata, notes}` como edición completa — un solo handler, dos formas de body), `.../events/[eventId]/archive/route.ts`, `.../restore/route.ts`
- [ ] **6d — Documentos:** `.../documents/[documentId]/archive/route.ts`, `.../restore/route.ts` (no se agrega edición, solo archive/restore, per el alcance pedido)
- [ ] **6e — Lead completo:** `.../leads/[id]/archive/route.ts`, `.../leads/[id]/restore/route.ts`; modificar `app/api/admin/leads/route.ts` para aceptar `?archived=true` (papelera)
- [ ] **6f — Adjuntos (presigned GET):** `app/api/admin/leads/[id]/attachments/route.ts` con `GET ?key=...` (query param, NO segmento de ruta — los keys de R2 contienen `/`). Valida que el `key` pedido efectivamente esté en `quote.attachmentUrls` de ese lead antes de firmar (rechazar 403 si no — evita acceso arbitrario al bucket privado). Usa `generatePresignedGetUrl` (Task 7).
- [ ] **6g — Limpieza:** eliminar `app/api/admin/quotes/[id]/route.ts` (confirmado sin otros callers) una vez que `QuoteDetailPanel` (Task 12) deje de usarlo — hacer este paso DESPUÉS de Task 12b, no antes.
- [ ] Extender el GET consolidado `app/api/admin/leads/[id]/route.ts` para incluir `notes` y `contacts` en la misma respuesta (mismo `Promise.all`).

### Task 7: `R2StorageService.ts` — presigned GET

**Modify:** `src/infrastructure/services/R2StorageService.ts`

```typescript
import { GetObjectCommand } from '@aws-sdk/client-s3' // sumar al import existente

export async function generatePresignedGetUrl(
  bucket: string,
  key: string,
  expiresIn = 300,
): Promise<string> {
  const client = getR2Client()
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn })
}
```
Espejo exacto de `generatePresignedPutUrl` ya existente. `getSignedUrl`/`S3Client` ya están importados, sin dependencia nueva.

### Task 8: Limpieza de `adminNotes` en Kanban/Tabla/list page

**Files:** `LeadsKanban.tsx` (quitar el bloque de preview `{lead.adminNotes && (...)}`), `LeadsTable.tsx` (quitar el campo del tipo de prop), `app/admin/(protected)/leads/page.tsx` (dejar de seleccionar `adminNotes` en el `.map()`)

Mecánico, mismo cambio lógico en 3 archivos — un solo commit.

### Task 9: Migración de datos — backfill de `adminNotes` + drop de columna

**Esta es la tarea más delicada del plan — secuenciar con cuidado.**

- [ ] Generar migración custom: `npx drizzle-kit generate --custom --name backfill_lead_notes`, escribir a mano:
  ```sql
  INSERT INTO lead_notes (id, lead_id, body, created_by, created_at, updated_at)
  SELECT gen_random_uuid(), id, admin_notes, NULL, updated_at, updated_at
  FROM leads
  WHERE admin_notes IS NOT NULL AND admin_notes <> '';
  ```
- [ ] Confirmar (grep) que **ningún código** lee `lead.adminNotes`/`leads.admin_notes` ya (debe ser cierto recién después de Tasks 5, 8 y 12c).
- [ ] Quitar `adminNotes` de `leads` en `schema.ts`, `npx drizzle-kit generate` (produce el `ALTER TABLE ... DROP COLUMN` automáticamente, con timestamp posterior al backfill — el orden del journal importa).
- [ ] **Local/dev:** aplicar ambas migraciones, verificar `SELECT count(*) FROM lead_notes` coincide con los leads que tenían `admin_notes` no nulo antes.
- [ ] **Producción:** NO ejecutar sin supervisión. Mismo proceso que se usó para el bootstrap de migraciones de la Fase 5 original: revisar el SQL generado, confirmar paso a paso con el usuario antes de cada `db:migrate`/escritura, exportar `SELECT id, admin_notes FROM leads WHERE admin_notes IS NOT NULL` como respaldo antes de correr el backfill, verificar conteos después del backfill y ANTES de correr el drop-column (dos confirmaciones separadas, no encadenadas).

### Task 10: Modal de detalle del lead — infraestructura

**New:** `src/presentation/components/admin/LeadDetailModal.tsx` (`'use client'`)

Sigue el patrón ya existente de `MediaPickerModal.tsx` (único precedente de modal full-screen en este admin: `createPortal(..., document.body)`, `fixed inset-0 z-[200]`, cierre con Escape y click fuera).

- Lee `leadId` desde `useSearchParams().get('leadId')` en la página de lista.
- Al aparecer, hace `fetch('/api/admin/leads/' + leadId)` client-side (la ruta consolidada ya existente — no necesita cambios de backend más allá de Task 6's extensión con notes/contacts).
- Renderiza `LeadDetailTabs` dentro del portal una vez cargan los datos; spinner antes.
- Cerrar (botón X, Escape, o click en el backdrop) quita `leadId` de la URL preservando `view`/`from`/`to` (mismo patrón de `URLSearchParams` que ya usa `LeadsFilterBar.tsx`).

**Modify:** `app/admin/(protected)/leads/page.tsx` (montar `<LeadDetailModal />` una vez, siempre presente, no-op si no hay `leadId`)

**Modify:** `LeadsKanban.tsx`/`LeadsTable.tsx` — el `<Link href="/admin/leads/${lead.id}">` pasa a apuntar a `/admin/leads?{params existentes}&leadId={lead.id}` en vez de a la página de detalle. El `draggable`/`onDragStart` de la card del Kanban (Task 10 de la Fase 5 original) queda intacto — solo cambia el destino del `href` interno.

**Para la actualización optimista del Stage (decisión confirmada):** `LeadDetailModal` recibe (o expone vía contexto/callback) una función `onLeadStageChanged(leadId, newStage)` que la página de lista pasa hacia abajo hasta `LeadsKanban`/`LeadsTable`, permitiendo mover la card de columna sin re-fetch — mismo mecanismo que el Kanban ya usa internamente para el drag-and-drop optimista (`setLeads` local con rollback en error).

**La página standalone `app/admin/(protected)/leads/[id]/page.tsx` se mantiene sin cambios** — sigue funcionando para links directos/refresh/compartir.

### Task 11: `LeadDetailTabs.tsx` — labels en inglés + wiring de notes/contacts

**Modify:** `src/presentation/components/admin/LeadDetailTabs.tsx`

- Tabs: `Resumen`→`Summary`, `Actividad`→`Activity`, `Llamadas & Visitas`→`Calls & Visits`, `Documentos`→`Documents` (cambiar también los `value` internos del Tabs a inglés: `resumen`→`summary`, etc. — son identificadores internos, no estado de URL, seguro renombrarlos).
- Recibe `notes`/`contacts` como props nuevas (vienen del fetch consolidado extendido en Task 6).
- Levanta `contacts` a estado local (`useState`) en este componente — es el ancestro común entre la sección de Contactos (Task 13, dentro de Resumen) y el formulario de eventos (Task 14, dentro de Calls & Visits). Pasar `contacts`/`setContacts` a ambos como props. Esto resuelve el requisito explícito de "un contacto recién creado debe aparecer inmediatamente seleccionable" sin necesitar `router.refresh()` ni un store global.

### Task 12: `QuoteDetailPanel.tsx` — Acordeón + Stage + Notas CRUD + Adjuntos con preview

Dividir en sub-tareas, son 3 features independientes que comparten archivo:

- [ ] **12a — Acordeón:** envolver las 4 secciones (Contact Information, Quote Details, Attachments, Manage) en `Accordion type="multiple"` con las 4 abiertas por default (preserva el comportamiento actual de "todo visible", el acordeón es para poder colapsar a demanda). Portar el estilo visual actual (bordes crema, header con fuente Cormorant) a `className` en `AccordionItem`/`AccordionTrigger` ya que el estilo default de shadcn es mínimo.
- [ ] **12b — Stage select:** quitar el `<Select>` de `Quote.status`. Agregar `<Select>` de `LeadStage` (prospect/contacted/quoted/won/lost), PATCH a `/api/admin/leads/[id]` (ruta existente, sin cambios de backend). Requiere nuevas props `leadId`, `initialStage`, `onStageChange` (para la actualización optimista de Task 10). Mostrar `Quote.status` como badge de solo lectura dentro de "Quote Details" para no perder esa información histórica (ya no editable desde aquí).
- [ ] **12c — Notas CRUD:** nuevo componente `src/presentation/components/admin/LeadNotesPanel.tsx`, renderizado dentro del accordion item "Manage" (no como sección nueva — el pedido original lo enmarca como parte de Manage). Crear/editar inline/eliminar (archive) cada nota. Reemplaza por completo el `<Textarea>` único actual.
- [ ] **12d — Adjuntos con preview/descarga:** nuevo componente `src/presentation/components/admin/QuoteAttachmentsGrid.tsx` (reutilizable también en Task 16): para cada key en `quote.attachmentUrls`, pedir una URL firmada (`GET /api/admin/leads/[id]/attachments?key=...`), mostrar thumbnail (`<img>` si es imagen, ícono genérico si no), click abre `AttachmentLightbox.tsx` (nuevo, adaptado de `MediaDetailsModal.tsx` pero recortado — sin metadata de Media Library) con vista completa + botón de descarga (`<a download>`). Botón de descarga también visible directo en cada thumbnail. Extraer la heurística de tipo de archivo por extensión a `src/presentation/lib/inferMediaType.ts` (compartido con la lógica ya existente en `R2StorageService`, para que no diverjan).

### Task 13: Contactos — panel en Resumen + estado compartido

**New:** `src/presentation/components/admin/LeadContactsPanel.tsx`, dentro de un accordion item "Contact Information" (reemplaza la vista actual de un solo contacto fijo — el contacto original de la cotización se sigue mostrando, pero ahora como el primer registro real de `lead_contacts`, sembrado en `CreateLeadForQuoteUseCase` al nacer el lead, marcado `isPrimary: true`, no como un caso especial de UI).

Lista de contactos (nombre/teléfono/email/badge de rol) con "Agregar contacto" inline y acciones de editar/archivar por contacto. Usa el estado levantado en `LeadDetailTabs` (Task 11) — toda mutación llama `setContacts` localmente, sin `router.refresh()`.

### Task 14: `LeadEventsPanel.tsx` — reescritura completa (tipificación + contactos)

Reescritura, no parche incremental. Sub-componentes:

- [ ] **14a — `ContactPickerOrCreate.tsx`** (new): `<Select>` poblado desde `contacts` (filtrado a no-archivados) + opción "+ Nuevo contacto" que despliega un mini-formulario inline (nombre/teléfono/email/rol). Al guardar: `POST /api/admin/leads/[id]/contacts`, `onContactsChange([...contacts, nuevo])`, auto-selecciona el nuevo contacto.
- [ ] **14b — `LeadEventForm.tsx`** (new): formulario único para crear y editar (mismo componente, distinto submit target), con ramas por `type`:
  - `call`: `ContactPickerOrCreate` + notas
  - `site_visit`: link de Google Maps + dirección + punto de referencia + `ContactPickerOrCreate` + notas
  - `meeting`: selector de canal — exactamente Google Meet / Zoom / Microsoft Teams / WhatsApp video call / Other — + link + notas
  - Común a todos: tipo, fecha/hora, duración.
- [ ] **14c — `LeadEventsPanel.tsx`** (rewrite): lista de eventos con acciones editar/archivar/restaurar + toggle "mostrar archivados" (filtro client-side sobre el array ya recibido completo, sin re-fetch). Botón "Agendar nuevo evento" abre `LeadEventForm`. Todo el texto en inglés.

### Task 15: `LeadActivityTimeline.tsx` — traducción al inglés

**Modify:** traducir el record `LABELS` y el estado vacío (`"Sin actividad registrada todavía."` → `"No activity recorded yet."`). Puramente mecánico, cero riesgo de comportamiento — commit propio.

### Task 16: `LeadDocumentsPanel.tsx` — archivar/restaurar + inglés + reusar grid de adjuntos

**Modify:**
- Traducir todo el texto restante en español (`Subir nuevo archivo`→`Upload new file`, `DIRECTION_LABELS`/`CATEGORY_LABELS`, estados vacíos, toasts).
- Agregar botón de archivar por documento + toggle "mostrar archivados" (mismo patrón client-side de Task 14) + botón de restaurar cuando se ven archivados.
- Reemplazar el bloque "Adjuntos originales del cliente" (lista de keys en texto plano) por el mismo `QuoteAttachmentsGrid` de Task 12d, para no dejar una segunda lista sin preview/descarga inconsistente con la de Resumen.

### Task 17: Papelera de reciclaje — leads completos

**New:** `src/presentation/components/admin/LeadsTrashView.tsx` — lista de leads archivados (reusa estilo de `LeadsTable`) con botón "Restore" por fila.

**Modify:**
- `app/admin/(protected)/leads/page.tsx`: aceptar `?trash=1`, fetch de leads archivados, renderizar `LeadsTrashView` en vez de Kanban/Tabla.
- `LeadsViewToggle.tsx` (o un nuevo `LeadsTrashToggle.tsx`): agregar botón "Trash" que setea `?trash=1` y limpia `?view`.
- `ILeadRepository.findAllFiltered`/`DrizzleLeadRepository`: extender filtro con `includeArchived`/`onlyArchived`.
- Agregar botón "Move to Trash" dentro del accordion "Manage" del modal (junto al Stage select de Task 12b), que llama `POST /api/admin/leads/[id]/archive` y cierra el modal + refresca la lista.

### Task 18: Barrido final de español + build

- [ ] `grep` de caracteres acentuados (`áéíóúñ` mayúsc/minúsc) en todos los `Lead*.tsx`/`QuoteDetailPanel.tsx`/rutas API nuevas — verificar cada resultado a mano (puede haber falsos positivos en comentarios).
- [ ] `npm run build` final — único estándar de verificación de este repo (no hay test framework). Confirmar cero errores de tipo tras los ~30 archivos nuevos/modificados.

## Orden de ejecución sugerido

```
1 (schema aditivo) → 2 (entidades) → 3 (repos) → 4 (use cases) → 5 (DTOs) → 6 (rutas API) → 7 (R2 GET, en paralelo con 6f)
8 (limpieza adminNotes en UI) — después de 5, antes de 9
9 (backfill + drop column) — AL FINAL, después de 8 y 12c, con grep de verificación antes del drop
10 (modal) — independiente, sin dependencia de backend, se puede empezar en paralelo con 1-7
11 (tabs inglés + wiring) — depende de 6
12a (acordeón) — independiente
12b (stage select) — independiente (ruta ya existe)
12c (notas CRUD) — depende de 4, 5, 6a
12d (adjuntos preview) — depende de 6f, 7
13 (contactos) — depende de 4, 5, 6b, 11
14 (eventos tipificados) — depende de 13, 6c
15 (timeline inglés) — independiente
16 (documentos archivar + inglés) — depende de 6d, reusa 12d
17 (papelera) — depende de 6e
18 (barrido final + build) — al final de todo
6g (borrar ruta quotes) — después de 12b, antes de 18
```

## Verificación end-to-end

No hay test framework en este repo — `npm run build` después de cada tarea es el único estándar, igual que en la Fase 5 original. Para verificación funcional real:
- Local: usar `npm run dev` + las queries SQL directas contra la DB de `.env.local` para confirmar conteos de filas tras cada migración (mismo enfoque que se usó para verificar el bootstrap de migraciones de la Fase 5).
- Antes de tocar producción: TODAS las migraciones (Task 1 y Task 9) se generan y revisan localmente primero; la aplicación a la base remota requiere confirmación explícita paso a paso del usuario — nunca un `db:migrate`/`db:push` desatendido contra la DB de producción.
- Revisión de código: igual que la Fase 5 original, cada tarea pasa por un review de spec compliance + calidad antes de marcarse completa; al final, una revisión de todo el branch antes de mergear a `main`.
