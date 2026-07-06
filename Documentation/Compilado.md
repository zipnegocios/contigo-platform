# 01 — Arquitectura del Sistema
**Contigo Constructions Platform · Entrega v1.0**
**Repo:** `github.com/zipnegocios/contigo-platform` · Rama `main` · Commit de corte `97d32f7` + hardening de auth

---

## 1. Visión general

Contigo Platform es una aplicación **Next.js 15 (App Router)** full-stack que combina:

1. Un **sitio público de marketing y portafolio** (marca, servicios, proyectos, formulario de cotización).
2. Un **panel de cliente sin autenticación** (`/quote-status/[token]`) para seguimiento de cotizaciones.
3. Un **CMS / CRM administrativo** protegido (`/admin/**`) donde el equipo de Contigo gestiona leads, proyectos, servicios, contenido y su propio staff.
4. Una **capa de API** (87 endpoints) que conecta ambos frentes con la base de datos y servicios externos.

```mermaid
flowchart LR
    subgraph Público
        A[Sitio Marketing<br/>app/(marketing)]
        B[Portafolio<br/>app/(portfolio)]
        C[Panel Cliente<br/>/quote-status/token]
    end
    subgraph Admin
        D[Dashboard CRM<br/>app/admin/(protected)]
    end
    subgraph API["Capa API — app/api/** (87 endpoints)"]
        E[Rutas públicas]
        F[Rutas admin<br/>protegidas por sesión]
    end
    subgraph Dominio
        G[src/application<br/>50 casos de uso]
        H[src/core<br/>19 entidades + interfaces]
    end
    subgraph Infraestructura
        I[(PostgreSQL 17<br/>+ pgvector)]
        J[Cloudflare R2]
        K[Resend Email]
        L[OpenAI Embeddings]
    end

    A --> E
    B --> E
    C --> E
    D --> F
    E --> G
    F --> G
    G --> H
    H --> I
    G --> J
    G --> K
    G --> L
```

---

## 2. Arquitectura por capas (Clean Architecture / DDD-like)

El proyecto sigue una separación en 4 capas dentro de `src/`:

```
src/core/           → Entidades de dominio, interfaces de repositorio, value objects
src/application/    → Casos de uso (orquestan entidades + repositorios)
src/infrastructure/ → Implementaciones Drizzle, servicios externos, auth, DB client
src/presentation/   → Componentes React, secciones, hooks, animaciones
```

**Flujo de datos en el camino correcto** (dominio Leads/Quotes/Tasks/Staff/Pipeline — 100% de estos módulos):

```
Route Handler (app/api/**)
   → Validación Zod
   → Caso de uso (instanciado manualmente, sin contenedor DI)
   → Interfaz de repositorio (src/core/repositories)
   → Implementación Drizzle (src/infrastructure/repositories)
   → PostgreSQL
```

Ejemplo trazable: `app/api/quotes/route.ts` → `CreateQuoteSchema` (Zod) → `CreateQuoteUseCase` / `CreateLeadForQuoteUseCase` → `IQuoteRepository` / `ILeadRepository` → `DrizzleQuoteRepository` / `DrizzleLeadRepository`.

**Excepción arquitectónica conocida — dominio Catálogo:** las rutas de `projects`, `services`, `categories`, además de las de `media` y `change-password`, acceden **directamente** a `Drizzle*Repository` o incluso a `db` crudo, sin pasar por caso de uso ni por Zod en la mayoría de los casos. Es un atajo estructural documentado desde la auditoría del 24-jun-2026 y **no corregido en esta entrega** (ver Doc 06, sección de deuda técnica, para el plan de remediación).

**Acoplamiento medido:**
- Bajo entre `presentation` y `core`/`application` — no se encontraron imports cruzados.
- Alto y directo entre `app/api/**` y Drizzle en el dominio Catálogo — es el patrón de acoplamiento más relevante a vigilar en mantenimiento.

---

## 3. Inventario de la capa de dominio

| Capa | Cantidad | Ubicación |
|---|---|---|
| Entidades | 19 | `src/core/entities/` |
| Interfaces de repositorio | 19 | `src/core/repositories/` |
| Implementaciones Drizzle | 21 | `src/infrastructure/repositories/` |
| Casos de uso | 50 | `src/application/use-cases/` |
| Servicios de infraestructura | 5 | `src/infrastructure/services/` |

**Casos de uso por dominio:**

| Dominio | # Casos de uso | Ejemplos |
|---|---|---|
| Leads | 25 | `CreateLeadForQuoteUseCase`, `ChangeLeadStageUseCase`, `ArchiveLeadUseCase`, `TrashLeadUseCase`, `DeleteLeadPermanentlyUseCase` |
| Tasks | 13 | `CreateTaskUseCase`, `AddChecklistItemUseCase`, `AssignTaskUseCase`, `AddTaskCommentUseCase` |
| Staff | 4 | `CreateStaffUserUseCase`, `SetStaffPermissionsUseCase`, `DeactivateStaffUserUseCase` |
| Portal (cliente) | 4 | `GetTrackingPanelDataUseCase`, `PostClientMessageUseCase`, `GetLeadNotificationFeedUseCase` |
| Pipeline | 3 | `CreatePipelineStageUseCase`, `ReorderPipelineStagesUseCase`, `RenamePipelineStageUseCase` |
| Quotes | 1 | `CreateQuoteUseCase` |

**Servicios de infraestructura:**

| Servicio | Responsabilidad |
|---|---|
| `ResendEmailService` | Envío de correos transaccionales (confirmaciones, notificaciones de mensajes, presupuesto listo) |
| `R2StorageService` | Presigned URLs de subida/descarga contra Cloudflare R2 |
| `OpenAIEmbeddingService` | Generación de embeddings para búsqueda semántica (write-path activo; read-path de recomendaciones aún no habilitado en producción) |
| `SlugGeneratorService` | Generación de slugs únicos para proyectos/servicios/categorías |
| `MediaReferenceService` | Resolución de referencias cruzadas entre Media Library y otras entidades |

---

## 4. Rutas de la aplicación (App Router)

```
app/
├── (marketing)/                 Landing pública: hero, servicios, proyectos, contacto
├── (portfolio)/
│   ├── about/
│   ├── projects/[slug]/
│   └── services/[category]/[item]/
├── admin/
│   ├── login/                   Público
│   └── (protected)/             Requiere sesión NextAuth (JWT)
│       ├── categories/  hero/  leads/  media/  projects/  services/  settings/
│       └── leads/management/{form-builder,staff}/
├── api/
│   ├── admin/**                 71 rutas — todas protegidas
│   ├── quotes, categories, projects, forms, health   Rutas públicas
│   └── quote-status/[token]/**  Portal cliente por capability URL (sin login)
└── quote-status/[token]/        Página del panel de cliente
```

**Patrón de protección:** `middleware.ts` intercepta `/admin/:path*`, exige `req.auth` (sesión NextAuth) y redirige a `/admin/login` si no existe, preservando `callbackUrl`. Las rutas API bajo `/api/admin/**` verifican la sesión **dentro de cada handler** (`auth()` in-handler), no solo vía middleware — patrón redundante pero intencional para que cada endpoint sea seguro incluso si se invoca fuera del árbol de páginas cubierto por el matcher.

---

## 5. Autenticación y autorización

- **Proveedor:** NextAuth v5 (beta), únicamente `CredentialsProvider` (sin OAuth social).
- **Hashing:** bcryptjs, con recomputación transparente de costo (ver Doc 06 para detalle post-hardening).
- **Sesión:** JWT, expiración reducida en el hardening de esta entrega (antes 7 días).
- **RBAC:** dos roles base (`owner`, `staff`) más un sistema de permisos granulares (`permissions` + `staff_user_permissions`) que permite otorgar capacidades específicas (`leads.view`, `leads.edit`, etc.) a usuarios `staff` sin tocar código.
- **Invitación de staff:** flujo por token de invitación de un solo uso (reemplaza la creación directa con contraseña temporal).
- **Recuperación de contraseña:** tokens hasheados de un solo uso + `sessionVersion` para invalidar sesiones JWT activas al cambiar contraseña.
- **Bloqueo de cuenta:** lockout por intentos fallidos con tiempos de respuesta uniformes (mitiga enumeración de usuarios).
- **Auditoría:** tabla de eventos de seguridad para inicios de sesión, bloqueos, cambios de permisos.

> 2FA y Content-Security-Policy quedan explícitamente fuera de esta entrega — documentados como roadmap técnico en el Doc 06.

---

## 6. Flujo E2E de referencia: de solicitud a presupuesto

```mermaid
sequenceDiagram
    participant C as Cliente
    participant W as Sitio público
    participant API as API (quotes)
    participant DB as PostgreSQL
    participant Admin as Panel Admin
    participant R2 as Cloudflare R2
    participant Mail as Resend

    C->>W: Completa formulario de cotización
    W->>API: POST /api/quotes
    API->>DB: CreateQuoteUseCase + CreateLeadForQuoteUseCase
    API->>Mail: Email confirmación + link de tracking (trackingToken)
    Admin->>DB: Ve nuevo lead en Kanban (pipeline_stages)
    Admin->>R2: Sube PDF de presupuesto (invoice/quote_pdf)
    Admin->>API: PATCH lead → status/stage
    API->>Mail: Notifica al cliente
    C->>W: Abre /quote-status/[token]
    W->>API: GET tracking panel data
    API->>DB: GetTrackingPanelDataUseCase
    C->>API: Envía mensaje en el hilo (lead_messages)
    API->>Mail: Notifica a staff
```

---

## 7. Realtime

La notificación entre cliente y staff usa **Server-Sent Events (SSE)** (`src/infrastructure/realtime/createSSEStream.ts`), reemplazando el polling inicial del MVP. Endpoints con sufijo `/stream` (mensajes, notificaciones, estado, calendario) mantienen una conexión abierta y emiten eventos cuando cambia el estado subyacente.

---

## 8. Diagrama de contenedores (infraestructura de alto nivel)

```mermaid
flowchart TB
    U[Usuario/Cliente] --> CF[Cloudflare Proxy]
    CF --> TR[Traefik Reverse Proxy]
    TR --> APP[Next.js App<br/>Docker Swarm — EasyPanel/Hostinger VPS]
    APP --> PG[(PostgreSQL 17<br/>+ pgvector)]
    APP --> R2A[R2: contigo-assets<br/>público/CDN]
    APP --> R2Q[R2: contigo-quotes<br/>privado/presigned]
    APP --> RS[Resend API]
    APP --> OA[OpenAI API]
```

Ver Doc 04 para el detalle operativo completo de este diagrama.

---

## 9. Referencias cruzadas

- Diccionario de datos completo → **Doc 02 — Base de Datos**
- Detalle de los 87 endpoints → **Doc 03 — API Reference**
- Runbook de despliegue → **Doc 04 — Infraestructura y Operación**
- Mapa "dónde se modifica cada módulo" → **Doc 05 — Módulos Funcionales**
- Deuda técnica y plan de escalamiento → **Doc 06 — Mantenibilidad y Escalamiento**



# 02 — Base de Datos
**Contigo Constructions Platform · Entrega v1.0**
**Motor:** PostgreSQL 17 (imagen `pgvector/pgvector`) · **ORM:** Drizzle · **Esquema fuente:** `src/infrastructure/db/schema.ts`

---

## 1. Resumen

- **26 tablas**, **14 enums**, **34 migraciones** aplicadas (`src/infrastructure/db/migrations/`).
- Extensión `pgvector` instalada para soportar embeddings de texto (columnas `description_vector` en `quotes` y `projects`), usada en el **write-path**; el read-path de recomendaciones semánticas automáticas está diseñado pero no habilitado en producción (ver Doc 06, roadmap).
- Convención consistente de **soft-delete**: la mayoría de las tablas usa `archived_at` y/o `trashed_at` en lugar de `DELETE` físico. El borrado permanente existe solo para `leads` vía un caso de uso explícito (`DeleteLeadPermanentlyUseCase`), no por defecto.
- Todas las claves primarias son `uuid` autogenerado (`defaultRandom()`), excepto `permissions.key` (varchar, catálogo fijo) y la PK compuesta de `staff_user_permissions`.

---

## 2. Enums

| Enum | Valores |
|---|---|
| `quote_status` | `new`, `contacted`, `in_progress`, `converted`, `closed` |
| `project_status` | `draft`, `active`, `inactive` |
| `service_status` | `draft`, `active`, `inactive` |
| `category_status` | `draft`, `active`, `inactive` |
| `lead_stage` *(deprecado)* | `prospect`, `contacted`, `quoted`, `won`, `lost` — reemplazado por `pipeline_stages` (tabla dinámica) |
| `admin_role` | `owner`, `staff` |
| `lead_event_type` | `call`, `site_visit`, `meeting`, `follow_up` |
| `lead_event_status` | `scheduled`, `completed`, `cancelled`, `no_show` |
| `lead_document_direction` | `client_upload`, `admin_sent`, `internal` |
| `lead_document_category` | `reference_photo`, `site_photo`, `quote_pdf`, `contract`, `other`, `invoice` |
| `lead_contact_role` *(deprecado)* | `owner`, `site_manager`, `spouse`, `other` — reemplazado por `lead_contact_roles` (tabla dinámica) |
| `lead_activity_type` | 17 valores — ver §5 |
| `task_status` | `open`, `in_progress`, `done` |
| `lead_message_author` | `client`, `staff` |

> **Nota de diseño importante:** `lead_stage` y `lead_contact_role` fueron migrados de enum a **tabla real** (`pipeline_stages`, `lead_contact_roles`) para permitir que el admin cree/renombre/reordene valores desde la UI sin requerir `ALTER TYPE` ni despliegue. Las columnas enum originales (`leads.stage`, `lead_contacts.role`) se mantienen en el esquema por retrocompatibilidad de migración, pero la aplicación ya no las usa como fuente de verdad — leer siempre `stageId` / `roleId`. **Antes de tocar código de estado de leads, confirmar que se está leyendo el campo FK, no el enum legado.**

---

## 3. Diccionario de tablas

### Catálogo / Contenido público

| Tabla | Propósito | Campos clave | Soft-delete |
|---|---|---|---|
| `categories` | Taxonomía jerárquica de servicios/proyectos (auto-referencial vía `parent_id`) | `slug`, `type`, `status`, `order_index`, `is_system` | `trashed_at` |
| `services` | Los 4 rubros + ítems de servicio (30 seeded) | `slug`, `page_blocks` (JSON, page builder visual), `category_id`, `request_form_id` (hook a Form Builder, sin lógica aún) | `trashed_at` |
| `projects` | Portafolio de obras ejecutadas | `slug`, `gallery_urls`, `description_vector` (embedding), `featured`, `order_index` | `trashed_at` |
| `hero_config` | Fila única (singleton) que controla el hero de home | `mode`, `slides` (JSON), `autoplay_interval` | — |

### Formularios dinámicos

| Tabla | Propósito |
|---|---|
| `forms` | Catálogo de formularios publicables (ej. "Request a Quote") |
| `form_versions` | Versión inmutable del JSON-schema del formulario; cada guardado del builder crea una fila nueva, nunca edita in-place |

### Cotizaciones y CRM (Leads)

| Tabla | Propósito | Campos clave |
|---|---|---|
| `quotes` | Solicitud original del cliente (público) | `tracking_token` (UUID capability URL), `status`, `form_version_id`, `form_data` (JSON crudo del submit) |
| `leads` | Entidad CRM 1:1 con `quotes`, creada automáticamente al enviar cotización | `stage_id` (FK activa), `stage` (legado), `estimated_value` (cents), `archived_at`, `trashed_at` |
| `pipeline_stages` | Etapas configurables del Kanban | `key`, `label`, `position`, `color`, `terminal_kind` (`won`/`lost`/null) |
| `lead_events` | Llamadas, visitas, reuniones agendadas | `type`, `scheduled_at`, `status`, `location` |
| `lead_documents` | Documentos/fotos asociados (incluye categoría `invoice` agregada en el MVP del panel de cliente) | `direction`, `category`, `file_key` (R2) |
| `lead_notes` | Notas internas del staff | `body`, `created_by` |
| `lead_messages` | Hilo de mensajería bidireccional cliente↔staff | `author_type`, `read_at` |
| `lead_contacts` | Contactos asociados al lead (puede haber más de uno) | `role_id` (FK activa), `role` (legado), `is_primary` |
| `lead_activities` | Timeline de auditoría automática (17 tipos de evento) | `type`, `payload` (JSON), `created_by` |
| `lead_contact_roles` | Catálogo dinámico de roles de contacto | `key`, `label`, `is_default` |

### Tareas (Tasks)

| Tabla | Propósito |
|---|---|
| `lead_tasks` | Tareas asociadas a un lead | `status`, `due_date`, `assignee_id` |
| `task_checklist_items` | Ítems de checklist dentro de una tarea | `position`, `is_checked` |
| `task_comments` | Comentarios sobre una tarea | `body`, `edited_at` |
| `task_attachments` | Adjuntos de tarea (R2 o Media Library) | `key`, `filename` |

### Media Library

| Tabla | Propósito |
|---|---|
| `media_folders` | Estructura de carpetas (auto-referencial) |
| `media_tags` | Etiquetas de color para clasificar archivos |
| `media_metadata` | Metadata técnica por archivo (dimensiones, formato, si fue optimizado) |

### Staff / Seguridad

| Tabla | Propósito |
|---|---|
| `admin_users` | Usuarios del panel (owner/staff) | `password_hash`, `is_active`, `last_login` |
| `permissions` | Catálogo fijo de permisos granulares (`leads.view`, `leads.edit`, etc.) |
| `staff_user_permissions` | Tabla puente usuario↔permiso (PK compuesta) |

> Esta sección documenta el esquema base. Las tablas/columnas agregadas específicamente por el work order de auth hardening (tokens de invitación, tokens de recuperación, `session_version`, tabla de eventos de seguridad) deben verificarse contra la migración real una vez confirmado el merge — anotado como pendiente de verificación en Doc 06.

---

## 4. Relaciones (ER simplificado)

```mermaid
erDiagram
    QUOTES ||--|| LEADS : "genera"
    LEADS }o--|| PIPELINE_STAGES : "stage_id"
    LEADS ||--o{ LEAD_EVENTS : tiene
    LEADS ||--o{ LEAD_DOCUMENTS : tiene
    LEADS ||--o{ LEAD_NOTES : tiene
    LEADS ||--o{ LEAD_MESSAGES : tiene
    LEADS ||--o{ LEAD_CONTACTS : tiene
    LEADS ||--o{ LEAD_ACTIVITIES : audita
    LEADS ||--o{ LEAD_TASKS : tiene
    LEAD_CONTACTS }o--|| LEAD_CONTACT_ROLES : role_id
    LEAD_TASKS ||--o{ TASK_CHECKLIST_ITEMS : tiene
    LEAD_TASKS ||--o{ TASK_COMMENTS : tiene
    LEAD_TASKS ||--o{ TASK_ATTACHMENTS : tiene
    LEAD_TASKS }o--|| ADMIN_USERS : assignee_id
    CATEGORIES ||--o{ CATEGORIES : "parent_id (jerarquía)"
    CATEGORIES ||--o{ PROJECTS : categoriza
    CATEGORIES ||--o{ SERVICES : categoriza
    FORMS ||--o{ FORM_VERSIONS : versiona
    FORM_VERSIONS ||--o{ QUOTES : "form_version_id"
    ADMIN_USERS ||--o{ STAFF_USER_PERMISSIONS : tiene
    PERMISSIONS ||--o{ STAFF_USER_PERMISSIONS : otorga
    MEDIA_FOLDERS ||--o{ MEDIA_FOLDERS : "parent_id"
```

---

## 5. `lead_activity_type` — los 17 tipos de evento auditado

`stage_change`, `note`, `call_scheduled`, `call_completed`, `call_cancelled`, `visit_scheduled`, `visit_completed`, `visit_cancelled`, `event_scheduled`, `event_completed`, `event_cancelled`, `document_uploaded`, `document_sent`, `email_sent`, `quote_status_changed`, `message_received`, `message_sent`.

Esta tabla es la fuente del timeline visible en el detalle de cada lead — cualquier acción relevante del CRM debería, por convención, insertar una fila aquí.

---

## 6. Estrategia de migraciones

- **Herramienta:** `drizzle-kit`. Comandos: `npm run db:push` (desarrollo, sin migración versionada), `npm run db:migrate` (producción, aplica journal), `npm run db:studio` (explorador visual).
- **Migraciones huérfanas detectadas:** `0000_init_pgvector.sql` y `0001_hierarchical_categories.sql` existen en disco pero **no están en el journal** de Drizzle — no se ejecutan vía `db:migrate`. Se recomienda archivarlas fuera de `migrations/` con nota histórica, no borrarlas, hasta confirmar que ningún entorno depende de ellas (ver Doc 06).
- **Script de pgvector duplicado:** `scripts/setup-pgvector.mjs` (registra que pgvector NO se usa) vs `scripts/setup-pgvector.ts` (invocado por `db:setup`, sí crea la extensión). Nombres casi idénticos con comportamiento opuesto — riesgo de confusión operativa documentado, sin corregir en esta entrega.

---

## 7. Índices

El esquema define **más de 40 índices explícitos** (`index(...)` en Drizzle), principalmente sobre:
- Columnas de filtro frecuente en el admin: `status`, `stage_id`, `archived_at`, `trashed_at`.
- Columnas de búsqueda: `slug`, `email`, `tracking_token`.
- Columnas de ordenamiento: `order_index`, `position`, `created_at`.

No hay índices `ivfflat`/`hnsw` sobre las columnas `description_vector` — si se activa el read-path de pgvector (roadmap), este es un prerequisito de performance a agregar.

---

## 8. Dónde se modifica

| Necesidad | Archivo |
|---|---|
| Agregar/modificar una tabla o columna | `src/infrastructure/db/schema.ts` → correr `npm run db:push` (dev) o generar migración con `drizzle-kit generate` (prod) |
| Agregar un enum nuevo | `pgEnum(...)` en el mismo archivo, junto a los existentes en la sección `// ============ ENUMS ============` |
| Ver el estado real de una tabla sin escribir SQL | `npm run db:studio` |
| Repositorio de acceso a una tabla | `src/infrastructure/repositories/Drizzle<Entidad>Repository.ts` |
| Interfaz que ese repositorio implementa | `src/core/repositories/I<Entidad>Repository.ts` |




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



# 04 — Infraestructura y Operación
**Contigo Constructions Platform · Entrega v1.0**

---

## 1. Stack de despliegue

```mermaid
flowchart TB
    U[Usuario] --> CF[Cloudflare<br/>proxy + DNS]
    CF --> TR[Traefik<br/>reverse proxy]
    TR --> SW[Docker Swarm]
    subgraph SW["Hostinger VPS — Docker Swarm (EasyPanel)"]
        APP[Contenedor Next.js<br/>usuario no-root 'nextjs']
    end
    APP --> PG[(PostgreSQL 17 + pgvector<br/>contigo-pgdb)]
    APP --> R2A[Cloudflare R2<br/>contigo-assets · público/CDN]
    APP --> R2Q[Cloudflare R2<br/>contigo-quotes · privado]
    APP --> RS[Resend<br/>updates.contigoconstructions.com.au]
    APP --> OA[OpenAI API<br/>embeddings]
```

- **Plataforma:** EasyPanel sobre VPS Hostinger, orquestado con Docker Swarm.
- **Proxy:** Traefik como reverse proxy interno; Cloudflare como proxy/CDN/DNS externo.
- **Build:** imagen Docker multi-stage (`Dockerfile`) — build con `node:20-alpine`, runtime con usuario no-root `nextjs` (uid 1001), `dumb-init` como PID 1 para manejo correcto de señales.
- **Nombres de contenedor:** cambian en cada reinicio de Swarm — **siempre re-consultar con `docker ps`** antes de operar, no asumir nombres de sesiones anteriores.
- **CI/CD:** no existe pipeline automatizado (`.github/workflows` no existe en el repo). El despliegue es manual/gestionado vía panel de EasyPanel al hacer push a `main`.

---

## 2. Variables de entorno

| Variable | Propósito | Notas |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | Formato `postgresql://user:pass@host:port/db?sslmode=disable`. En EasyPanel usar host interno (`platforms_contigo-pgdb:5432`), en local el host externo |
| `NEXTAUTH_SECRET` | Firma de sesión JWT | Mínimo 32 caracteres aleatorios |
| `NEXTAUTH_URL` | URL pública del sitio | Requerido por NextAuth v5 |
| `RESEND_API_KEY` | Autenticación con Resend | — |
| `RESEND_FROM_EMAIL` | Remitente de correos transaccionales | **Debe usar el subdominio verificado** `noreply@updates.contigoconstructions.com.au`. Usar el dominio raíz (`@contigoconstructions.com.au`) rompe la entrega de correo |
| `OPENAI_API_KEY` | Generación de embeddings | Opcional en funcionamiento actual (write-path); requerido si se activa el read-path de recomendaciones |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Credenciales Cloudflare R2 | Token con permiso Object Read & Write sobre ambos buckets |
| `R2_ASSETS_BUCKET` / `R2_QUOTES_BUCKET` | Nombres de bucket | `contigo-assets` (público), `contigo-quotes` (privado) |
| `NEXT_PUBLIC_ASSETS_URL` | Dominio público del CDN de assets | `https://assets.contigoconstructions.com.au` |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio | Usado en metadata/SEO/Open Graph |
| `ADMIN_EMAIL` | Email del admin inicial | Usado por el script de seed |

> **Nota de seguridad:** el `.env.example` del repo trae el `R2_ACCOUNT_ID` real como valor de ejemplo (no es secreto por sí solo, pero se recomienda reemplazarlo por un placeholder genérico en una limpieza posterior).

---

## 3. Storage — Cloudflare R2

| Bucket | Visibilidad | Uso |
|---|---|---|
| `contigo-assets` | Público (vía CDN `assets.contigoconstructions.com.au`) | Imágenes de proyectos, servicios, hero, media library |
| `contigo-quotes` | Privado (presigned URLs con expiración) | Documentos/adjuntos de cotizaciones, tareas y leads (PDFs de presupuesto, fotos de referencia, adjuntos de cliente) |

Acceso vía `R2StorageService` (`src/infrastructure/services/R2StorageService.ts`), compatible con API S3. No hay límite de tamaño de archivo aplicado a nivel de servidor — a evaluar si se requiere un tope (ver Doc 06).

---

## 4. Email — Resend

- Remitente configurado sobre el **subdominio verificado** `updates.contigoconstructions.com.au` (no el dominio raíz — evita fallos de entrega y protege la reputación del dominio principal).
- `reply-to` configurado por separado del remitente.
- Disparadores actuales: confirmación de solicitud de cotización, notificación de presupuesto listo, notificación de mensaje nuevo (a cliente y a staff).

---

## 5. Base de datos — operación

| Tarea | Comando |
|---|---|
| Aplicar cambios de esquema (dev) | `npm run db:push` |
| Aplicar migraciones versionadas (prod) | `npm run db:migrate` |
| Explorador visual | `npm run db:studio` |
| Test de conexión | `npm run db:test` |
| Setup inicial (extensión pgvector + push) | `npm run db:setup` |
| Seed de admin (dev) | `npm run seed` |
| Seed de portafolio (dev) | `npm run seed:portfolio` |

**Seed de producción:** `entrypoint.sh` ejecuta `scripts/seed-admin-prod.mjs` en cada arranque del contenedor si `DATABASE_URL` está presente. Post-hardening, este script debe:
1. Insertar el usuario admin solo si la tabla está vacía (`ON CONFLICT DO NOTHING` ya presente), **sin contraseña fija hardcodeada** — reemplazado por flujo de invitación por token.
2. **Verificar en el primer despliegue post-entrega** que efectivamente ya no imprime ni asigna la contraseña `admin123` en logs ni en base de datos.

> Este es el punto de verificación más crítico de toda la entrega — ver Doc 06, "Verificaciones pendientes antes de dar por cerrado el hardening".

---

## 6. Docker

**Dockerfile (multi-stage):**
1. **Builder:** `node:20-alpine`, copia `package*.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.js`, `postcss.config.js`, instala con `npm ci`, copia `src`/`app`/`public`, corre `npm run build`.
2. **Runtime:** imagen limpia `node:20-alpine` + `dumb-init`, usuario no-root `nextjs` (uid 1001) creado **antes** de copiar archivos (para que el `chown` aplique correctamente), `npm ci --omit=dev`, copia `.next`, `public`, `scripts`, `src`, `entrypoint.sh` con propiedad de `nextjs`, crea `/app/.next/cache/images` con permisos correctos.
3. `ENTRYPOINT ["dumb-init", "--"]` + `CMD ["/app/entrypoint.sh"]`.

**docker-compose.yml (solo desarrollo local):** levanta `postgres` (imagen `pgvector/pgvector:pg16-latest`) + `app` con hot-reload (`npm run dev`), credenciales de desarrollo fijas (no usar en producción).

---

## 7. Cloudflare — configuración recomendada

- **Rate limiting (plan Free = 1 regla):** combinar en una sola regla los endpoints `/api/quote-status/**` y `/api/quotes` con un límite de **3 solicitudes / 10 segundos / Bloqueo**, para conservar el único slot de regla disponible en el plan gratuito.
- Proxy activo delante de Traefik para TLS, cacheo de assets estáticos y protección DDoS básica.

---

## 8. Runbook — incidentes conocidos

### Caso documentado: error 524 en producción (loop infinito)

**Síntoma:** timeout 524 de Cloudflare, logs de arranque limpios (sin excepción visible).
**Causa raíz confirmada:** loop infinito en `getServiceRowDuplicationCount` cuando `itemCount === 0`.
**Método de diagnóstico aplicado:** eliminación sistemática de hipótesis falsas antes de tocar código — no se asumió causa sin evidencia directa en el flujo de ejecución real.
**Lección operativa:** ante fallos silenciosos con logs limpios, sospechar de loops o funciones recursivas sin caso base, no solo de excepciones no capturadas.

### Checklist de troubleshooting general

1. `docker ps` — confirmar nombre real del contenedor (cambia en cada reinicio de Swarm).
2. Revisar logs del contenedor de la app y de Postgres por separado.
3. Verificar `DATABASE_URL` resuelve al host correcto (interno vs externo según el entorno).
4. Confirmar que `RESEND_FROM_EMAIL` sigue apuntando al subdominio verificado (un cambio accidental rompe todos los correos transaccionales sin error visible en la app).
5. Si hay fallas de carga de imágenes, verificar credenciales R2 y que el bucket correcto (`assets` vs `quotes`) sea el que corresponde a la operación.

---

## 9. Dónde se modifica

| Necesidad | Ubicación |
|---|---|
| Variables de entorno de referencia | `.env.example` (plantilla — los valores reales se configuran en el panel de EasyPanel, nunca se comitean) |
| Proceso de build/runtime del contenedor | `Dockerfile` |
| Entorno de desarrollo local con DB | `docker-compose.yml` |
| Script de arranque en producción | `entrypoint.sh` → `scripts/seed-admin-prod.mjs` |
| Configuración de Drizzle | `drizzle.config.ts` |



# 05 — Módulos Funcionales
**Contigo Constructions Platform · Entrega v1.0**

Este documento es la referencia de **"¿dónde toco esto?"**. Cada módulo lista: qué hace, la ruta de página, los componentes de presentación, el/los endpoints y el/los casos de uso o repositorios involucrados.

---

## 1. Sitio de Marketing (público)

**Qué es:** landing principal — hero, servicios, proyectos destacados, propuesta de valor, contacto.

| Capa | Ubicación |
|---|---|
| Ruta | `app/(marketing)/` |
| Secciones | `src/presentation/sections/HeroSection.tsx`, `ServicesSection.tsx`, `ProjectsSection.tsx`, `BrandPromiseSection.tsx`, `CoreValuesSection.tsx`, `MissionVisionSection.tsx`, `MasterBuildersSection.tsx`, `ValuePropositionBand.tsx`, `ContactSection.tsx`, `Footer.tsx`, `BrandBar.tsx` |
| Datos dinámicos | `GET /api/projects/featured`, `GET /api/categories/tree`, hero desde `hero_config` |
| Modificar copy/orden de secciones | Directamente en los componentes de `src/presentation/sections/` |
| Modificar el hero desde el admin | `/admin/hero` → `PUT /api/admin/hero-config` |

## 2. Portafolio público

**Qué es:** listado y detalle de proyectos ejecutados, y páginas de servicio individuales.

| Capa | Ubicación |
|---|---|
| Ruta | `app/(portfolio)/about/`, `app/(portfolio)/projects/[slug]/`, `app/(portfolio)/services/[category]/[item]/` |
| Datos | Tablas `projects`, `services`, `categories` (dominio Catálogo) |
| Modificar contenido de un proyecto | `/admin/projects/[id]/edit` → `PATCH /api/admin/projects/[id]` |
| Modificar contenido de un servicio (incluye page builder de bloques) | `/admin/services/[id]/builder` → `services.page_blocks` (JSON) |

## 3. Formulario de cotización → Lead automático

**Qué es:** el punto de entrada de todo el CRM. Un envío de formulario público crea `quote` + `lead` en la misma transacción lógica.

| Capa | Ubicación |
|---|---|
| Formulario público | `src/presentation/components/forms/` |
| Endpoint | `POST /api/quotes` |
| Casos de uso | `CreateQuoteUseCase`, `CreateLeadForQuoteUseCase` |
| Repositorios | `DrizzleQuoteRepository`, `DrizzleLeadRepository` |
| Formulario editable visualmente | `/admin/leads/management/form-builder/[slug]/builder` (persiste en `form_versions`) |

## 4. Panel de seguimiento del cliente (`/quote-status/[token]`)

**Qué es:** página sin login, accesible por un `trackingToken` (UUID), donde el cliente ve estado, descarga documentos y conversa con el staff.

| Capa | Ubicación |
|---|---|
| Página | `app/quote-status/[token]/` |
| Componentes | `src/presentation/components/portal/` |
| Casos de uso | `GetTrackingPanelDataUseCase`, `GetLeadClientStageUseCase`, `PostClientMessageUseCase`, `GetLeadNotificationFeedUseCase` |
| Endpoints | Ver Doc 03 §2 (bloque `/api/quote-status/[token]/**`) |
| Agregar una nueva categoría de documento descargable | `lead_document_category` en `schema.ts` + lógica de visibilidad en el use case del portal |

## 5. CRM de Leads (Kanban + detalle)

**Qué es:** el núcleo operativo del admin — pipeline visual, ficha de cliente con pestañas (contactos, documentos, notas, eventos, mensajes, tareas, timeline).

| Capa | Ubicación |
|---|---|
| Ruta | `app/admin/(protected)/leads/`, `app/admin/(protected)/leads/[id]/` |
| Componentes | `src/presentation/components/admin/` (buscar por sub-carpeta de leads/kanban) |
| Casos de uso | 25 en `src/application/use-cases/leads/` (ver Doc 01 §3) |
| Etapas del pipeline | `/admin/leads` (drag del Kanban) → `POST /api/admin/pipeline-stages/reorder`; gestión de etapas en `PipelineStage` entity |
| Agregar una nueva etapa fija de negocio (ej. `site_visit_scheduled`, `negotiation`) | Insertar fila en `pipeline_stages` — **no requiere migración de schema**, es dato, no enum |
| Timeline/auditoría automática | `lead_activities` — cualquier caso de uso que cambie estado relevante debe insertar una fila de este tipo |

## 6. Tareas (Tasks)

**Qué es:** checklist operativo por lead, con comentarios y adjuntos — funciona como un mini project-manager por cliente.

| Capa | Ubicación |
|---|---|
| Ruta | dentro del detalle de lead, pestaña Tasks |
| Casos de uso | 13 en `src/application/use-cases/tasks/` |
| Endpoints | Ver Doc 03 §3 |
| Adjuntos | Presigned vía `POST .../tasks/presign` → bucket `contigo-quotes` |

## 7. Staff y permisos (RBAC)

**Qué es:** gestión de usuarios internos con roles `owner`/`staff` y permisos granulares.

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/leads/management/staff` |
| Casos de uso | `CreateStaffUserUseCase`, `UpdateStaffUserUseCase`, `SetStaffPermissionsUseCase`, `DeactivateStaffUserUseCase` |
| Tablas | `admin_users`, `permissions`, `staff_user_permissions` |
| Agregar un permiso nuevo | Insertar en el catálogo `permissions` (tabla) + verificar su `key` en el punto del código donde se protege la acción correspondiente |

## 8. Form Builder

**Qué es:** editor visual tipo Webflow para el formulario de "Request a Quote" (y formularios futuros), con versionado inmutable.

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/leads/management/form-builder/[slug]/builder` |
| Tablas | `forms`, `form_versions` (cada guardado crea una versión nueva) |
| Endpoints | `/api/admin/forms/**` (ver Doc 03) |
| Revertir a una versión anterior | `POST /api/admin/forms/[slug]/versions/[versionId]/revert` |

## 9. Media Library

**Qué es:** gestor de archivos con carpetas, etiquetas y metadata técnica, compartido entre Portfolio, Services, Hero y adjuntos de Leads/Tasks.

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/media` |
| Tablas | `media_folders`, `media_tags`, `media_metadata` |
| Endpoints | `/api/admin/media/**` |
| Storage físico | Bucket R2 `contigo-assets` |
| Servicio de referencias cruzadas | `MediaReferenceService` |

## 10. Configuración de Hero (home)

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/hero` |
| Tabla | `hero_config` (fila única/singleton) |
| Endpoint | `GET/PUT /api/admin/hero-config` |

## 11. Categorías (taxonomía)

**Qué es:** los 4 rubros aprobados por Anamaria (Carpentry, Cladding, Gyprock Fixing & Flushing, Additional Services) y su jerarquía.

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/categories` |
| Tabla | `categories` (auto-referencial vía `parent_id`) |
| Regla de negocio | Las categorías desactivadas se **soft-eliminan** (`trashed_at`), nunca se borran físicamente — la lista de Anamaria es la fuente de verdad definitiva |

## 12. Realtime (transversal)

**Qué es:** capa de notificaciones en vivo que conecta el panel de cliente y el admin sin polling.

| Capa | Ubicación |
|---|---|
| Implementación | `src/infrastructure/realtime/createSSEStream.ts` |
| Consumidores | Todos los endpoints `/stream` (mensajes, notificaciones, estado, agenda) tanto en `/api/admin/**` como en `/api/quote-status/[token]/**` |

## 13. Autenticación / Sesión admin

| Capa | Ubicación |
|---|---|
| Config | `src/infrastructure/auth/auth.config.ts` |
| Middleware | `middleware.ts` (matcher `/admin/:path*`) |
| Página de login | `app/admin/login/` |
| Ver Doc 01 §5 y Doc 06 para el detalle del hardening aplicado |

---

## 14. Providers de la capa de presentación (transversales a todo el sitio público)

| Provider | Función |
|---|---|
| `AdminRealtimeProvider.tsx` | Contexto de notificaciones en vivo dentro del admin |
| `LenisProvider.tsx` | Wrapper de scroll suave (nombre heredado — verificar si aún usa Lenis o si requiere renombrado, ver Doc 06) |
| `LogoMorphProvider.tsx` | Animación de transformación del logo en scroll |



# 05 — Módulos Funcionales
**Contigo Constructions Platform · Entrega v1.0**

Este documento es la referencia de **"¿dónde toco esto?"**. Cada módulo lista: qué hace, la ruta de página, los componentes de presentación, el/los endpoints y el/los casos de uso o repositorios involucrados.

---

## 1. Sitio de Marketing (público)

**Qué es:** landing principal — hero, servicios, proyectos destacados, propuesta de valor, contacto.

| Capa | Ubicación |
|---|---|
| Ruta | `app/(marketing)/` |
| Secciones | `src/presentation/sections/HeroSection.tsx`, `ServicesSection.tsx`, `ProjectsSection.tsx`, `BrandPromiseSection.tsx`, `CoreValuesSection.tsx`, `MissionVisionSection.tsx`, `MasterBuildersSection.tsx`, `ValuePropositionBand.tsx`, `ContactSection.tsx`, `Footer.tsx`, `BrandBar.tsx` |
| Datos dinámicos | `GET /api/projects/featured`, `GET /api/categories/tree`, hero desde `hero_config` |
| Modificar copy/orden de secciones | Directamente en los componentes de `src/presentation/sections/` |
| Modificar el hero desde el admin | `/admin/hero` → `PUT /api/admin/hero-config` |

## 2. Portafolio público

**Qué es:** listado y detalle de proyectos ejecutados, y páginas de servicio individuales.

| Capa | Ubicación |
|---|---|
| Ruta | `app/(portfolio)/about/`, `app/(portfolio)/projects/[slug]/`, `app/(portfolio)/services/[category]/[item]/` |
| Datos | Tablas `projects`, `services`, `categories` (dominio Catálogo) |
| Modificar contenido de un proyecto | `/admin/projects/[id]/edit` → `PATCH /api/admin/projects/[id]` |
| Modificar contenido de un servicio (incluye page builder de bloques) | `/admin/services/[id]/builder` → `services.page_blocks` (JSON) |

## 3. Formulario de cotización → Lead automático

**Qué es:** el punto de entrada de todo el CRM. Un envío de formulario público crea `quote` + `lead` en la misma transacción lógica.

| Capa | Ubicación |
|---|---|
| Formulario público | `src/presentation/components/forms/` |
| Endpoint | `POST /api/quotes` |
| Casos de uso | `CreateQuoteUseCase`, `CreateLeadForQuoteUseCase` |
| Repositorios | `DrizzleQuoteRepository`, `DrizzleLeadRepository` |
| Formulario editable visualmente | `/admin/leads/management/form-builder/[slug]/builder` (persiste en `form_versions`) |

## 4. Panel de seguimiento del cliente (`/quote-status/[token]`)

**Qué es:** página sin login, accesible por un `trackingToken` (UUID), donde el cliente ve estado, descarga documentos y conversa con el staff.

| Capa | Ubicación |
|---|---|
| Página | `app/quote-status/[token]/` |
| Componentes | `src/presentation/components/portal/` |
| Casos de uso | `GetTrackingPanelDataUseCase`, `GetLeadClientStageUseCase`, `PostClientMessageUseCase`, `GetLeadNotificationFeedUseCase` |
| Endpoints | Ver Doc 03 §2 (bloque `/api/quote-status/[token]/**`) |
| Agregar una nueva categoría de documento descargable | `lead_document_category` en `schema.ts` + lógica de visibilidad en el use case del portal |

## 5. CRM de Leads (Kanban + detalle)

**Qué es:** el núcleo operativo del admin — pipeline visual, ficha de cliente con pestañas (contactos, documentos, notas, eventos, mensajes, tareas, timeline).

| Capa | Ubicación |
|---|---|
| Ruta | `app/admin/(protected)/leads/`, `app/admin/(protected)/leads/[id]/` |
| Componentes | `src/presentation/components/admin/` (buscar por sub-carpeta de leads/kanban) |
| Casos de uso | 25 en `src/application/use-cases/leads/` (ver Doc 01 §3) |
| Etapas del pipeline | `/admin/leads` (drag del Kanban) → `POST /api/admin/pipeline-stages/reorder`; gestión de etapas en `PipelineStage` entity |
| Agregar una nueva etapa fija de negocio (ej. `site_visit_scheduled`, `negotiation`) | Insertar fila en `pipeline_stages` — **no requiere migración de schema**, es dato, no enum |
| Timeline/auditoría automática | `lead_activities` — cualquier caso de uso que cambie estado relevante debe insertar una fila de este tipo |

## 6. Tareas (Tasks)

**Qué es:** checklist operativo por lead, con comentarios y adjuntos — funciona como un mini project-manager por cliente.

| Capa | Ubicación |
|---|---|
| Ruta | dentro del detalle de lead, pestaña Tasks |
| Casos de uso | 13 en `src/application/use-cases/tasks/` |
| Endpoints | Ver Doc 03 §3 |
| Adjuntos | Presigned vía `POST .../tasks/presign` → bucket `contigo-quotes` |

## 7. Staff y permisos (RBAC)

**Qué es:** gestión de usuarios internos con roles `owner`/`staff` y permisos granulares.

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/leads/management/staff` |
| Casos de uso | `CreateStaffUserUseCase`, `UpdateStaffUserUseCase`, `SetStaffPermissionsUseCase`, `DeactivateStaffUserUseCase` |
| Tablas | `admin_users`, `permissions`, `staff_user_permissions` |
| Agregar un permiso nuevo | Insertar en el catálogo `permissions` (tabla) + verificar su `key` en el punto del código donde se protege la acción correspondiente |

## 8. Form Builder

**Qué es:** editor visual tipo Webflow para el formulario de "Request a Quote" (y formularios futuros), con versionado inmutable.

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/leads/management/form-builder/[slug]/builder` |
| Tablas | `forms`, `form_versions` (cada guardado crea una versión nueva) |
| Endpoints | `/api/admin/forms/**` (ver Doc 03) |
| Revertir a una versión anterior | `POST /api/admin/forms/[slug]/versions/[versionId]/revert` |

## 9. Media Library

**Qué es:** gestor de archivos con carpetas, etiquetas y metadata técnica, compartido entre Portfolio, Services, Hero y adjuntos de Leads/Tasks.

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/media` |
| Tablas | `media_folders`, `media_tags`, `media_metadata` |
| Endpoints | `/api/admin/media/**` |
| Storage físico | Bucket R2 `contigo-assets` |
| Servicio de referencias cruzadas | `MediaReferenceService` |

## 10. Configuración de Hero (home)

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/hero` |
| Tabla | `hero_config` (fila única/singleton) |
| Endpoint | `GET/PUT /api/admin/hero-config` |

## 11. Categorías (taxonomía)

**Qué es:** los 4 rubros aprobados por Anamaria (Carpentry, Cladding, Gyprock Fixing & Flushing, Additional Services) y su jerarquía.

| Capa | Ubicación |
|---|---|
| Ruta | `/admin/categories` |
| Tabla | `categories` (auto-referencial vía `parent_id`) |
| Regla de negocio | Las categorías desactivadas se **soft-eliminan** (`trashed_at`), nunca se borran físicamente — la lista de Anamaria es la fuente de verdad definitiva |

## 12. Realtime (transversal)

**Qué es:** capa de notificaciones en vivo que conecta el panel de cliente y el admin sin polling.

| Capa | Ubicación |
|---|---|
| Implementación | `src/infrastructure/realtime/createSSEStream.ts` |
| Consumidores | Todos los endpoints `/stream` (mensajes, notificaciones, estado, agenda) tanto en `/api/admin/**` como en `/api/quote-status/[token]/**` |

## 13. Autenticación / Sesión admin

| Capa | Ubicación |
|---|---|
| Config | `src/infrastructure/auth/auth.config.ts` |
| Middleware | `middleware.ts` (matcher `/admin/:path*`) |
| Página de login | `app/admin/login/` |
| Ver Doc 01 §5 y Doc 06 para el detalle del hardening aplicado |

---

## 14. Providers de la capa de presentación (transversales a todo el sitio público)

| Provider | Función |
|---|---|
| `AdminRealtimeProvider.tsx` | Contexto de notificaciones en vivo dentro del admin |
| `LenisProvider.tsx` | Wrapper de scroll suave (nombre heredado — verificar si aún usa Lenis o si requiere renombrado, ver Doc 06) |
| `LogoMorphProvider.tsx` | Animación de transformación del logo en scroll |



# 06 — Mantenibilidad y Escalamiento
**Contigo Constructions Platform · Entrega v1.0**

---

## 1. Verificaciones pendientes antes de dar por cerrado el hardening de seguridad

Esta entrega documenta el sistema **asumiendo completo** el work order `2026-07-04-auth-hardening-admin-staff.md`. Al momento de generar este documento (2026-07-05), ese merge **aún no estaba reflejado en `main`** en el commit de corte revisado (`97d32f7`). Antes de considerar cerrado este punto, verificar en código —no solo en el work order— que:

- [ ] `entrypoint.sh` / `scripts/seed-admin-prod.mjs` ya **no** asigna la contraseña fija `admin123` en cada arranque.
- [ ] Existe flujo de invitación de staff por token de un solo uso (reemplaza alta directa con password temporal).
- [ ] Existe forgot-password con tokens hasheados de un solo uso.
- [ ] Existe `sessionVersion` (o campo equivalente) para invalidar JWTs activos al cambiar contraseña.
- [ ] Existe lockout por intentos fallidos con tiempos de respuesta uniformes.
- [ ] El costo de bcrypt fue incrementado, con rehash transparente al siguiente login exitoso.
- [ ] `maxAge` de sesión/JWT fue reducido (documentado hoy en 7 días).
- [ ] La cobertura de `middleware.ts` fue extendida a `/api/admin/**` (hoy el matcher cubre solo `/admin/:path*`; los handlers de API validan `auth()` in-handler como capa independiente — confirmar que ambas capas coexisten según lo planeado, no que una reemplazó a la otra).
- [ ] Existe una tabla/registro de auditoría de eventos de seguridad (logins, bloqueos, cambios de permisos).

**Este bloque es, en la práctica, el criterio de aceptación real de la Fase 1 del plan de entrega** (ver Plan Maestro).

---

## 2. Deuda técnica confirmada en el código (independiente del hardening)

| # | Hallazgo | Riesgo | Acción recomendada |
|---|---|---|---|
| 1 | Rutas de Catálogo (`projects`, `services`, `categories`) y de `media`/`change-password` acceden directo a Drizzle o `db` crudo, sin caso de uso ni Zod en la mayoría de los casos | Medio-Alto — calidad de datos, inconsistencia con el resto del sistema | Crear `IProjectRepository`/`IServiceRepository` + casos de uso + validación Zod, replicando el patrón ya validado en Leads/Quotes |
| 2 | `eslint.config.js` ignora globalmente `src/components/**`, `src/hooks/**`, `src/presentation/components/**`, `src/presentation/hooks/**` | Medio — la mayor parte del árbol de UI nunca se lintea | Remover las exclusiones progresivamente, empezando por los componentes nuevos |
| 3 | `scripts/setup-pgvector.mjs` vs `scripts/setup-pgvector.ts` — nombres casi idénticos, comportamiento opuesto | Bajo (confusión operativa, no bug activo) | Renombrar o consolidar en un solo script |
| 4 | Migraciones huérfanas `0000_init_pgvector.sql`, `0001_hierarchical_categories.sql` fuera del journal de Drizzle | Bajo | Archivar en carpeta histórica (no borrar) tras confirmar que ningún entorno depende de ellas |
| 5 | Sin tests automatizados, sin CI/CD | Alto a mediano plazo — todo el control de calidad depende de revisión manual | Diferido a anexo de segunda sesión, según lo acordado |
| 6 | `.env.example` expone el `R2_ACCOUNT_ID` real como valor de ejemplo | Bajo | Reemplazar por placeholder genérico |
| 7 | `LenisProvider.tsx` ya no usa la librería Lenis (nombre heredado) | Bajo (confusión de mantenimiento) | Renombrar o restaurar el uso real de la librería |
| 8 | No hay índices vectoriales (`ivfflat`/`hnsw`) sobre `description_vector` | Bajo hoy (read-path no activo) — bloqueante si se activa pgvector search | Agregar antes de habilitar recomendaciones semánticas en producción |
| 9 | Sin límite de tamaño de archivo aplicado server-side en subidas a R2 | Medio | Definir tope razonable por tipo de adjunto (fotos vs PDFs) |

> Este documento no repite el detalle completo de la auditoría del 24-jun-2026 (`AUDIT_REPORT_2026-06-24.md`, ya en poder del equipo); lo resume y lo actualiza a la fecha de esta entrega.

---

## 3. Cómo extender el sistema (guías rápidas)

### Agregar una entidad de dominio nueva (siguiendo el patrón correcto — Leads/Tasks)

1. Definir la tabla en `src/infrastructure/db/schema.ts`.
2. Crear la entidad en `src/core/entities/`.
3. Definir la interfaz en `src/core/repositories/I<Entidad>Repository.ts`.
4. Implementarla en `src/infrastructure/repositories/Drizzle<Entidad>Repository.ts`.
5. Crear el/los casos de uso en `src/application/use-cases/<dominio>/`.
6. Exponer el endpoint en `app/api/.../route.ts`, validando con Zod y llamando al caso de uso — **no** al repositorio directamente.
7. Si la entidad requiere UI en el admin, agregar la ruta bajo `app/admin/(protected)/` y sus componentes en `src/presentation/components/admin/`.

### Agregar una etapa nueva al pipeline de Leads

No requiere migración ni deploy: insertar una fila en `pipeline_stages` (vía `POST /api/admin/pipeline-stages` o directamente en la UI del Kanban). Es la ventaja de haber migrado ese campo de enum a tabla.

### Agregar un permiso granular nuevo

Insertar la fila en el catálogo `permissions`, y envolver la acción protegida con la verificación de esa `key` en el punto donde corresponda (patrón ya usado por el resto de permisos existentes).

---

## 4. Escalamiento

| Dimensión | Estado actual | Consideración a futuro |
|---|---|---|
| Aplicación | Contenedor único en Docker Swarm | Swarm permite escalar réplicas del mismo servicio; verificar que sesiones (JWT stateless) y SSE sean compatibles con múltiples réplicas detrás de Traefik (afinidad de sesión para SSE) |
| Base de datos | Instancia única PostgreSQL | Sin réplicas de lectura aún; suficiente para el volumen actual de leads/proyectos. Reevaluar si el volumen de leads crece significativamente |
| Storage | R2 (object storage, escalamiento nativo) | Sin acción requerida |
| Rate limiting | 1 regla combinada en Cloudflare (plan Free) | Si se necesitan reglas más granulares, requiere upgrade de plan Cloudflare |
| Búsqueda semántica | pgvector instalado, write-path activo, read-path no habilitado | Ver roadmap comercial (§5) — activar cuando el volumen de portafolio lo justifique |

---

## 5. Roadmap recomendado (orientado a valor de negocio)

En lugar de priorizar únicamente ítems técnicos, se recomienda un roadmap de **Fase 2** centrado en lo que más impacto tiene para la operación diaria de Contigo:

### 5.1 Integración con Xero

Conectar el módulo de Leads/Quotes con Xero para automatizar la facturación:
- Al marcar un lead como `won` (ganado), generar automáticamente un borrador de factura/cotización en Xero con los datos del cliente ya capturados (`lead_contacts`, `estimated_value`).
- Sincronizar el estado de pago desde Xero de vuelta al CRM (ej. badge "Pagado" visible en el detalle del lead).
- Requiere: cuenta de desarrollador Xero, OAuth2, y un nuevo `IInvoicingRepository` siguiendo el mismo patrón de Clean Architecture ya validado en el resto del sistema.

### 5.2 Evolución del CRM hacia un gestor de operaciones por cliente

El módulo de Tasks ya sienta las bases (checklist, comentarios, adjuntos, asignación) para evolucionar de "seguimiento de venta" a **project manager especializado en construcción/carpintería** que acompañe la ejecución real de cada proyecto ganado, no solo la etapa comercial:

- Plantillas de checklist por tipo de servicio (ej. una plantilla estándar de tareas para "Cladding" vs "Gyprock").
- Vinculación de `lead_events` con hitos de obra (no solo llamadas/visitas comerciales, sino inspecciones, entregas de material, etc.).
- Vista de calendario/timeline de obra por proyecto ganado, reutilizando la infraestructura SSE ya existente.
- Reportes de avance exportables (aprovechando el patrón de generación de documentos ya usado en las entregas de zipnegocios).

### 5.3 Deuda técnica priorizada para acompañar el crecimiento

- Cerrar la brecha arquitectónica del dominio Catálogo (ítem 1 de §2) **antes** de construir la integración con Xero sobre esa base, para no heredar el mismo atajo estructural en un módulo financiero.
- Introducir tests automatizados como anexo de segunda sesión (ya acordado), priorizando el flujo de creación de lead → cambio de etapa → cierre, por ser el camino crítico de negocio.

### 5.4 Ítems técnicos diferidos (no priorizados comercialmente, pero documentados)

2FA para el admin, Content-Security-Policy, índices vectoriales para búsqueda semántica activa, carrusel GSAP de servicios (spec ya escrita en `docs/temporal-service-cards/carrusel-servicios-contigo-constructions.md`). Se mantienen documentados para no perder el trabajo de especificación ya invertido, pero no forman parte de la propuesta comercial de Fase 2.

---

## 6. Dónde se modifica

| Necesidad | Ubicación |
|---|---|
| Confirmar estado real del hardening | Revisar `git log` de `main` post-fecha de esta entrega + código listado en §1 |
| Ejecutar la auditoría base de referencia | `AUDIT_REPORT_2026-06-24.md` (raíz del repo) |
| Historial de work orders ejecutados | `docs/superpowers/plans/`, `docs/superpowers/reports/` |



# 07 — Inventario de Artefactos
**Contigo Constructions Platform · Entrega v1.0**

> Este documento lista **dónde vive** cada artefacto, cuenta y credencial del proyecto — **sin valores**. Gustavo Amarista completa los valores reales en un anexo privado separado antes del traspaso formal de accesos.

---

## 1. Código fuente

| Artefacto | Ubicación | Notas |
|---|---|---|
| Repositorio principal | `github.com/zipnegocios/contigo-platform` | Rama de producción: `main` |
| Rama activa de desarrollo | `main` | `alpha` fue una rama de trabajo ya obsoleta — confirmar si aún existe y si debe eliminarse |

## 2. Dominios y DNS

| Dominio/Subdominio | Uso |
|---|---|
| `contigoconstructions.com.au` | Dominio principal — sitio público |
| `assets.contigoconstructions.com.au` | CDN de assets (bucket R2 `contigo-assets`) |
| `updates.contigoconstructions.com.au` | Subdominio verificado para envío de correo transaccional (Resend) |
| DNS gestionado en | Cloudflare |

## 3. Hosting / Infraestructura

| Servicio | Uso | Cuenta bajo |
|---|---|---|
| Hostinger VPS | Servidor físico/virtual base | ______ (completar) |
| EasyPanel | Panel de gestión de Docker Swarm / despliegue | ______ (completar) |
| Traefik | Reverse proxy interno (viene con EasyPanel, no requiere cuenta propia) | — |
| Cloudflare | DNS, proxy, CDN, rate limiting | ______ (completar) |

## 4. Base de datos

| Artefacto | Notas |
|---|---|
| Instancia PostgreSQL 17 + pgvector | Nombre de contenedor variable en cada reinicio de Swarm — consultar con `docker ps` |
| Nombre de base de datos | `contigo-db` (producción) |
| Backups | ______ (completar — confirmar si EasyPanel gestiona backups automáticos o si se requiere configurar uno externo) |

## 5. Storage — Cloudflare R2

| Bucket | Visibilidad | Cuenta R2 |
|---|---|---|
| `contigo-assets` | Público (CDN) | Account ID: ver `.env` real, no en este documento |
| `contigo-quotes` | Privado (presigned) | Mismo account que arriba |
| Token API R2 | Object Read & Write sobre ambos buckets | ______ (completar quién lo generó y dónde está almacenado) |

## 6. Email — Resend

| Artefacto | Notas |
|---|---|
| Cuenta Resend | ______ (completar) |
| API Key | Almacenada en variable de entorno `RESEND_API_KEY` del panel EasyPanel |
| Dominio verificado | `updates.contigoconstructions.com.au` |

## 7. IA / Embeddings

| Artefacto | Notas |
|---|---|
| Cuenta OpenAI | ______ (completar) |
| API Key | `OPENAI_API_KEY` — usada actualmente solo en write-path de embeddings |

## 8. Autenticación de la aplicación

| Artefacto | Notas |
|---|---|
| `NEXTAUTH_SECRET` | Generado aleatoriamente, único por entorno (dev ≠ prod) |
| Usuario admin inicial | Creado por `seed-admin-prod.mjs` — confirmar post-hardening que ya no usa contraseña fija |

## 9. Variables de entorno — ubicación de configuración real

Todas las variables listadas en el Doc 04 §2 se configuran **directamente en el panel de EasyPanel** para el entorno de producción. El archivo `.env.example` en el repo es solo plantilla de referencia — **nunca debe contener valores reales**.

## 10. Documentación y planes de trabajo (ya en el repo)

| Documento | Ubicación |
|---|---|
| Auditoría técnica base | `AUDIT_REPORT_2026-06-24.md` |
| Instrucciones para Claude Code | `CLAUDE.md` |
| Manuales de "Request a Quote" | `Documentation/` |
| Planes de trabajo ejecutados (work orders) | `docs/superpowers/plans/` |
| Especificaciones de diseño técnico | `docs/superpowers/specs/` |
| Reportes de cierre de fase | `docs/superpowers/reports/` |
| Sistema de diseño (tokens, componentes, motion) | `docs/design-system/` |

## 11. Activos de marca

| Artefacto | Valor |
|---|---|
| Colores | Gold `#E2C063` / `#B8962E`, petrol blue `#0D3C4C`, neutral dark `#1D1D1B`, ivory `#FAF6F0` |
| Tipografía | Alegreya (display), Alegreya Sans (body), Space Grotesk (datos numéricos) |

## 12. Contactos del proyecto

| Rol | Persona |
|---|---|
| Representante del negocio (cliente) | Anamaria Osorio, Daniel Osorio |
| Desarrollo / consultoría | Gustavo Amarista, Johanaly Ramírez (zipnegocios) |

---

**Instrucción de manejo:** este documento es seguro para compartir externamente tal como está (no contiene secretos). El anexo privado con valores reales de credenciales debe transmitirse por un canal separado y seguro (gestor de contraseñas compartido, no email ni chat).
