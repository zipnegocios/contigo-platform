# Auditoría Técnica Forense — Contigo Platform
**Fecha:** 2026-06-24 · **Rama:** main · **Alcance:** repo completo (`app/`, `src/`, `scripts/`, config, infra, esquema DB)
**Método:** lectura directa de código/config/migraciones + grep exhaustivo de uso real. Cero suposiciones — cada hallazgo cita archivo:línea. No se ejecutó ninguna query contra una base de datos viva ni se modificó código (excepto donde se indique).

> Nota de manejo: este archivo no ha sido añadido a git. Contiene rutas exactas de hallazgos de seguridad — decide si lo conservas localmente, lo mueves a un lugar no versionado, o lo commiteas a propósito.

---

## 0. Hallazgo crítico ya reportado y en remediación

🔴 **`/.claude/archive/2026-06/DATABASE-SETUP.md:102,110`** — connection string completa de PostgreSQL de producción (host, puerto, usuario, password) committeada en texto plano, presente en `HEAD` actual (commit `90d99d0`, 2026-06-17). **Acción acordada con el usuario: rotar la contraseña fuera de esta sesión.** Pendiente tras la rotación: limpiar el archivo (reemplazar por placeholders) y considerar purgar el historial de git si se quiere eliminar el rastro.

---

## 1. Executive Summary

**Estado general:** Sistema funcional con dos personalidades arquitectónicas distintas. El dominio CRM/Leads (gestión de leads, tareas, pipeline, staff) está construido con disciplina DDD real: 43 casos de uso, todos invocados, cero código muerto en esa capa. El dominio de Catálogo/CMS (Proyectos, Servicios, Categorías, Media, Formularios) nunca recibió el mismo tratamiento: sin interfaces de repositorio, sin casos de uso, rutas API que llaman a Drizzle directamente o incluso a `db` crudo.

**Nivel de madurez: BETA**, con el subsistema CRM/Leads en un nivel cercano a Producción y el resto del sistema bloqueado por: cobertura de pruebas igual a cero, ausencia total de CI/CD, una credencial de producción expuesta en el repo, y una característica de búsqueda semántica (pgvector) que escribe datos pero nunca los lee.

### Riesgos críticos
1. Credencial de BD de producción committeada (`.claude/archive/2026-06/DATABASE-SETUP.md`) — en remediación.
2. `scripts/seed-admin.ts` crea una cuenta `owner` con contraseña hardcodeada `admin123` e imprime la contraseña en consola; tres scripts distintos repiten esta contraseña, y `seed-admin-prod.mjs` se ejecuta automáticamente en cada arranque de contenedor (`entrypoint.sh`).
3. Cero rate limiting en `/api/quotes` (público, escribe DB + 2 emails + 1 llamada OpenAI por request) y en `/api/upload/quote-attachment` (autodocumentado vía TODO).
4. Cero pruebas automatizadas y cero CI/CD — nada bloquea un commit roto antes de producción.

### Riesgos medios
- Drift de esquema: dos FKs reales en la base (`media_folders.parent_id`, `media_metadata.folder_id`) no declaradas en `schema.ts` → riesgo de que un futuro `drizzle-kit push` las elimine.
- Historial de migraciones desincronizado (dos migraciones huérfanas fuera del journal, un baseline regenerado por introspección).
- Sin throttling de intentos de login (credentials provider).
- `.env.example` filtra un Account ID real de R2 e infraestructura real como si fueran placeholders.
- Inconsistencia de autorización granular: ~20 de 53 rutas admin verifican sesión pero no permisos específicos (`hasPermission`), a diferencia de rutas hermanas que sí lo hacen.

### Riesgos bajos
- 16 componentes >300 líneas (concentrados en `components/admin`), sin memoización en transformaciones de arrays dentro de renders frecuentes (`LeadsKanban.tsx`).
- 47 paquetes desactualizados (10 con cambio mayor disponible), 6 vulnerabilidades npm (todas moderadas, transitivas, dev-only).
- Inconsistencia Next.js 15 en `params` (patrón síncrono vs. `Promise<>`) en 2 páginas.
- `eslint.config.js` ignora globalmente la mayoría del árbol de componentes UI.

### Áreas sólidas
- Las 53 rutas API admin con métodos de escritura tienen verificación de sesión `auth()` dentro del propio handler — verificado archivo por archivo, sin excepciones.
- Cero inyección SQL (sin `sql.raw`, todos los `sql\`...\`` usan literales estáticos).
- Sin secretos hardcodeados tipo API key en código fuente.
- Capa CRM/Leads: arquitectura limpia, entidades con factories, value objects (`Email`, `Phone`), 100% de casos de uso invocados.
- `git ls-files` confirma que ningún `.env`/`.env.local`/credencial está trackeado (aparte del hallazgo crítico ya reportado).

### Áreas críticas
- Dominio Catálogo/CMS sin capa de aplicación ni interfaces de repositorio.
- pgvector / búsqueda semántica: característica fantasma — se escribe, nunca se lee.
- Cero tests, cero CI/CD.
- Higiene de secretos en archivos de documentación interna.

### Recomendación general
No desplegar más contenido del CMS sin antes: (1) rotar la credencial expuesta, (2) verificar/rotar la cuenta `admin123` si el seed corrió alguna vez contra una base real, y (3) añadir rate limiting al endpoint público de cotizaciones. Una vez resuelto eso, el roadmap de las fases 2-5 (abajo) puede ejecutarse sin presión de incidente.

### Scorecard (1-10)

| Dimensión | Score | Justificación breve |
|---|---|---|
| Arquitectura | 6 | CRM impecable; Catálogo sin capa de aplicación ni interfaces — inconsistencia estructural real, no cosmética |
| Calidad de código | 6 | Buen naming/factories; 16 archivos >300 líneas; sin tests; validación Zod inconsistente |
| Escalabilidad | 6 | N+1 confirmados en listados admin; repos sin métodos batch/`findByIds`; volumen actual bajo mitiga el riesgo hoy |
| Seguridad | 4 | Patrones de auth sólidos, pero credencial de prod expuesta + cuenta admin hardcodeada son hallazgos de explotación inmediata, no teóricos |
| Mantenibilidad | 6 | Capas claras donde existen; código muerto y scripts duplicados (`setup-pgvector.mjs` vs `.ts`) restan puntos |
| Rendimiento | 6 | Sin medición de bundle real; 480 líneas de Three.js muerto inflando el bundle; N+1 de bajo volumen hoy |
| Developer Experience | 5 | Sin tests, sin CI, ESLint con blind spots grandes; pero Docker dev funciona y hay script de validación de env |
| Estado de la Base de Datos | 5 | Sin tablas huérfanas; pero drift de FKs no declaradas, índice único no modelado, historial de migraciones reescrito una vez |
| Salud del Repositorio | 4 | Secreto vivo en HEAD, artefacto de nombre de archivo corrupto (en limpieza), código y dependencias muertas, cero red de seguridad de CI |

---

## 2. Arquitectura general del sistema

```
Contigo Platform
├── Frontend público        app/(marketing)/, app/(portfolio)/, app/quote-status/[token]/
├── Dashboard (Admin CMS)    app/admin/(protected)/**  — protegido por layout + middleware
├── Backend / API            app/api/** (88 funciones HTTP en /api/admin/**, todas con auth() in-handler)
├── Dominio                  src/core (entidades/interfaces) → src/application (43 casos de uso) → src/infrastructure (Drizzle/Resend/OpenAI/R2)
├── Base de Datos            PostgreSQL 16 + Drizzle ORM, 24 tablas, pgvector instalado pero no usado en el read-path
├── APIs externas            Resend (email), OpenAI (embeddings, write-only), Cloudflare R2 (storage S3-compatible)
├── Autenticación            NextAuth v5 beta, Credentials provider únicamente (sin OAuth), JWT 7 días
├── Storage                  R2StorageService → presigned URLs (sin límite de tamaño server-side)
└── Infraestructura          Dockerfile + docker-compose (dev) + entrypoint.sh; sin CI/CD; deploy vía EasyPanel (manual/PaaS)
```

**Flujo de datos (dominio CRM, el camino "correcto"):** Route handler → Zod schema → Use Case (instanciado manualmente, sin DI) → Repository interface → Drizzle\*Repository → Postgres. Ejemplo limpio: `app/api/quotes/route.ts` → `CreateQuoteSchema` → `CreateQuoteUseCase`/`CreateLeadForQuoteUseCase` → `IQuoteRepository`/`ILeadRepository` → `DrizzleQuoteRepository`/`DrizzleLeadRepository`.

**Flujo de datos (dominio Catálogo, el camino real observado):** Route handler → (a veces) chequeo manual de presencia → `Drizzle*Repository` directo, o en 5 rutas de media + cambio de contraseña, `db` crudo directo. Sin interfaz, sin caso de uso, sin Zod en la mayoría de los casos.

**Acoplamiento:** bajo entre `src/presentation` y `src/core/src/application` (separación real, sin imports cruzados encontrados). Acoplamiento alto y directo entre `app/api/**` y Drizzle en el dominio Catálogo — el "saltarse capas" es el patrón de acoplamiento más relevante del repo.

---

## 3. Inventario completo del proyecto

| Categoría | Cantidad / Ubicación | Estado | Observaciones |
|---|---|---|---|
| Route groups | `(marketing)`, `(portfolio)`, `admin/`, `admin/(protected)/`, `api/` | OK | Ver tabla completa en §6 |
| Páginas públicas | 7 (`/`, `/about`, `/projects`, `/projects/[slug]`, `/services`, `/services/[slug]`, `/quote-status/[token]`) | OK | Todas con contenido real, sin stubs |
| Páginas admin | 14 bajo `(protected)/` + `login` | OK | Todas protegidas por layout + middleware |
| Rutas API | 64 archivos `route.ts`, 88 funciones HTTP bajo `/api/admin/**` | OK (auth) | 0 sin auth check visible |
| Entidades de dominio | 16 (`src/core/entities`) | OK | Ver §6 backend |
| Interfaces de repositorio | 16 (`src/core/repositories`) — faltan `IProjectRepository`/`IServiceRepository` | INCOMPLETO | Ver §9 |
| Casos de uso | 43 (`src/application/use-cases`) | OK, 100% invocados | Concentrados en leads/tasks/staff/pipeline |
| Implementaciones Drizzle | 19 repositorios + 2 servicios (`ResendEmailService`, `OpenAIEmbeddingService`) + 2 sin interfaz (`DrizzleProjectRepository`, `DrizzleServiceRepository`) | OK / huérfano de interfaz | |
| Componentes presentación (no-UI) | 18 en `src/presentation/components` | 8 dead (~1.477 líneas) | Ver §5 |
| Componentes admin | ~25 en `src/presentation/components/admin` | 11 de >300 líneas | TaskDetailDrawer (688L) es el archivo más grande del repo |
| Secciones marketing | `src/presentation/sections/*` | 1 dead (`ServicesIndex.tsx`, 226L) | |
| Hooks | `src/presentation/hooks/*` + `src/hooks/*` (2 archivos) | 1 dead, 1 duplicado | Ver §5 |
| Providers/Contexts | `MediaLibraryContext`, `LogoMorphProvider`, `LenisProvider` | OK (con 1 nombre obsoleto) | `LenisProvider` ya no usa Lenis |
| Utilities (`src/lib`) | `buildCategoryTree.ts` (5 importadores), `utils.ts`/`cn()` (~58 importadores) | **Activo, no legacy** | Corrige una premisa de CLAUDE.md — ver §10 |
| Tipos (`src/types`) | `category.ts` (12 importadores), `media.ts` (20 importadores) | **Activo, no legacy** | Idem |
| Scripts | 9 en `scripts/` | 1 con colisión de nombre confusa | Ver §17 |
| Tablas DB | 24 (`schema.ts`) | Todas con uso confirmado | Ver §8 |
| Migraciones | 18 en el journal + 2 huérfanas fuera de journal | Desincronizado | Ver §9 |
| Dependencias npm | 287 prod + 298 dev + 113 optional | 9 candidatas a eliminar | Ver §11 |
| Tests | 0 | Ausente | Ver §16 |
| CI/CD | 0 (`.github/workflows` no existe) | Ausente | Ver §17 |
| Assets duplicados | `dist/` (build Vite local) vs `public/assets/` | `dist/` local, gitignorado, no trackeado | Limpieza de disco recomendada, no de repo |

---

## 4. Dashboard (Admin CMS) Audit

**Páginas:** `/admin` (home), `/admin/categories`, `/admin/leads` (+ `[id]`, `management/form-builder`, `management/staff`), `/admin/media`, `/admin/projects` (+ `new`, `[id]/edit`), `/admin/services` (+ `new`, `[id]/edit`), `/admin/settings`, `/admin/login`.

**Funcionalidades terminadas:**
- Gestión de Leads completa: kanban por pipeline stage, notas, eventos, documentos, contactos con roles, archivado/trash/restore, búsqueda — toda la cadena use-case→repositorio implementada y verificada invocada.
- Gestión de Tareas: checklist, comentarios, adjuntos, asignación — 13 casos de uso, todos invocados.
- Gestión de Staff y permisos granulares (`hasPermission`).
- Form Builder con drag-and-drop (`@dnd-kit`) para formularios de cotización dinámicos.
- Media Library: carpetas, tags, metadata, picker modal, drawer de detalle — funcional pero con capa de datos sin abstracción (ver §9).

**Funcionalidades parcialmente implementadas:**
- Catálogo (Proyectos/Servicios/Categorías): CRUD funcional en UI pero sin validación de servidor robusta (`app/api/admin/projects/route.ts:13-26` acepta cualquier shape directo a `Project.create()`, incluyendo un `new Date(body.completedDate)` sin guardia que produce `Invalid Date` silenciosamente con input malformado).
- Búsqueda semántica de leads (mencionada en CLAUDE.md): el embedding se genera y guarda en cada quote, pero no existe ningún query de similitud en el código — funcionalidad fantasma, 100% write-path, 0% read-path.

**Funcionalidades abandonadas (código muerto encontrado, ver §10):**
- `ServicesIndex.tsx` + `serviceMeta.ts` — listado de servicios alternativo, reemplazado por `ServicesGrid.tsx`.
- `CategoryTable.tsx`, `NewCategoryForm.tsx` — reemplazados por `CategoryTreeView`/`CategoryFormModal`.
- `MediaDetailsModal.tsx`, `GalleryUpload.tsx` — reemplazados por `MediaDetailDrawer`/`GalleryManagerModal`.

---

## 5. Frontend Audit

**Stack:** Next.js 15 / React 19, Tailwind + shadcn/ui (Radix), GSAP + ScrollTrigger (ya sin Lenis a pesar del nombre `LenisProvider`), Three.js/R3F (código muerto, ver abajo), React Hook Form + Zod, @dnd-kit.

**Código duplicado / consolidable:**
| Par | Veredicto |
|---|---|
| `Navigation.tsx` (216L) vs `SimpleHeader.tsx` (229L) | CONSOLIDAR — lógica de scroll/drawer/CTA casi idéntica |
| `src/hooks/use-mobile.ts` vs `src/presentation/hooks/use-mobile.ts` | Byte-idénticos; solo el de `src/hooks` tiene importador (`ui/sidebar.tsx`) — ELIMINAR la copia de `presentation` |
| `src/hooks/useScrollReveal.ts` vs `src/presentation/hooks/useScrollReveal.ts` | Solo la copia de `presentation` tiene importadores (4) — ELIMINAR la de `src/hooks` |

**Componentes gigantes (>300 líneas), 16 en total** — concentrados en `components/admin`: `TaskDetailDrawer.tsx` (688L), `LeadsKanban.tsx` (567L), `MediaLibraryContext.tsx`/`MediaGrid.tsx` (488L c/u), más 12 adicionales entre 318-480 líneas (lista completa entregada por el agente de frontend, disponible en el detalle de esta sesión).

**Performance:**
- `LeadsKanban.tsx`: `groupedByStage` ejecuta `reduce`+`filter` O(stages×leads) en cada render sin `useMemo`, dentro de un tablero drag-and-drop que re-renderiza con frecuencia durante el drag.
- `TaskDetailDrawer.tsx` y `MediaGrid.tsx`: transformaciones de arrays sin memoización (riesgo menor hoy por volumen de datos bajo).
- `LenisProvider` (init global GSAP/ScrollTrigger) montado una sola vez en `app/layout.tsx` — correcto.
- `ContactSection` correctamente code-split vía `next/dynamic` — correcto.
- Patrón de estado: Context API usado apropiadamente (`MediaLibraryContext`, `LogoMorphProvider`); no se encontró prop drilling excesivo.

**Corrección importante a la premisa de CLAUDE.md:** el archivo afirma que `src/lib`, `src/types`, `src/hooks` son "remanentes legacy de Vite superados por `src/presentation/`". La evidencia no lo sostiene para `src/lib` (`cn()` tiene ~58 importadores activos) ni `src/types` (`category.ts`: 12 importadores, `media.ts`: 20 importadores) — son módulos de dominio activos resueltos vía el alias `@/*` de `tsconfig.json`. `src/components` y `src/sections` ya no existen en disco (limpieza ya realizada en algún punto). El único caso real de duplicado legacy es `useScrollReveal.ts`, y allí es la copia de `src/presentation/hooks` la que está viva — exactamente lo opuesto al patrón que CLAUDE.md sugiere para `use-mobile.ts`. **Recomendación: actualizar CLAUDE.md** para no inducir a borrar `src/lib`/`src/types` por error en una futura limpieza.

---

## 6. Backend / API Audit — inventario de rutas

Tabla completa (88 funciones HTTP bajo `/api/admin/**`, todas con `auth()` verificado in-handler; rutas públicas intencionalmente sin auth):

| Ruta (resumen por familia) | Métodos | Auth | Observaciones |
|---|---|---|---|
| `/api/health` | GET | No (intencional) | Health check sin datos sensibles |
| `/api/quotes` | POST | No (público) | Zod completo, sin rate limit (HIGH, ver §15) |
| `/api/upload/quote-attachment` | POST | No (público) | TODO propio: sin rate limit |
| `/api/projects/featured`, `/api/categories/tree`, `/api/forms/[slug]` | GET | No (intencional) | |
| `/api/auth/[...nextauth]` | GET, POST | Handler propio de NextAuth | Solo Credentials provider, sin OAuth |
| `/api/admin/categories**` | GET/POST/PATCH/DELETE | Sí | Zod presente; casi-duplicado con `/api/categories/tree` público |
| `/api/admin/leads/**` (40+ subrutas: contacts, events, notes, documents, tasks, attachments, comments, checklist-items, archive/restore/trash) | GET/POST/PATCH/DELETE | Sí, + `hasPermission()` en la mayoría | Dominio mejor cubierto del repo |
| `/api/admin/media**`, `/api/admin/categories/[id]`, `/api/admin/auth/change-password` | GET/POST/PATCH/DELETE | Sí (sesión) pero **sin** `hasPermission()` | LOW finding, ver §15 |
| `/api/admin/projects**`, `/api/admin/services**` | POST/PATCH/DELETE | Sí | Sin Zod, validación manual mínima o nula |
| `/api/admin/staff**`, `/api/admin/pipeline-stages**`, `/api/admin/upload/presign` | GET/POST/PATCH/PUT | Sí, + `hasPermission()` | |

**Total: 0 rutas write-capable bajo `/api/admin/**` sin verificación de sesión.** Ver §15 para la inconsistencia de permisos granulares.

**Endpoints duplicados:** `/api/categories/tree` (público, filtra `isActive`) vs `/api/admin/categories/tree` (autenticado, sin filtro) — misma lógica subyacente (`DrizzleCategoryRepository` + `buildCategoryTree`), divergen solo en el filtro. No es un bug, pero es candidato a CONSOLIDAR.

**Endpoints muertos/stub/test:** ninguno encontrado.

---

## 7. Integraciones externas

| Integración | Estado | Uso real confirmado | Riesgo |
|---|---|---|---|
| **Resend** (email) | Activo | `ResendEmailService` invocado desde `CreateQuoteUseCase` (confirmación + notificación admin) | No evaluado a fondo en esta pasada (retries/webhooks fuera de alcance) |
| **OpenAI** (embeddings) | Activo solo en write-path | `OpenAIEmbeddingService`, modelo `text-embedding-3-small`, dim. 1536, escrito en cada quote | **Funcionalidad fantasma**: nunca se lee para búsqueda — costo de API sin valor funcional actual |
| **Cloudflare R2** (S3-compatible) | Activo | `R2StorageService`, presigned URLs para adjuntos de quote, media admin, adjuntos de tareas | Sin límite de tamaño server-side; tipo de contenido validado solo por header declarado, no por bytes reales (MEDIUM, §15) |
| **NextAuth v5 beta** | Activo | Credentials provider únicamente, JWT 7 días, bcryptjs | Sin OAuth configurado; sin throttling de intentos (HIGH, §15) |
| Webhooks | No encontrados | — | — |

---

## 8. Database Audit

**24 tablas**, todas con al menos un consumidor confirmado por grep de su export TypeScript (repositorio o ruta API) — **no hay tablas completamente huérfanas**.

Tablas principales: `categories`, `projects`, `services`, `quotes`, `leads`, `lead_activities`, `lead_contacts`, `lead_contact_roles`, `lead_documents`, `lead_events`, `lead_notes`, `lead_tasks`, `task_attachments`, `task_checklist_items`, `task_comments`, `pipeline_stages`, `admin_users`, `permissions`, `staff_user_permissions`, `forms`, `form_versions`, `media_metadata`, `media_folders`, `media_tags`.

**Relaciones:** todas las FK activas están declaradas vía `.references()` en `schema.ts`, **excepto dos** que existen en la base real pero no en el modelo TS (ver §9, riesgo de drop accidental).

**Columnas deprecadas confirmadas por comentario explícito + cero uso de aplicación:**
- `leads.stage` (schema.ts:266-268) — superseded by `stageId`. `DrizzleLeadRepository` solo lee `stageId`.
- `lead_contacts.role` (schema.ts:371-373) — superseded by `roleId`. Sin escrituras/lecturas de aplicación.

**Enum muerto:** `projectStatusEnum` (schema.ts:27-31) — el tipo Postgres existe, pero `projects` usa columnas booleanas (`published`, `featured`) en su lugar; ninguna columna tiene este tipo.

**pgvector:** instalado en una migración huérfana (`0000_init_pgvector.sql`, fuera del journal actual) pero abandonado — las columnas `quotes.descriptionVector`/`projects.descriptionVector` son `jsonb`, no `vector`, sin índice HNSW activo, sin ningún query de similitud en el código.

---

## 9. Drizzle ORM Audit

**Estado de sincronización ORM ↔ Base de Datos: DESINCRONIZADO.**

1. **Historial de migraciones reescrito**: `0000_init_pgvector.sql` y `0001_hierarchical_categories.sql` existen en disco con prefijo numérico antiguo, pero **no aparecen en `meta/_journal.json`**. El journal actual arranca con `0000_baseline_pre_lead_crm.sql`, cuyo DDL está completamente comentado (es una foto de introspección, no instrucciones ejecutables) — evidencia de que en algún punto se usó `db:push` directo contra la base y luego se regeneró el historial desde cero sin limpiar los archivos viejos.
2. **Riesgo de drop accidental de FK**: `media_folders.parent_id` y `media_metadata.folder_id` tienen FK reales en la base (creadas en `0000_baseline_pre_lead_crm.sql:106,137-138`) pero **no están declaradas con `.references()` en `schema.ts`** (líneas 456 y 476). Un futuro `drizzle-kit push` trata el modelo TS como fuente de verdad y podría generar un `DROP CONSTRAINT` sobre estas FKs.
3. **Índice no modelado**: el índice único compuesto `idx_categories_slug_type_parent` (con `COALESCE`, creado en `0001_hierarchical_categories.sql:20-21`) no tiene representación en `schema.ts` — no se replicaría en un entorno nuevo construido solo desde el modelo TS.
4. **Riesgo de pérdida de datos por limpieza: bajo**, concentrado en `leads.stage`/`lead_contacts.role` (drop seguro, backfill histórico ya confirmado completo) — **no** en las tablas o en datos de negocio.

**Recomendación explícita antes de cualquier limpieza de BD:** correr `drizzle-kit generate` contra un staging para confirmar el diff real detectado (especialmente las 2 FKs y el índice compuesto) antes de tocar producción, y no volver a usar `db:push` directo contra producción mientras existan estas discrepancias.

---

## 10. Detección de elementos obsoletos y huérfanos

### Código muerto confirmado (grep con cero referencias externas)

| Archivo | Líneas | Reemplazado por |
|---|---|---|
| `src/presentation/components/ParticleScene.tsx` | 480 | `HeroSection` usa imagen estática + GSAP (Ken Burns) |
| `src/presentation/sections/ServicesIndex.tsx` | 226 | `ServicesGrid.tsx` |
| `src/presentation/data/serviceMeta.ts` | — | (solo consumido por el anterior) |
| `src/presentation/components/admin/MediaDetailsModal.tsx` | 265 | `MediaDetailDrawer.tsx` |
| `src/presentation/components/admin/GalleryUpload.tsx` | 174 | `GalleryManagerModal.tsx` |
| `src/presentation/components/admin/CategoryTable.tsx` | 189 | `CategoryTreeView.tsx` |
| `src/presentation/components/admin/NewCategoryForm.tsx` | 84 | `CategoryFormModal.tsx` |
| `src/hooks/useScrollReveal.ts` | 59 | `src/presentation/hooks/useScrollReveal.ts` |
| `src/presentation/hooks/use-mobile.ts` | 19 | `src/hooks/use-mobile.ts` |

**Total: ~1.477 líneas de código muerto confirmado en la capa de presentación.**

### Archivos/carpetas huérfanos
- `src/pages/` — carpeta vacía, no trackeada en git (`git ls-files src/pages/` vacío). Artefacto local sin impacto.
- `dist/` (raíz) — build de Vite antiguo, gitignorado y no trackeado. Limpieza de disco recomendada, no es un hallazgo de repo.

### Dependencias innecesarias (confirmadas por grep, 0 imports)
`@auth/core`, `@react-three/drei`, `current-device`, `date-fns`, `pgvector` (paquete npm, distinto de la extensión Postgres), `tw-animate-css` (devDep, duplica `tailwindcss-animate`), `eslint-plugin-react-refresh` (devDep, residuo de Vite/CRA).

**Reconciliación entre agentes:** el agente de dependencias marcó `three`, `@react-three/fiber`, `@types/three` como "en uso" (1 import cada uno), pero el agente de frontend confirmó que ese único importador es `ParticleScene.tsx`, que está muerto. **Conclusión combinada: estas 3 dependencias también son candidatas a ELIMINAR**, salvo que exista intención de revivir el hero de partículas — confirmar con producto antes de borrar.

### Configuraciones obsoletas
- CLAUDE.md referencia un directorio `.env-templates/` que no existe — el archivo real es `.env.example`. Documentación desactualizada.
- `.env.example` filtra un `R2_ACCOUNT_ID` real y hostnames/IP de infraestructura real como si fueran placeholders (todas las demás claves del mismo archivo sí usan placeholders genéricos).
- `eslint.config.js` ignora globalmente `src/components/**`, `src/hooks/**`, `src/presentation/components/**`, `src/presentation/hooks/**` — la mayor parte del árbol de UI nunca se lintea.
- `scripts/setup-pgvector.mjs` vs `scripts/setup-pgvector.ts`: nombres casi idénticos, comportamiento opuesto (el `.mjs` registra que pgvector NO se usa; el `.ts`, invocado por `npm run db:setup`, sí crea la extensión). Confusión de mantenimiento real.

---

## 11. Repository Cleanup Assessment

| Ruta | Motivo | Riesgo | Acción Recomendada |
|---|---|---|---|
| `ParticleScene.tsx` + `three`/`@react-three/fiber`/`@react-three/drei`/`@types/three` | 0 importadores reales (sole consumer muerto) | Bajo | **ELIMINAR** (confirmar con producto si se planea revivir el hero 3D) |
| `ServicesIndex.tsx` + `serviceMeta.ts` | Reemplazado por `ServicesGrid.tsx` | Bajo | **ELIMINAR** |
| `MediaDetailsModal.tsx`, `GalleryUpload.tsx`, `CategoryTable.tsx`, `NewCategoryForm.tsx` | Reemplazados por sus sucesores ya integrados | Bajo | **ELIMINAR** |
| `src/hooks/useScrollReveal.ts` | Duplicado muerto de la versión en `src/presentation/hooks` | Bajo | **ELIMINAR** |
| `src/presentation/hooks/use-mobile.ts` | Duplicado muerto de `src/hooks/use-mobile.ts` (que sí se usa) | Bajo | **ELIMINAR** |
| `@auth/core`, `current-device`, `date-fns`, `pgvector` (npm), `tw-animate-css`, `eslint-plugin-react-refresh` | 0 imports confirmados | Bajo | **ELIMINAR** |
| `Navigation.tsx` vs `SimpleHeader.tsx` | Lógica de header casi idéntica duplicada | Medio (requiere QA visual) | **CONSOLIDAR** |
| `LenisProvider.tsx` | Nombre obsoleto, ya no usa Lenis | Bajo | **REFACTORIZAR** (renombrar o restaurar Lenis real) |
| `/api/categories/tree` vs `/api/admin/categories/tree` | Lógica casi duplicada | Bajo | **CONSOLIDAR** |
| Rutas catálogo (`projects`, `services`, `categories`) sin capa de aplicación | Bypass estructural de la arquitectura DDD del resto del repo | Medio-Alto (calidad de datos) | **REFACTORIZAR**: crear `IProjectRepository`/`IServiceRepository` + casos de uso + Zod, siguiendo el patrón ya validado en `leads`/`quotes` |
| Rutas de media + `change-password` con `db` crudo | Bypass total de repositorio/caso de uso | Medio | **REFACTORIZAR** |
| `scripts/setup-pgvector.mjs` vs `.ts` | Nombres casi idénticos, comportamiento divergente | Bajo (confusión, no bug activo) | **CONSOLIDAR/RENOMBRAR** |
| `0000_init_pgvector.sql`, `0001_hierarchical_categories.sql` (migrations huérfanas) | Fuera del journal, no ejecutables vía `db:migrate` | Bajo (no se usan, pero documentan historia real) | **ARCHIVAR** (mover fuera de `migrations/` a un folder de histórico, no borrar sin antes confirmar que ningún entorno depende de ellas) |
| `src/pages/` (carpeta vacía) | No trackeada, sin contenido | Ninguno | **ELIMINAR** del disco local |
| `dist/` (raíz) | Build Vite obsoleto, gitignorado | Ninguno | **ELIMINAR** del disco local |
| Archivo con nombre de ruta corrupta (`c:\dev\contigo-platform\middleware.ts` literal) | Artefacto de un mishap de commit (`e088514`) | Ninguno — ya en proceso de borrado en el working tree actual | **Completar el `git rm`** (ya iniciado) |
| `CLAUDE.md` (sección de "legacy remnants") | Afirma incorrectamente que `src/lib`/`src/types` son legacy | Ninguno (documentación) | **REFACTORIZAR** el texto para no inducir a borrar módulos activos |

---

## 12. Database Cleanup Assessment

**Tablas candidatas a eliminación:** ninguna — las 24 tienen uso confirmado.

**Columnas obsoletas (evidencia + cero uso de aplicación):**
- `leads.stage` — Fase 1 (bajo riesgo, backfill ya completo).
- `lead_contacts.role` — Fase 1 (bajo riesgo, idem).

**Enum obsoleto:** `projectStatusEnum` — Fase 1, drop seguro (no aplicado a ninguna columna).

**Relaciones rotas / drift:** `media_folders.parent_id`, `media_metadata.folder_id` sin `.references()` en el modelo — **Fase 2** (requiere validación: añadir las referencias al modelo, no tocar la BD).

**Índices faltantes en el modelo:** `idx_categories_slug_type_parent` — **Fase 2** (modelar antes de cualquier `db:push`).

**Migraciones huérfanas:** `0000_init_pgvector.sql`, `0001_hierarchical_categories.sql` — **Fase 3** (alto riesgo si se borran sin antes confirmar que ningún entorno legacy las necesita para reconstruirse desde cero).

### Plan de limpieza de Base de Datos

**Fase 1 — seguro:**
- `DROP COLUMN leads.stage`, `DROP COLUMN lead_contacts.role`, `DROP TYPE project_status` (vía migración formal `drizzle-kit generate`, no `db:push`).

**Fase 2 — requiere validación:**
- Añadir `.references()` a `media_folders.parent_id` y `media_metadata.folder_id` en `schema.ts`.
- Modelar `idx_categories_slug_type_parent` en `schema.ts`.
- Generar una migración de "reconciliación" con `drizzle-kit generate` contra staging y diffear contra el estado real antes de aplicar a producción.

**Fase 3 — alto riesgo / requiere decisión de producto:**
- Decidir el destino de pgvector: o se implementa el read-path de búsqueda semántica (justificando el costo de OpenAI ya incurrido), o se elimina la generación de embeddings para dejar de pagar por una función inexistente.
- Archivar o eliminar definitivamente las 2 migraciones huérfanas del directorio `migrations/`.

---

## 13. Technical Debt Report

| Severidad | Ítem |
|---|---|
| **Crítica** | Credencial de prod en `.claude/archive/.../DATABASE-SETUP.md`; cuenta `owner` hardcodeada en 3 scripts de seed |
| **Alta** | Sin capa de aplicación para Catálogo (Projects/Services/Categories/Forms); sin rate limiting en endpoints públicos; sin tests; sin CI/CD |
| **Media** | Drift de esquema Drizzle (FKs no declaradas, índice no modelado); validación Zod inconsistente entre rutas hermanas; N+1 en 4 listados admin; pgvector abandonado (costo sin valor) |
| **Baja** | 16 componentes >300 líneas; duplicación Navigation/SimpleHeader; ~1.477 líneas de código muerto; 9 dependencias sin uso; inconsistencia Next 15 `params`; `eslint.config.js` con blind spots |

**Technical Debt Score: 6/10** (deuda real y localizable, no generalizada — el dominio CRM está limpio, la deuda se concentra en Catálogo/Media/infraestructura de seguridad operativa).

---

## 14. Performance Audit

- **N+1 confirmados** (sin método batch disponible en los repositorios, por lo que cualquier futuro caller choca con el mismo problema): listado admin de leads (lookup de quote por lead), kanban de leads (idéntico), listado de tasks (lookup de assignee por task), página de staff (lookup de permisos por usuario). Volumen actual bajo mitiga el impacto hoy.
- **Render sin memoización**: `LeadsKanban.tsx` (`groupedByStage`, O(stages×leads) en cada render durante drag-and-drop), `TaskDetailDrawer.tsx`, `MediaGrid.tsx`.
- **Bundle**: 480 líneas de Three.js/R3F muertas (`ParticleScene.tsx`) + 4 dependencias asociadas siguen empaquetándose si algo las importa transitivamente — eliminarlas es la ganancia de bundle más clara y de menor riesgo del repo. No se ejecutó un analizador de bundle real (`next build --profile` / `@next/bundle-analyzer`) en esta auditoría — esta es una inferencia de dependencias, no una medición.
- **Caching:** no evaluado a fondo en esta pasada (fuera del alcance de los agentes desplegados); no se encontró capa de caché explícita (Redis/etc.) en ninguna ruta.
- **Memory leaks:** no evaluado (requeriría profiling en runtime, no análisis estático).

---

## 15. Security Audit

Ver tabla completa de hallazgos por severidad ya producida; resumen:

| Severidad | Hallazgo |
|---|---|
| Crítica | Credencial de prod en markdown trackeado (en remediación) |
| Crítica | Cuenta `owner`/`admin123` hardcodeada, password impreso en consola, ejecutada automáticamente en cada boot de contenedor |
| Alta | Sin rate limiting en `/api/quotes` y `/api/upload/quote-attachment` (auto-flagged vía TODO) |
| Alta | Sin throttling de intentos de login en el credentials provider |
| Media | Zod sin `.max()` en campos de texto de `/api/quotes` |
| Media | Sin límite de tamaño server-side en uploads a R2; content-type validado solo por header declarado |
| Media | `docker-compose.yml` con password dev y `NEXTAUTH_SECRET` dev hardcodeados (probablemente solo local) |
| Media | `.env.example` filtra Account ID real de R2 + infraestructura real |
| Baja | ~20/53 rutas admin verifican sesión pero no `hasPermission()` granular, a diferencia de rutas hermanas |
| Baja | `middleware.ts` solo protege `/admin/:path*`, no `/api/admin/**` (cada ruta se autoprotege individualmente, sin red de seguridad común) |
| Baja | bcrypt cost factor 10 (recomendado 12 para hardware 2025+) |

**Lo que se verificó correcto, explícitamente:** las 53 rutas admin con auth in-handler sin excepción; cero SQL injection; cero secretos hardcodeados tipo API key; cero `.env*` trackeados (aparte del hallazgo crítico); sin CORS mal configurado; token de `quote-status` con `crypto.randomUUID()` no enumerable, sin riesgo IDOR; validación Zod + value objects en el flujo público de cotización.

**Security Score: 4/10** — los patrones de autenticación/autorización de la aplicación son sólidos, pero la presencia de una credencial de producción actualmente expuesta y una cuenta admin con contraseña trivial conocida son hallazgos de explotación inmediata, no teóricos, y eso domina el score hasta que se remedien. Tras rotar la credencial, verificar la cuenta seed, y añadir rate limiting básico, el score realista sube a 7-8/10.

---

## 16. Testing Audit

**0 archivos de test en todo el repo.** Sin Jest/Vitest/Playwright/Cypress configurado, sin `__tests__/`, sin script `test` en `package.json`. Cobertura estimada: 0%.

---

## 17. Infrastructure Audit

- **Docker:** `Dockerfile` multi-stage (builder + runtime no-root), `docker-compose.yml` (dev-only, con Postgres pgvector + credenciales dev hardcodeadas), `entrypoint.sh` (ejecuta `seed-admin-prod.mjs` en cada boot, tolerando fallos con `|| true`).
- **CI/CD:** inexistente — no hay `.github/workflows/`. Nada automatizado gatea lint/build/deploy.
- **Variables de entorno:** todas las usadas en código están documentadas en `.env.example`; `RESEND_FROM_EMAIL` documentada pero sin uso confirmado en código (revisar `ResendEmailService`); `.env.example` filtra un Account ID real (ver §10).
- **Deploy:** sin scripts de deploy versionados; referencias a EasyPanel como plataforma de despliegue manual/PaaS.
- **Logs/Monitoreo/Backups:** no evaluados en esta auditoría — no se encontró configuración de logging estructurado, APM, ni estrategia de backup documentada en el repo (puede existir a nivel de plataforma EasyPanel, fuera del alcance de este análisis de código).

---

## 18. Riesgos de producción

- **Críticos:** credencial de BD expuesta (en remediación); cuenta admin hardcodeada potencialmente activa en producción.
- **Operativos:** cero CI/CD, cero tests — cualquier deploy es manual y sin red de seguridad automatizada.
- **Seguridad:** sin rate limiting en endpoints públicos (abuso/costo); sin throttling de login (brute force).
- **Escalabilidad:** N+1 en listados admin escalarán linealmente con volumen de leads/tasks; repos sin métodos batch.

---

## 19. Roadmap de Remediación

### Fase 1 — Estabilización (esta semana)
| Tarea | Prioridad | Esfuerzo | Dependencias |
|---|---|---|---|
| Rotar credencial de BD expuesta | Crítica | Bajo | Ninguna (en curso por el usuario) |
| Verificar/rotar cuenta `admin@contigoconstructions.com.au` si el seed corrió en producción | Crítica | Bajo | Acceso a BD de producción |
| Añadir rate limiting a `/api/quotes` y `/api/upload/quote-attachment` | Alta | Medio | Ninguna |
| Completar `git rm` del archivo con nombre corrupto | Baja | Trivial | Ninguna (ya iniciado) |

### Fase 2 — Limpieza (próximas 2 semanas)
| Tarea | Prioridad | Esfuerzo |
|---|---|---|
| Eliminar código muerto de presentación (~1.477 líneas, 9 archivos) | Media | Bajo |
| Eliminar 9 dependencias npm sin uso (incluyendo stack Three.js completo) | Media | Bajo |
| Consolidar `Navigation.tsx`/`SimpleHeader.tsx` | Baja | Medio |
| Redactar `.env.example` (quitar Account ID/infra real) | Media | Trivial |
| Actualizar CLAUDE.md (corregir premisa sobre `src/lib`/`src/types`, corregir `.env-templates/`) | Baja | Trivial |

### Fase 3 — Refactorización (próximo mes)
| Tarea | Prioridad | Esfuerzo |
|---|---|---|
| Crear `IProjectRepository`/`IServiceRepository` + casos de uso + Zod para Catálogo | Alta | Alto |
| Eliminar `db` crudo de rutas de media + `change-password`, introducir repositorio/use case | Media | Medio |
| Añadir `.references()` faltantes + índice compuesto a `schema.ts`, generar migración de reconciliación | Media | Medio |
| Decidir destino de pgvector (implementar read-path o eliminar write-path) | Media | Medio-Alto |
| Unificar autorización granular (`hasPermission`) en las ~20 rutas que solo verifican sesión | Baja | Medio |

### Fase 4 — Optimización
| Tarea | Prioridad | Esfuerzo |
|---|---|---|
| Memoizar transformaciones en `LeadsKanban`/`TaskDetailDrawer`/`MediaGrid` | Baja | Bajo |
| Añadir métodos batch (`findByIds`) a repos con N+1 confirmado | Media | Medio |
| Medir bundle real (`@next/bundle-analyzer`) tras eliminar Three.js | Baja | Bajo |

### Fase 5 — Escalabilidad
| Tarea | Prioridad | Esfuerzo |
|---|---|---|
| Introducir CI/CD básico (lint + build + futuros tests en cada PR) | Alta | Medio |
| Introducir suite de tests (empezar por casos de uso de leads/quotes, ya bien aislados) | Alta | Alto |
| Throttling de login + bump bcrypt a 12 | Media | Bajo |

---

## 20. Entregables finales — índice

1. Executive Summary → §1
2. Mapa de arquitectura → §2
3. Inventario completo → §3
4. Inventario de APIs → §6
5. Inventario de funcionalidades → §4
6. Inventario de la Base de Datos → §8
7. Mapa de relaciones → §8-9
8. Reporte de deuda técnica → §13
9. Reporte de elementos obsoletos → §10
10. Plan de limpieza del repositorio → §11
11. Plan de limpieza de la Base de Datos → §12
12. Riesgos de producción → §18
13. Roadmap de remediación → §19
14. Scorecard final → §1
