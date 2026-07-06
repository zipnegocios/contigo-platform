# 03 — API Reference
**Contigo Constructions Platform · Entrega v1.0**
**87 route handlers** bajo `app/api/**` (Next.js App Router — cada carpeta con `route.ts` es un endpoint).

---

## 1. Convenciones

- **Auth:** todas las rutas bajo `/api/admin/**` verifican sesión NextAuth (`auth()`) **dentro del handler**, además de la protección de `middleware.ts`. Las rutas `/api/quote-status/[token]/**` no requieren login — la seguridad es por posesión del `trackingToken` (capability URL de tipo UUID, no adivinable).
- **Validación:** el dominio Leads/Quotes/Tasks/Staff/Pipeline valida entrada con **Zod**. El dominio Catálogo (`projects`, `services`, `categories`) y las rutas de `media`/`change-password` mayormente no la usan (ver Doc 06).
- **Formato de error:** JSON `{ error: string }` con status HTTP correspondiente (401/403/404/422/500 según el caso; no hay un formato de error unificado documentado a nivel de proyecto).

---

## 2. Endpoints públicos (sin autenticación)

| Método | Ruta | Propósito |
|---|---|---|
| POST | `/api/quotes` | Recibe una solicitud de cotización, crea `quote` + `lead` automáticamente, dispara email de confirmación |
| GET | `/api/projects/featured` | Proyectos destacados para la home |
| GET | `/api/categories/tree` | Árbol de categorías para navegación pública |
| GET | `/api/forms/[slug]` | Devuelve el schema de un formulario publicado (Form Builder) |
| GET | `/api/health` | Health check (usado por Docker/EasyPanel) |
| POST | `/api/upload/quote-attachment` | Presigned upload para adjuntos del formulario de cotización |

### Portal de cliente — `/api/quote-status/[token]/**` (autenticación por posesión de token)

| Método | Ruta | Propósito |
|---|---|---|
| GET | `.../status/stream` | SSE — estado de la cotización en tiempo real |
| GET | `.../schedule/stream` | SSE — agenda de eventos (`lead_events`) de solo lectura |
| GET, POST | `.../messages` | Lee/envía mensajes del hilo cliente↔staff |
| GET | `.../messages/stream` | SSE — nuevos mensajes |
| GET | `.../messages/unread-count` | Contador para el badge de notificación |
| GET, POST | `.../notifications` | Feed de notificaciones del cliente |
| GET | `.../notifications/stream` | SSE — notificaciones en vivo |
| GET | `.../attachments` | Lista adjuntos visibles para el cliente |
| GET | `.../documents/[documentId]` | Descarga un documento específico (presigned) |

---

## 3. Endpoints administrativos — `/api/admin/**` (71 rutas)

### Autenticación y staff

| Método | Ruta | Propósito |
|---|---|---|
| POST | `/api/admin/auth/change-password` | Cambio de contraseña del usuario en sesión |
| GET, POST | `/api/admin/staff` | Listar / crear usuarios staff (vía invitación, post-hardening) |
| PATCH | `/api/admin/staff/[id]` | Editar datos de un staff |
| PUT | `/api/admin/staff/[id]/permissions` | Asignar permisos granulares |

### Leads / CRM (36 rutas — el módulo más extenso)

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/api/admin/leads` | Listado de leads (Kanban / tabla) |
| GET, PATCH | `/api/admin/leads/[id]` | Detalle / actualización de un lead |
| POST | `/api/admin/leads/[id]/archive` \| `/restore` \| `/trash` \| `/restore-trash` \| `/delete-permanently` | Ciclo de vida completo del lead (soft-delete en 3 niveles + borrado físico explícito) |
| PATCH | `/api/admin/leads/[id]/contact` | Actualiza contacto principal (legado) |
| GET, POST | `/api/admin/leads/[id]/contacts` | Lista/crea contactos del lead |
| PATCH | `/api/admin/leads/[id]/contacts/[contactId]` + `/archive` + `/restore` | CRUD de contacto individual |
| POST | `/api/admin/leads/[id]/documents` | Sube/asocia un documento (incluye categoría `invoice`) |
| POST | `/api/admin/leads/[id]/documents/[documentId]/archive` \| `/restore` | Ciclo de vida de documento |
| POST | `/api/admin/leads/[id]/events` | Agenda un evento (llamada/visita/reunión) |
| PATCH | `/api/admin/leads/[id]/events/[eventId]` | Edita evento |
| POST | `.../events/[eventId]/archive` \| `/restore` | Ciclo de vida de evento |
| GET, POST | `/api/admin/leads/[id]/notes` | Notas internas |
| PATCH | `/api/admin/leads/[id]/notes/[noteId]` + `/archive` + `/restore` | CRUD de nota |
| GET, POST | `/api/admin/leads/[id]/messages` | Hilo de mensajería (lado staff) |
| GET | `/api/admin/leads/[id]/messages/stream` | SSE — mensajes en vivo (lado staff) |
| GET | `/api/admin/leads/[id]/attachments` | Lista adjuntos del lead |

### Tareas — `/api/admin/leads/[id]/tasks/**` (17 rutas)

| Método | Ruta | Propósito |
|---|---|---|
| GET, POST | `.../tasks` | Listar/crear tareas del lead |
| GET, PATCH | `.../tasks/[taskId]` | Detalle/edición de tarea |
| POST | `.../tasks/[taskId]/archive` \| `/restore` | Ciclo de vida |
| GET, POST | `.../tasks/[taskId]/checklist-items` | Checklist de la tarea |
| PATCH, DELETE | `.../checklist-items/[itemId]` | Editar/eliminar ítem |
| GET, POST | `.../tasks/[taskId]/comments` | Comentarios |
| PATCH, DELETE | `.../comments/[commentId]` | Editar/eliminar comentario |
| GET, POST | `.../tasks/[taskId]/attachments` | Adjuntos de tarea |
| DELETE | `.../attachments/[attachmentId]` | Eliminar adjunto |
| POST | `.../tasks/presign` | Presigned URL para subir adjunto de tarea |

### Pipeline (Kanban)

| Método | Ruta | Propósito |
|---|---|---|
| GET, POST | `/api/admin/pipeline-stages` | Listar/crear etapas |
| PATCH | `/api/admin/pipeline-stages/[id]` | Renombrar/editar etapa |
| POST | `/api/admin/pipeline-stages/reorder` | Reordenar etapas (drag-and-drop del Kanban) |

### Catálogo — proyectos, servicios, categorías

| Método | Ruta | Propósito |
|---|---|---|
| GET, PATCH, POST | `/api/admin/projects` | Listar/reordenar/crear proyectos |
| GET, PATCH, DELETE | `/api/admin/projects/[id]` | Detalle/edición/soft-delete |
| POST | `/api/admin/projects/[id]/restore` | Restaurar desde papelera |
| GET, PATCH, POST | `/api/admin/services` | Listar/reordenar/crear servicios |
| GET, PATCH, DELETE | `/api/admin/services/[id]` | Detalle/edición/soft-delete |
| POST | `/api/admin/services/[id]/restore` | Restaurar |
| GET, POST | `/api/admin/categories` | Listar/crear categorías |
| GET | `/api/admin/categories/tree` | Árbol jerárquico (versión admin) |
| PATCH, DELETE | `/api/admin/categories/[id]` | Editar/soft-delete |
| POST | `/api/admin/categories/[id]/restore` | Restaurar |
| PATCH | `/api/admin/categories/reorder` | Reordenar |

> Nota de arquitectura: este bloque de 15 rutas es el que **no pasa por caso de uso ni Zod** en la mayoría de los casos (ver Doc 01 §2 y Doc 06).

### Form Builder

| Método | Ruta | Propósito |
|---|---|---|
| GET, POST | `/api/admin/forms` | Listar/crear formularios |
| GET, PATCH, DELETE | `/api/admin/forms/[slug]` | Detalle/edición/eliminación |
| POST | `/api/admin/forms/[slug]/duplicate` | Duplicar formulario |
| GET, POST | `/api/admin/forms/[slug]/versions` | Historial de versiones / crear nueva versión |
| POST | `/api/admin/forms/[slug]/versions/[versionId]/revert` | Revertir a una versión anterior |

### Media Library

| Método | Ruta | Propósito |
|---|---|---|
| GET, DELETE | `/api/admin/media` | Listar/eliminar archivos |
| GET, POST, PATCH, DELETE | `/api/admin/media/folders` | CRUD de carpetas |
| GET, POST, PATCH, DELETE | `/api/admin/media/tags` | CRUD de etiquetas |
| GET, POST, PATCH, DELETE | `/api/admin/media/metadata` | Metadata técnica por archivo |
| POST | `/api/admin/media/optimize` | Optimización de imagen (compresión/formato) |
| POST | `/api/admin/media/rename` | Renombrar archivo |
| POST | `/api/admin/upload/presign` | Presigned URL de subida general |

### Contenido / configuración

| Método | Ruta | Propósito |
|---|---|---|
| GET, PUT | `/api/admin/hero-config` | Configuración del hero de home (singleton) |
| GET, POST | `/api/admin/lead-contact-roles` | Catálogo dinámico de roles de contacto |

### Mensajería global (bandeja del staff)

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/api/admin/messages/stream` | SSE — nuevos mensajes de cualquier lead |
| GET | `/api/admin/messages/unread` | Contador global de no leídos |

### Auth de sesión

| Ruta | Propósito |
|---|---|
| `/api/auth/[...nextauth]` | Handler estándar de NextAuth (login/logout/callback/session) |

---

## 4. Schemas detallados — flujos críticos

### `POST /api/quotes` (público)

```ts
// Request (CreateQuoteSchema, Zod)
{
  name: string
  email: string
  phone?: string
  service: string
  message: string
  formVersionId?: string   // uuid, si viene del Form Builder
  formData?: Record<string, unknown>
}

// Efecto: crea quotes + leads (stage inicial = primera pipeline_stage),
// genera trackingToken, envía email de confirmación con link a /quote-status/[token]

// Response 201
{ id: string, trackingToken: string }
```

### `PATCH /api/admin/leads/[id]` (admin)

```ts
// Request (parcial — solo campos a modificar)
{
  stageId?: string
  estimatedValue?: number   // cents
}
// Efecto: ChangeLeadStageUseCase registra automáticamente una fila en lead_activities (type: 'stage_change')
```

### `GET .../quote-status/[token]/status` → SSE (portal cliente)

```
event: status-update
data: { "status": "quoted", "leadStage": "quoted", "updatedAt": "2026-07-05T10:00:00Z" }
```

### `POST /api/admin/leads/[id]/tasks/presign` (admin)

```ts
// Request
{ filename: string, contentType: string }
// Response
{ uploadUrl: string, key: string }  // presigned PUT contra bucket contigo-quotes
```

---

## 5. Dónde se modifica

| Necesidad | Ubicación |
|---|---|
| Agregar un endpoint nuevo | Nueva carpeta `route.ts` bajo `app/api/...` |
| Cambiar validación de entrada | Buscar el schema Zod importado en el `route.ts` (dominio Leads/Tasks) o agregarlo si no existe (dominio Catálogo) |
| Cambiar lógica de negocio de un endpoint del dominio Leads/Tasks/Staff/Pipeline | El caso de uso correspondiente en `src/application/use-cases/` |
| Cambiar lógica de negocio de Catálogo (projects/services/categories) | Directamente en el `route.ts` o en `Drizzle*Repository` — no hay caso de uso intermedio |
| Proteger un endpoint nuevo | Verificar `auth()` al inicio del handler + confirmar que la ruta cae bajo el matcher de `middleware.ts` |
