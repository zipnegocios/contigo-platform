# Expansión CRM de Leads — Fase 6 (Detail fixes, Pipeline configurable, Tasks, Leads Management)

> **For agentic workers:** REQUIRED SUB-SKILL: usar superpowers:subagent-driven-development para implementar este plan tarea por tarea (mismo patrón que Fase 5/5b). Cada tarea termina con `npm run build` (no hay test framework en este repo) y queda **sin commit** — el usuario revisa el working tree antes de confirmar. Migraciones: `npx drizzle-kit generate` siempre; **NO correr `db:push`/`db:migrate` contra la base remota sin aprobación explícita** (ver regla en cada tarea de esquema).

## Reglas de operación (heredadas de la orden de trabajo)

1. Todo código/UI/identificadores/columnas/enums en **inglés**. Este documento queda en español (idioma de trabajo con el usuario), igual que los planes anteriores del repo.
2. Clean Architecture estricta: dominio → aplicación → infraestructura → presentación. Repositorios como único acceso a BD.
3. Migraciones obligatorias tras cualquier cambio de esquema (`drizzle-kit generate`), pero la aplicación contra la BD remota requiere luz verde explícita del usuario en cada tarea de esquema.
4. **No `git commit` ni `git push`.** No es necesario `git add`.
5. Las fases 2 y 4 (y partes de la 3) están **bloqueadas** por las preguntas abiertas del §8 original — ver sección "Preguntas abiertas" al final. No se programan en detalle hasta tener respuesta.

---

## Auditoría — hallazgos reales vs. supuestos de la orden de trabajo

Esto corrige/confirma lo que la orden de trabajo asumía, con rutas reales verificadas en el repo:

| # | Supuesto de la orden | Hallazgo real | Impacto en el plan |
|---|---|---|---|
| 1 | Email/phone no se mapean en Contact Information | `QuoteDetailPanel.tsx:125-126` SÍ renderiza `quote.email`/`quote.phone` desde el DTO correctamente (solo un `.toString()` redundante sobre un string, inofensivo). **No se reprodujo el bug estáticamente.** | Task 1 se redefine como "reproducir en vivo + corregir si aparece" en lugar de "corregir mapeo conocido". Ver Task 1.1. |
| 3 | Dropdown de Role es fijo | Confirmado: `LeadContactsPanel.tsx:23-28,138-142` usa enum hardcodeado `lead_contact_role` (`owner/site_manager/spouse/other`), respaldado por `leadContactRoleEnum` en schema. | Hay que migrar de enum Postgres a tabla `lead_contact_roles` para soportar "crear nuevo". |
| 4 | El stage no se puede cambiar desde Summary/Manage | **Falso como código estático**: `QuoteDetailPanel.tsx:217-235` ya tiene un `<Select>` de stage funcional, conectado a `ChangeLeadStageUseCase` vía PATCH. Kanban también actualiza stage por drag-and-drop. | Esto ya está resuelto en el código. Task 4 se redefine como verificación en vivo (¿está roto en producción por el bug de Fase 0, o es un falso reporte?) — no reimplementar lo que ya existe. |
| 5 | Solo existe "Move to trash", falta Archive | El mecanismo único existente (`leads.archivedAt` + `ArchiveLeadUseCase`/`RestoreLeadUseCase`) **ya se llama "archive" en el código pero se expone en la UI como "Move to trash"** — es una sola dimensión, no dos. | Hay que **añadir una segunda dimensión** de verdad: pasar de un solo flag a un `status` de 3 valores (`active / archived / trashed`) o a dos timestamps independientes (`archivedAt` + `trashedAt`). Ver Task 5. |
| 6 | "Schedule new event" no tipifica eventos | Confirmado tipado ya existe: `lead_events.type` enum (`call/site_visit/meeting`) — pero la orden pide agregar `follow_up` y mejorar el flujo. Falta verificar el botón en vivo. | Task 6 ajustada: agregar `follow_up` al enum + verificar/arreglar el flujo del botón. |
| Quotes form | "columnas tipadas + jsonb" es propuesta nueva | Confirmado: `quotes` NO tiene columna `formData jsonb` hoy; columnas son fijas (`name,email,phone,service,message,attachmentUrls`). | Fase 4.2 requiere migración aditiva nueva — bloqueada por §8 Q2. |
| RBAC | "falta desde cero" | Confirmado: `adminRoleEnum` (`owner/staff`) existe en `admin_users.role` y se guarda en el JWT, pero **no se chequea en ningún lado** (cero route guards, cero UI condicional). | Fase 4.1 construye permisos desde cero; el enum de 2 roles puede quedar o reemplazarse por el sistema granular — ver §8 Q3. |
| Media Library | "localízalo" | Maduro y completo: `MediaPickerModal.tsx`, tablas `mediaFolders/mediaTags/mediaMetadata`, `R2StorageService` con presigned PUT/GET. Reutilizable 1:1 para adjuntos de Tasks. | Task 3 (Fase 3) reutiliza este picker sin cambios de infraestructura. |
| Attachments pattern | — | El patrón a clonar para Tasks es `app/api/admin/leads/[id]/attachments/route.ts`: auth → ownership check → presigned GET de 300s contra bucket privado `contigo-quotes`. | Task 2 (Fase 3) sigue este patrón exacto para `task_attachments`. |

---

## Fase 0 — Diagnóstico de producción (prefetch falla en /admin/media, /admin/services, /admin/settings)

**Hallazgo de la auditoría (sin acceso a logs/env de producción — hipótesis con evidencia, no confirmación):**

- `/admin/media` renderiza un client component (`MediaLibrary`) que en `useEffect` llama a `GET /api/admin/media`. Esa ruta invoca `R2StorageService.listObjects()` → `getR2Client()`, que **throwea explícitamente** si falta `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` o `R2_SECRET_ACCESS_KEY` (`src/infrastructure/services/R2StorageService.ts:25-31`). El throw se captura en el route handler y devuelve 500, pero si ocurre durante el RSC prefetch (no en el fetch del cliente), Next.js lo reporta como "failed to fetch" en la navegación.
- `/admin/services` hace `await serviceRepo.findAll(100)` server-side directo en el render — si `DATABASE_URL` no está disponible en el entorno de prefetch (o el cliente Postgres usa un stub, ver `src/infrastructure/db/client.ts:11-16`), el query revienta sin manejo de error.
- `/admin/settings` es 100% client component — si falla, es porque el layout compartido `app/admin/(protected)/layout.tsx` revienta en su `await auth()`, lo cual debería afectar a TODAS las rutas protegidas por igual. Esto es inconsistente con que `/admin/leads` y `/admin/projects` carguen bien, así que la causa de `/admin/settings` probablemente NO es el layout — requiere inspección directa del componente cliente y sus llamadas a API internas (no auditado en profundidad, ver Task 0.3).

### Task 0.1 — Confirmar variables de entorno en producción

- [ ] Verificar en el panel del proveedor (Vercel/host) que `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_QUOTES_BUCKET`, `DATABASE_URL`, `NEXTAUTH_SECRET` estén seteadas en el entorno **Production** (no solo Preview/Development). Esto requiere acceso del usuario al dashboard — **no puedo verificarlo desde el repo**.
- [ ] Si falta alguna, settearla y redeploy. Si todas están presentes, pasar a Task 0.2.

### Task 0.2 — Defensive fix: no dejar que un servicio externo opcional rompa el render

**Files:** `app/api/admin/media/route.ts`, `src/infrastructure/services/R2StorageService.ts`

- [ ] Confirmar con logs reales de producción (Vercel Functions logs) cuál es el error exacto antes de tocar código — si la hipótesis de R2 creds es correcta, el fix es de configuración (Task 0.1), no de código.
- [ ] Si el error real es distinto (p. ej. timeout de red a R2, no credenciales faltantes), documentar el error real aquí y ajustar el fix en consecuencia.

### Task 0.3 — Inspeccionar `/admin/settings` en vivo

- [ ] Abrir `/admin/settings` directamente en producción (no vía prefetch) y revisar Network tab / console para el error real, ya que el análisis estático no encontró una causa server-side clara (es client component).

**No se puede cerrar la Fase 0 sin logs reales de producción.** Lo anterior es la mejor hipótesis con evidencia de código; ejecutar Task 0.1 primero porque es la causa más probable y la más barata de descartar.

---

## Fase 1 — Correcciones en el detalle del Lead

### Task 1.1 — Reproducir y, si aplica, corregir el mapeo de Contact Information

**Files:** `src/presentation/components/admin/QuoteDetailPanel.tsx`, `src/presentation/types/QuoteDTO.ts`

La auditoría estática no encontró el bug reportado: `quote.email`/`quote.phone` ya vienen como strings desde el DTO y se renderizan tal cual (con un `.toString()` redundante e inofensivo en las líneas 125-126).

- [ ] Abrir un lead real en `/admin/leads/[id]` y en el modal (`?leadId=`) y confirmar visualmente si Contact Information muestra los valores correctos.
- [ ] Si el bug reaparece, es probablemente específico de un lead con `phone: null` (Phone value object puede ser `null`) o de la ruta del **modal** (no auditada en detalle — solo se auditó la página completa). Revisar el componente que alimenta el modal (buscar el componente real, puede diferir de `QuoteDetailPanel`).
- [ ] Quitar los `.toString()` redundantes en las líneas 125-126 de cualquier forma (limpieza segura, no cambia comportamiento).
- [ ] `npm run build`.

### Task 1.2 — Contact Information editable

**Files:**
- Modify: `src/presentation/components/admin/QuoteDetailPanel.tsx`
- Create: `src/application/use-cases/leads/UpdateQuoteContactUseCase.ts`
- Modify: `src/core/repositories/IQuoteRepository.ts`, `src/infrastructure/repositories/DrizzleQuoteRepository.ts` (confirmar que `update()` ya existe; si no, agregarlo)
- Create: `app/api/admin/leads/[id]/contact/route.ts` (PATCH)

El nombre/email/phone vive en `Quote`, no en `Lead` — la entidad inmutable correcta a actualizar es `Quote`.

```typescript
// src/application/use-cases/leads/UpdateQuoteContactUseCase.ts
export class UpdateQuoteContactUseCase {
  constructor(private quoteRepository: IQuoteRepository) {}

  async execute(quoteId: string, input: { name: string; email: string; phone?: string }): Promise<Quote> {
    const quote = await this.quoteRepository.findById(quoteId)
    if (!quote) throw new Error('Quote not found')

    const updated = quote.withContact({
      name: input.name,
      email: Email.create(input.email),
      phone: Phone.create(input.phone),
    })
    await this.quoteRepository.update(updated)
    return updated
  }
}
```

- [ ] Agregar `withContact({ name, email, phone })` a `Quote` (mismo patrón inmutable que `withStatus`).
- [ ] Crear `UpdateQuoteContactUseCase` como arriba.
- [ ] Crear ruta `app/api/admin/leads/[id]/contact/route.ts` con PATCH: auth → resolver `quote` desde `lead.quoteId` → ejecutar use case → devolver `QuoteDTO`.
- [ ] En `QuoteDetailPanel.tsx`, convertir name/email/phone en inputs editables con botón Save, validación cliente con los mismos mensajes de error que `Email.create`/`Phone.create` lanzan (capturar y mostrar). Reusar el patrón de `handleStageSelect` (estado `saving`, `toast` de éxito/error) ya presente en el mismo archivo.
- [ ] `npm run build`.

### Task 1.3 — Roles de contacto: tabla en vez de enum, combobox "create new"

**Files:**
- Modify: `src/infrastructure/db/schema.ts` (nueva tabla `leadContactRoles`, modificar `leadContacts.role` para referenciar por id en vez de enum)
- Create: `src/core/entities/LeadContactRole.ts`, `src/core/repositories/ILeadContactRoleRepository.ts`, `src/infrastructure/repositories/DrizzleLeadContactRoleRepository.ts`
- Create: `app/api/admin/lead-contact-roles/route.ts` (GET lista, POST crear)
- Modify: `src/presentation/components/admin/LeadContactsPanel.tsx` (Select → Combobox con "+ Create new role")

**Decisión de esquema:** nueva tabla en lugar de seguir con el enum Postgres, porque los enums de Postgres no soportan altas dinámicas sin `ALTER TYPE` (operación pesada y no apta para "el usuario crea un role desde la UI").

```typescript
// schema.ts — reemplaza leadContactRoleEnum
export const leadContactRoles = pgTable('lead_contact_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  label: varchar('label', { length: 100 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] Crear tabla `leadContactRoles`. Migración aditiva: agregar columna nueva `roleId: uuid references leadContactRoles.id` a `leadContacts`, sembrar las 4 filas (`owner/site_manager/spouse/other`) como `isDefault: true`, backfill `leadContacts.roleId` desde el `role` enum actual con un `UPDATE` SQL en la propia migración, luego (en una migración **separada**, ejecutada solo tras confirmar el backfill) eliminar la columna `role` enum vieja. No combinar add+drop en la misma migración (regla ya establecida en planes anteriores del repo, ver Fase 5b).
- [ ] `ILeadContactRoleRepository`: `findAll()`, `findByKey(key)`, `create({key, label})`.
- [ ] Ruta `app/api/admin/lead-contact-roles` GET/POST.
- [ ] UI: reemplazar el `<Select>` fijo por un Combobox (shadcn `Command` + `Popover`, patrón estándar de shadcn) que liste roles existentes y permita escribir un nombre nuevo → POST → seleccionar el recién creado.
- [ ] `npm run build`.

### Task 1.4 — Verificar el selector de Stage en vivo (no reimplementar)

**Files:** ninguno por defecto — solo si la verificación encuentra un bug real.

- [ ] Abrir un lead en producción/staging y confirmar que el `<Select>` de stage en `QuoteDetailPanel.tsx:217-235` efectivamente persiste el cambio y se refleja en Table/Kanban sin recargar.
- [ ] Si funciona: cerrar este item sin cambios de código, documentarlo en el reporte final como "ya funcionaba".
- [ ] Si NO funciona en producción pero sí en local: es síntoma de la Fase 0 (el mismo tipo de fallo silencioso de un servicio externo) — no un bug de este selector. Anotar como dependiente de Fase 0.

### Task 1.5 — Archive como segunda dimensión distinta de Trash

**Files:**
- Modify: `src/infrastructure/db/schema.ts` (`leads`: agregar `trashedAt`, mantener `archivedAt` con semántica nueva)
- Modify: `src/core/entities/Lead.ts` (agregar `trashedAt`, métodos `trash()`/`restoreFromTrash()` además de `archive()`/`restore()` ya existentes)
- Create: `src/application/use-cases/leads/TrashLeadUseCase.ts`, `RestoreLeadFromTrashUseCase.ts`
- Modify: `src/core/repositories/ILeadRepository.ts`, `src/infrastructure/repositories/DrizzleLeadRepository.ts` (`findAllFiltered` gana `onlyTrashed`/`includeTrashed`, y el default ahora excluye AMBOS `archivedAt` y `trashedAt`)
- Modify: `app/api/admin/leads/[id]/archive/route.ts` (deja de ser "trash", pasa a ser archive de verdad), Create: `app/api/admin/leads/[id]/trash/route.ts`, `app/api/admin/leads/[id]/restore-trash/route.ts`
- Modify: `app/admin/(protected)/leads/page.tsx` (vista trash actual usaba `onlyArchived` — pasa a usar `onlyTrashed`), Create: vista/tab de Archive separada de Trash en la UI.

**Importante:** el botón actual "Move to trash" en `QuoteDetailPanel.tsx` llama hoy a `POST .../archive` (que internamente usa `ArchiveLeadUseCase`/`archivedAt`). Para no romper nada en el camino, el plan es:

1. Renombrar la semántica actual de `archivedAt` a lo que realmente es hoy en la UI: **trash**. Es decir, primero un rename limpio (`archivedAt` → `trashedAt` a nivel de columna y entidad, `ArchiveLeadUseCase` → `TrashLeadUseCase`, ruta `.../archive` → `.../trash`).
2. Luego agregar el concepto NUEVO de `archivedAt` desde cero, con su propio use case/ruta/UI, sin tocar lo de trash.

- [ ] Migración 1 (aditiva): agregar columna `trashed_at timestamp` a `leads`. Backfill `trashed_at = archived_at` para preservar el estado actual de cualquier lead ya "archivado" (que hoy significa trashed en la práctica).
- [ ] Migración 2 (tras confirmar backfill): dejar `archived_at` como columna nueva de verdad — es decir, hacer un `UPDATE leads SET archived_at = NULL` (limpiar todo lo que el backfill copió, porque ese dato ya vive en `trashed_at`) en lugar de un drop+recreate. Operación de datos, no de esquema — documentar el SQL exacto ejecutado en el reporte final.
- [ ] `Lead` entity: `trash()`/`restoreFromTrash()` (clones de `archive()`/`restore()` actuales pero sobre `trashedAt`), y `archive()`/`restore()` nuevos de cero sobre `archivedAt` (vuelven a estado "activo", no a trash).
- [ ] Repositorio: `findAllFiltered` recibe `includeArchived?, onlyArchived?, includeTrashed?, onlyTrashed?`. Default (ninguno) = `archived_at IS NULL AND trashed_at IS NULL`.
- [ ] Rutas: `TrashLeadUseCase`/`RestoreLeadFromTrashUseCase` detrás de `.../trash` y `.../restore-trash`; `ArchiveLeadUseCase`/`RestoreLeadUseCase` (ya existen, quedan igual pero ahora apuntan de verdad a "archive") detrás de `.../archive` y `.../restore`.
- [ ] UI: botón actual "Move to trash" sigue llamando a `.../trash` (mismo texto, mismo comportamiento percibido). Nuevo botón "Archive" llama a `.../archive`. Nueva vista "Archive" (separada de la vista "Trash" ya existente) con su propio botón Restore.
- [ ] `npm run build`.

### Task 1.6 — Calls & Visits: agregar `follow_up` y verificar el flujo de creación

**Files:**
- Modify: `src/infrastructure/db/schema.ts` (`leadEventTypeEnum`: agregar `'follow_up'`)
- Modify: `src/presentation/components/admin/LeadEventForm.tsx`, `LeadEventsPanel.tsx`

- [ ] Migración aditiva: `ALTER TYPE lead_event_type ADD VALUE 'follow_up'` (Postgres permite agregar valores a un enum sin downtime; drizzle-kit lo genera como migración propia).
- [ ] Agregar `follow_up` a las opciones del formulario de tipo de evento en `LeadEventForm.tsx`.
- [ ] Verificar en vivo que "Schedule new event" efectivamente crea el evento con el tipo seleccionado (la auditoría confirmó que el tipado YA existe en esquema/entidad — si el botón no funciona, el bug está en el handler del formulario o en la llamada a la API, no en el modelo de datos). Si se encuentra un bug real en el handler, documentarlo aquí con el fix aplicado.
- [ ] Confirmar que el evento creado aparece en la tab Calls & Visits y en el timeline de `LeadActivity` (ya existe `type: 'stage_change'` como precedente de logging — el evento de Calls & Visits debería loguear un activity `type: 'event_scheduled'` si no lo hace ya).
- [ ] `npm run build`.

---

## Decisiones del usuario (§8 — ya resueltas, desbloquean Fases 2, 3 y 4)

1. **Pipeline stages:** sembrar solo los 5 stages actuales. No se agregan `site_visit_scheduled`/`negotiation` por defecto.
2. **Form builder / quotes:** el administrador decide qué campos son obligatorios vía el builder (hereda default, editable). Única excepción dura, hardcodeada fuera del control del builder: **consent/terms siempre obligatorio** en cualquier formulario.
3. **Staff users:** se extiende `admin_users` (no se crea tabla separada). Permission scopes del §7.1 original quedan sin cambios.
4. **Assignee de Tasks vs Staff users:** como Staff users = `admin_users` (ya existe), **no hace falta stub**: `assigneeId` referencia `admin_users.id` directamente desde el día uno. Esto desbloquea la Fase 3 por completo, sin dependencia de secuencia con la 4.1.
5. **Roles de contacto vs cargo de staff:** vocabularios separados. `lead_contact_roles` (Task 1.3) sigue exclusiva de contactos de leads; el cargo de un staff user es un campo de texto libre en `admin_users`, sin relación con esa tabla.
6. **Form Builder scope:** taxonomía completa (todas las categorías A–L de la orden original) implementada ahora, vía un registro de tipos de campo data-driven (ver Task 4.2.2) — no 80 componentes bespoke, sino un puñado de renderers base parametrizados por config, para que la taxonomía completa sea sostenible en una sola pasada.

---

## Fase 2 — Pipeline stages configurables

### Task 2.1 — Schema: `pipeline_stages` + migración de `leads.stage`

**Files:** Modify `src/infrastructure/db/schema.ts`

```typescript
export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  label: varchar('label', { length: 100 }).notNull(),
  position: integer('position').notNull().default(0),
  color: varchar('color', { length: 7 }).notNull().default('#E2C063'),
  isDefault: boolean('is_default').notNull().default(false),
  terminalKind: varchar('terminal_kind', { length: 10 }), // 'won' | 'lost' | null
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] Migración 1 (aditiva): crear tabla `pipeline_stages`; agregar columna `leads.stage_id uuid` (nullable, sin FK todavía); seed de las 5 filas con `position 0..4` y `terminalKind` (`won`→`'won'`, `lost`→`'lost'`, resto `null`), usando las keys idénticas a los valores actuales del enum (`prospect, contacted, quoted, won, lost`).
- [ ] Migración 2 (mismo PR, ejecutada tras confirmar el seed): `UPDATE leads SET stage_id = (SELECT id FROM pipeline_stages WHERE key = leads.stage::text)`; luego `ALTER TABLE leads ALTER COLUMN stage_id SET NOT NULL` + agregar FK `references pipeline_stages.id`.
- [ ] Migración 3 (**separada, ejecutar solo tras confirmar en producción que todo lee de `stage_id`**): `ALTER TABLE leads DROP COLUMN stage` + eliminar el enum `lead_stage` si ya no lo usa nada más.
- [ ] `npx drizzle-kit generate` por cada migración por separado (no combinar 1+2+3 en un solo archivo).

### Task 2.2 — Dominio y repositorio

**Files:**
- Create: `src/core/entities/PipelineStage.ts`, `src/core/repositories/IPipelineStageRepository.ts`, `src/infrastructure/repositories/DrizzlePipelineStageRepository.ts`
- Modify: `src/core/entities/Lead.ts` (`stage: LeadStage` → `stageId: string`, quitar el union type `LeadStage`), `src/core/repositories/ILeadRepository.ts`/`DrizzleLeadRepository.ts` (filtros por `stageId` en vez de `stage`)

```typescript
// IPipelineStageRepository.ts
export interface IPipelineStageRepository {
  findAll(): Promise<PipelineStage[]> // ordenado por position
  findById(id: string): Promise<PipelineStage | null>
  create(input: { key: string; label: string; color: string }): Promise<PipelineStage>
  rename(id: string, label: string): Promise<void>
  reorder(orderedIds: string[]): Promise<void> // rescribe position 0..n-1
}
```

- [ ] `PipelineStage` entity: constructor privado + `create()`/`reconstruct()`, sin métodos `with*` (es un lookup, no un aggregate con historial).
- [ ] `DrizzlePipelineStageRepository.reorder()`: transacción que actualiza `position` para cada id en el orden recibido.
- [ ] `Lead.withStage(stageId: string)` reemplaza la firma anterior (antes recibía `LeadStage`).
- [ ] `npm run build`.

### Task 2.3 — Use cases y rutas

**Files:**
- Modify: `src/application/use-cases/leads/ChangeLeadStageUseCase.ts` (recibe `stageId` en vez de `newStage: LeadStage`)
- Create: `src/application/use-cases/pipeline/CreatePipelineStageUseCase.ts`, `RenamePipelineStageUseCase.ts`, `ReorderPipelineStagesUseCase.ts`
- Create: `app/api/admin/pipeline-stages/route.ts` (GET lista, POST crear), `app/api/admin/pipeline-stages/[id]/route.ts` (PATCH rename), `app/api/admin/pipeline-stages/reorder/route.ts` (POST con array de ids)

- [ ] Use cases nuevos: wrappers delgados sobre el repo (mismo patrón que el resto del repo).
- [ ] Rutas: `auth()` primero, sin DI container, igual que el resto.
- [ ] `npm run build`.

### Task 2.4 — UI: Kanban reordenable + rename inline + Table + filtros

**Files:** Modify `src/presentation/components/admin/LeadsKanban.tsx`, `LeadsTable.tsx`, `QuoteDetailPanel.tsx` (selector de stage), cualquier filtro de URL que use `LeadStage` como string literal.

- [ ] Kanban: las columnas pasan a generarse desde `pipelineStages` (fetch server-side en `leads/page.tsx`, pasado como prop), no desde un array hardcodeado de 5 strings.
- [ ] Reorder de columnas: usar `@dnd-kit` (ya en el repo) a nivel de columna además del ya existente a nivel de card; al soltar, llamar a `reorder` y actualizar optimista.
- [ ] Rename inline: doble click en el header de columna → input → blur/Enter llama a PATCH rename.
- [ ] Botón "+ Add list" al final de las columnas → modal simple (label + color) → POST create.
- [ ] `QuoteDetailPanel.tsx`: el `<Select>` de stage pasa de opciones hardcodeadas a mapear `pipelineStages` recibido por props.
- [ ] `npm run build`.

---

## Fase 3 — Tab de Tasks en el Detalle de Lead

### Task 3.1 — Schema

**Files:** Modify `src/infrastructure/db/schema.ts`

```typescript
export const taskStatusEnum = pgEnum('task_status', ['open', 'in_progress', 'done'])

export const leadTasks = pgTable('lead_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'), // markdown plano — no hay editor rich text instalado en el repo; si se requiere WYSIWYG real, es una dependencia nueva a confirmar en ejecución
  dueDate: timestamp('due_date', { withTimezone: true }),
  status: taskStatusEnum('status').notNull().default('open'),
  assigneeId: uuid('assignee_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
})

export const taskChecklistItems = pgTable('task_checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => leadTasks.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  position: integer('position').notNull().default(0),
  isChecked: boolean('is_checked').notNull().default(false),
})

export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => leadTasks.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  authorId: uuid('author_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
})

export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => leadTasks.id, { onDelete: 'cascade' }),
  key: text('key').notNull(), // key en bucket contigo-quotes, o key de Media Library si se elige desde el picker
  filename: varchar('filename', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] Migración aditiva única: las 4 tablas nuevas, sin tocar nada existente.
- [ ] `npx drizzle-kit generate`.

### Task 3.2 — Entidades, repos, use cases

Mismo patrón exacto que `LeadNote`/`LeadContact` (Fase 5b): constructor privado + `create()`/`reconstruct()` + métodos `with*` inmutables.

**Files (new):**
- `src/core/entities/Task.ts`, `TaskChecklistItem.ts`, `TaskComment.ts`, `TaskAttachment.ts`
- `src/core/repositories/ITaskRepository.ts` (+ checklist/comment/attachment repos)
- `src/infrastructure/repositories/DrizzleTaskRepository.ts` (+ las otras 3)
- `src/application/use-cases/tasks/`: `CreateTaskUseCase`, `UpdateTaskUseCase`, `ArchiveTaskUseCase`, `AssignTaskUseCase`, `AddChecklistItemUseCase`, `ToggleChecklistItemUseCase`, `RemoveChecklistItemUseCase`, `AddTaskCommentUseCase`, `EditTaskCommentUseCase`, `DeleteTaskCommentUseCase`, `AddTaskAttachmentUseCase`, `RemoveTaskAttachmentUseCase`

- [ ] `Task.assign(assigneeId: string | null)` — inmutable, igual que el resto.
- [ ] `TaskComment` gana `edit(body)` que setea `editedAt`.
- [ ] Repos: `save/findById/findByLeadId/update` (mismo shape que `ILeadNoteRepository`).
- [ ] `npm run build`.

### Task 3.3 — DTOs y rutas API

**Files (new):** `src/presentation/types/TaskDTO.ts` (+ checklist/comment/attachment DTOs)

- [ ] `TaskDTO` incluye `assignee: { id, name, email } | null` resuelto vía join a `admin_users` (no expone `passwordHash`).
- [ ] Rutas: `app/api/admin/leads/[id]/tasks/route.ts` (GET/POST), `.../tasks/[taskId]/route.ts` (PATCH/archive), `.../tasks/[taskId]/checklist-items/route.ts`, `.../tasks/[taskId]/checklist-items/[itemId]/route.ts`, `.../tasks/[taskId]/comments/route.ts`, `.../tasks/[taskId]/comments/[commentId]/route.ts` (PATCH editar, DELETE), `.../tasks/[taskId]/attachments/route.ts` (POST agregar key, DELETE quitar).
- [ ] Para subir un archivo nuevo (no elegido desde Media Library): reusar `generatePresignedPutUrl` contra `contigo-quotes`, mismo patrón que `quote-attachment/route.ts`.
- [ ] `npm run build`.

### Task 3.4 — UI: tab Tasks

**Files:** Create `src/presentation/components/admin/LeadTasksPanel.tsx`, `TaskCard.tsx`, `TaskDetailDrawer.tsx`. Modify el componente de tabs del detalle de lead para agregar "Tasks".

- [ ] Lista de tasks del lead (título, due date, status, assignee avatar/iniciales).
- [ ] Drawer/modal de detalle: descripción, checklist (agregar/check/quitar item), comentarios (agregar/editar/eliminar con sello autor+fecha, mostrar "edited" si `editedAt`), adjuntos (botón "Choose from Media Library" → `MediaPickerModal` ya existente, y botón "Upload new" → presigned PUT directo).
- [ ] Selector de assignee: dropdown poblado desde `GET /api/admin/staff` (ver Task 4.1.3) — lista de `admin_users` activos.
- [ ] `npm run build`.

---

## Fase 4 — Leads Management

### 4.1 Staff users + permisos granulares

#### Task 4.1.1 — Schema: extender `admin_users` + permisos

**Files:** Modify `src/infrastructure/db/schema.ts`

```typescript
// admin_users gana columnas de staff (aditivo)
// ALTER TABLE admin_users ADD COLUMN title varchar(100)
// ALTER TABLE admin_users ADD COLUMN phone varchar(20)

export const permissions = pgTable('permissions', {
  key: varchar('key', { length: 50 }).primaryKey(), // 'leads.view', 'leads.edit', ...
  label: varchar('label', { length: 150 }).notNull(),
})

export const staffUserPermissions = pgTable('staff_user_permissions', {
  userId: uuid('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  permissionKey: varchar('permission_key', { length: 50 }).notNull().references(() => permissions.key, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.permissionKey] }),
])
```

- [ ] Migración aditiva: `title`/`phone` en `admin_users`; tablas `permissions` + `staff_user_permissions`; seed de `permissions` con los 8 scopes del §7.1 original (`leads.view`, `leads.edit`, `leads.archive`, `pipeline.manage`, `tasks.manage`, `form_builder.manage`, `users.manage`, `media.manage`, `settings.manage` — 9 en total, confirmar conteo exacto al generar el seed).
- [ ] Usuarios `role = 'owner'` existentes: backfill con TODOS los permissions (owner = acceso total, no necesita chequeo granular pero se le asignan explícitamente para que la UI de "editar permisos" muestre el estado real).
- [ ] `npx drizzle-kit generate`.

#### Task 4.1.2 — Dominio, repos, helper de autorización

**Files:**
- Create: `src/core/repositories/IPermissionRepository.ts`, `src/infrastructure/repositories/DrizzlePermissionRepository.ts`
- Create: `src/infrastructure/auth/hasPermission.ts`

```typescript
// src/infrastructure/auth/hasPermission.ts
export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  if (await isOwner(userId)) return true // owner siempre pasa, ver nota abajo
  const repo = new DrizzlePermissionRepository()
  return repo.userHasPermission(userId, permissionKey)
}
```

- [ ] `IPermissionRepository`: `findAllForUser(userId)`, `setForUser(userId, permissionKeys: string[])` (reemplaza todo el set, transacción delete+insert), `userHasPermission(userId, key)`.
- [ ] `hasPermission()` consulta `adminUsers.role`: si es `'owner'`, true sin más chequeo (mantiene el enum existente como fast-path, no se elimina). Si es `'staff'`, consulta `staff_user_permissions`.
- [ ] `npm run build`.

#### Task 4.1.3 — Use cases, rutas, UI de gestión de staff

**Files:**
- Create: `src/application/use-cases/staff/CreateStaffUserUseCase.ts`, `UpdateStaffUserUseCase.ts`, `SetStaffPermissionsUseCase.ts`, `DeactivateStaffUserUseCase.ts`
- Create: `app/api/admin/staff/route.ts` (GET lista, POST crear — hashea password con bcryptjs igual que el seed script existente), `app/api/admin/staff/[id]/route.ts` (PATCH), `app/api/admin/staff/[id]/permissions/route.ts` (PUT)
- Create: `app/admin/(protected)/leads/management/staff/page.tsx` + componente de tabla con checkboxes de permisos por usuario

- [ ] Cada ruta admin existente que deba quedar restringida (`leads.archive` en Task 1.5, `pipeline.manage` en Fase 2, `tasks.manage` en Fase 3, `form_builder.manage`/`media.manage`/`settings.manage`/`users.manage` aquí) gana un chequeo `await hasPermission(session.user.id, 'scope.key')` al inicio del handler, devolviendo 403 si falla. Esto es retroactivo sobre las fases anteriores de este plan — se aplica al final, como Task 4.1.4.
- [ ] UI: nueva sub-página "Leads Management" bajo `/admin/leads/management` con tabs "Staff" y "Form Builder" (Task 4.2). Tabla de staff con nombre/email/cargo/checkboxes de los 9 permisos, botón crear nuevo staff user (modal con name/email/title/phone/password inicial).
- [ ] `npm run build`.

#### Task 4.1.4 — Aplicar permisos retroactivamente

**Files:** todas las rutas API admin creadas en Fases 1–3 de este plan, listadas arriba.

- [ ] Agregar el chequeo `hasPermission` a cada ruta según su scope correspondiente. Checklist exacto se genera al ejecutar esta tarea (depende de qué rutas existan en ese momento del repo).
- [ ] `npm run build`.

### 4.2 Form Builder

#### Task 4.2.1 — Schema: `forms`, `form_versions`, `quotes.form_data`

**Files:** Modify `src/infrastructure/db/schema.ts`

```typescript
export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(), // 'request-a-quote'
  activeVersionId: uuid('active_version_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const formVersions = pgTable('form_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  schema: jsonb('schema').notNull(), // FormSchema — ver Task 4.2.2
  version: integer('version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// quotes gana, aditivo:
// formVersionId: uuid('form_version_id').references(() => formVersions.id)
// formData: jsonb('form_data').notNull().default(sql`'{}'::jsonb`)
```

- [ ] Migración aditiva única. Seed: una `forms` row (`slug: 'request-a-quote'`) + una `form_versions` row cuyo `schema` reconstruye el formulario actual (los 5 campos de hoy: name/email/phone/service/message, todos mapeados a `mapsToSystemField`) más un campo `consent_checkbox` marcado `required: true` y un flag interno `locked: true` (no removible desde el builder — ver Task 4.2.3).
- [ ] `npx drizzle-kit generate`.

#### Task 4.2.2 — Registro de tipos de campo (data-driven, cubre la taxonomía completa A–L)

**Files:** Create `src/core/form-schema/fieldTypes.ts`, `src/core/form-schema/FormSchema.ts`

En vez de ~80 componentes/validadores bespoke, cada tipo de campo de la taxonomía original se mapea a uno de un puñado de **renderer primitives** + config. Esto es lo que hace viable implementar la taxonomía completa en una sola pasada, tal como decidiste:

| Renderer primitive | Tipos de la taxonomía que cubre |
|---|---|
| `TextInputRenderer` | text, email, phone, url, password, number, currency, slug, masked, hidden, percentage, postcode |
| `TextareaRenderer` | textarea, rich_text (sin WYSIWYG real — markdown plano, ver nota Task 3.1), paragraph_block (estático) |
| `ChoiceRenderer` | select, radio_group, segmented/button_group, combobox, switch, yes_no, checkbox, checkbox_group, multi_select, tags_input |
| `DateTimeRenderer` | date, time, datetime, date_range, month_year, duration |
| `RangeRenderer` | number_stepper, slider, range_slider, rating |
| `FileRenderer` | file_upload_single, file_upload_multi, image_upload, dropzone, media_library_picker (reusa `MediaPickerModal`), signature (canvas simple), camera_capture |
| `CompositeRenderer` | full_name, address, country_select, state_select |
| `LocationRenderer` | map_picker, address_autocomplete, geolocation |
| `LayoutRenderer` (no input) | step/page, section, fieldset, group, grid, row, column, card_section, accordion_section, tabs_section, divider, spacer, heading_block, media_block, html_embed |
| `NavRenderer` (no input) | stepper, progress_bar, breadcrumbs, next_button, back_button, submit_button, save_and_continue |
| `AdvancedRenderer` | repeater, matrix, conditional_group, computed, lookup, image_choice_single, image_choice_multi |
| `ConsentRenderer` | consent_checkbox, terms_acceptance, captcha (honeypot por defecto; Turnstile/reCAPTCHA como config opcional, sin integrar el servicio externo en esta pasada — solo el placeholder del campo) |
| `SystemFieldRenderer` (oculto/autopoblado, sin UI) | hidden_field, utm_source, referrer, submitted_at, honeypot, submission_id |

- [ ] `FormSchema` (tipo TS + validador Zod del schema en sí, no de las respuestas): `{ steps: FormStep[] }`, `FormStep: { fields: FormField[] }`, `FormField: { id, type, label, placeholder?, helpText?, required, defaultValue?, validation?, options?, colSpan?, visibilityConditions?, mapsToSystemField?, locked? }`.
- [ ] `buildZodValidator(schema: FormSchema): ZodSchema` — recorre los fields, construye un objeto Zod dinámico según `type` + `validation` + `required`. **Regla dura fuera del control del builder:** si el schema no contiene al menos un field de tipo `consent_checkbox` o `terms_acceptance` con `required: true`, `buildZodValidator` lanza un error de configuración (no se puede publicar/guardar un form sin esa garantía) — esto materializa la decisión de "consent siempre obligatorio".
- [ ] `npm run build`.

#### Task 4.2.3 — `<FormRenderer>` compartido

**Files:** Create `src/presentation/components/forms/FormRenderer.tsx` + un archivo por renderer primitive bajo `src/presentation/components/forms/renderers/`.

- [ ] `<FormRenderer schema={FormSchema} onSubmit={...} />`: renderiza steps/fields según el registro de Task 4.2.2, usa `react-hook-form` + el validador Zod dinámico (mismo stack que el resto del repo).
- [ ] Reemplaza el uso interno de `QuoteForm.tsx`: `QuoteForm` pasa a ser un wrapper delgado que carga el `form_version` activo de `slug: 'request-a-quote'` y delega en `<FormRenderer>`, mapeando los campos con `mapsToSystemField` a los argumentos de `CreateQuoteUseCase` (`name/email/phone/service/message`) y el resto a `formData`.
- [ ] El modal interno (`QuoteFormModal.tsx`) usa el mismo `<FormRenderer>` — un solo punto de verdad, como pedía la orden original.
- [ ] `npm run build` + probar en navegador que el formulario público sigue funcionando idéntico a hoy (mismo set de campos, mismo submit a `/api/quotes`).

#### Task 4.2.4 — `<FormBuilder>` admin

**Files:** Create `src/presentation/components/admin/form-builder/FormBuilder.tsx` (canvas), `FieldPalette.tsx`, `FieldConfigPanel.tsx`.

- [ ] Canvas drag-and-drop (`@dnd-kit`) para reordenar fields/steps.
- [ ] Paleta agrupada exactamente por las categorías A–L de la taxonomía original, con cada entrada mostrando su renderer primitive subyacente solo internamente (la UI muestra el nombre del tipo, no el renderer).
- [ ] Panel de configuración por field seleccionado: label/placeholder/helpText/required/defaultValue/validation/options/colSpan/visibilityConditions/mapsToSystemField. Los fields con `locked: true` (el consent sembrado en Task 4.2.1) no permiten desmarcar `required` ni eliminarse — UI deshabilita esos controles para ese field específico.
- [ ] Guardar → POST nueva `form_versions` row (versionado: nunca se edita una versión existente, se crea una nueva y se actualiza `forms.activeVersionId`).
- [ ] Ruta: `app/api/admin/forms/[slug]/versions/route.ts` (POST nueva versión), protegida por `hasPermission('form_builder.manage')` (Task 4.1.4).
- [ ] `npm run build`.

---

## Preguntas abiertas

Ninguna pendiente — las 6 del §8 original quedaron resueltas arriba. Quedan dos puntos de verificación en vivo que no se pueden cerrar por auditoría estática (ver Tasks 0.1–0.3, 1.1, 1.4, 1.6) y un conteo exacto de permission scopes a confirmar al ejecutar Task 4.1.1 (8 vs 9 según se cuente `users.manage` por separado).

---

## Definición de terminado (recordatorio §9 de la orden original)

Reporte final tras ejecución: ruta del plan + fases ejecutadas, rutas de migración + comandos + resultado, cambios por archivo agrupados por capa, resumen de diff de esquema, resultado de build, pasos de prueba manual por item, riesgos/stubs pendientes, y confirmación de que no hubo commit/push.
