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
