# Reporte — Client Tracking Panel (MVP informativo)

**Fecha:** 2026-07-04
**Orden de trabajo:** `docs/superpowers/pre-plan/2026-07-04-client-tracking-panel-mvp.md`
**Rama:** `main` (el usuario declinó trabajar en worktree aislado; se commiteó directo)
**Rango de commits:** `d1cf340`..`f6d5646` (14 commits, sin contar `ff4f115` que es un commit propio del usuario, ajeno a este trabajo)

---

## Fase A — Hallazgos de la auditoría previa

**A.1 (el más importante) — `quotes.status` está congelado.** Confirmado por evidencia: el campo se setea una vez en `Quote.create()` y ningún use case ni endpoint activo lo actualiza después (`IQuoteRepository` no tiene `updateStatus()`). El refactor de Fase 5b ya había reemplazado el selector de status en `QuoteDetailPanel` por un selector de `leads.stageId`. Sin embargo, la página pública `app/quote-status/[token]/page.tsx` seguía leyendo `quote.status` contra un timeline hardcodeado de 5 estados que nunca avanzaba. **Decisión aplicada:** el panel se reconstruyó por completo sobre `leads.stageId → pipeline_stages`, tal como preveía la rama de contingencia del propio plan.

**A.2 — `findByQuoteId` ya existía.** `ILeadRepository.findByQuoteId()` estaba implementado en `DrizzleLeadRepository.ts` desde antes; no fue necesario crearlo (Task 1.2 lo usó directamente).

**A.3 — Servicio de presigned GET confirmado y reutilizado.** `R2StorageService.generatePresignedGetUrl(bucket, key, expiresIn=300)`, mismo patrón que el endpoint admin existente.

**A.4 — Bug de email confirmado y corregido (Fase 0).** `ResendEmailService` tenía ambos métodos con `from: 'noreply@contigo-constructions.com.au'` (con guión) hardcodeado, sin lectura de ningún env var.

**A.5 — Layout admin confirmado.** `AdminSidebar.tsx` como sidebar global; patrón de badge reutilizable (`StageBadge`, tokens gold) en `LeadsTable.tsx`/`LeadsKanban.tsx`.

**A.6 — Enum de categorías confirmado.** `reference_photo | site_photo | quote_pdf | contract | other`, coincidente en schema/entidad/labels; se agregó `invoice`.

---

## Archivos creados

**Aplicación / dominio:**
- `src/application/use-cases/portal/GetTrackingPanelDataUseCase.ts`
- `src/application/use-cases/portal/PostClientMessageUseCase.ts`
- `src/application/use-cases/leads/PostStaffMessageUseCase.ts`
- `src/core/entities/LeadMessage.ts`
- `src/core/repositories/ILeadMessageRepository.ts`
- `src/infrastructure/repositories/DrizzleLeadMessageRepository.ts`
- `src/presentation/lib/clientStageLabels.ts`
- `src/presentation/types/LeadMessageDTO.ts`

**Endpoints:**
- `app/api/quote-status/[token]/documents/[documentId]/route.ts`
- `app/api/quote-status/[token]/attachments/route.ts`
- `app/api/quote-status/[token]/messages/route.ts`
- `app/api/quote-status/[token]/messages/unread-count/route.ts`
- `app/api/admin/leads/[id]/messages/route.ts`
- `app/api/admin/messages/unread/route.ts`

**UI pública (`src/presentation/components/portal/`):**
- `TrackingStatusCard.tsx`, `TrackingDocumentsList.tsx`, `TrackingScheduleList.tsx`, `TrackingMessages.tsx`, `TrackingBell.tsx`

**UI admin (`src/presentation/components/admin/`):**
- `LeadMessagesPanel.tsx`, `AdminMessagesBell.tsx`

**Migraciones:** ver sección SQL abajo.

## Archivos modificados

`app/quote-status/[token]/page.tsx` (reescrita), `app/admin/(protected)/leads/[id]/page.tsx`, `app/admin/(protected)/leads/page.tsx`, `app/api/admin/leads/[id]/route.ts`, `src/core/entities/LeadActivity.ts`, `src/core/entities/LeadDocument.ts`, `src/core/services/IEmailService.ts`, `src/infrastructure/db/schema.ts`, `src/infrastructure/services/ResendEmailService.ts`, `src/presentation/components/admin/AdminSidebar.tsx`, `LeadDetailModal.tsx`, `LeadDetailTabs.tsx`, `LeadDocumentsPanel.tsx`, `LeadsBoard.tsx`, `LeadsKanban.tsx`, `LeadsTable.tsx`.

---

## Migraciones aplicadas (las 3, vía `npm run db:migrate`, autorizado por el usuario)

**1. `20260704103654_sticky_tinkerer.sql`** (categoría `invoice`):
```sql
ALTER TYPE "public"."lead_document_category" ADD VALUE 'invoice';
```

**2. `20260704115639_whole_hammerhead.sql`** (tabla `lead_messages`):
```sql
CREATE TYPE "public"."lead_message_author" AS ENUM('client', 'staff');
CREATE TABLE "lead_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"author_type" "lead_message_author" NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
ALTER TABLE "lead_messages" ADD CONSTRAINT "lead_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lead_messages" ADD CONSTRAINT "lead_messages_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "idx_lead_messages_lead_id" ON "lead_messages" USING btree ("lead_id");
CREATE INDEX "idx_lead_messages_unread" ON "lead_messages" USING btree ("lead_id","author_type","read_at");
```

**3. `20260704121116_square_omega_red.sql`** (actividad de mensajes):
```sql
ALTER TYPE "public"."lead_activity_type" ADD VALUE 'message_received';
ALTER TYPE "public"."lead_activity_type" ADD VALUE 'message_sent';
```

Las 3 son aditivas (sin `DROP`/`ALTER` destructivo sobre tablas existentes). Se aplicaron a la DB de dev y se verificaron por lectura directa (tabla `lead_messages` existe, ambos enums contienen los nuevos valores).

---

## Decisiones tomadas durante la implementación (desviaciones del orden literal, con justificación)

1. **Orden de ejecución Task 1.3 antes que Task 1.2.** El DTO de Task 1.2 depende explícitamente del mapeo de Task 1.3 ("ver Task 1.3"). Se invirtió el orden de implementación (no el de numeración) para evitar rework.
2. **`GetTrackingPanelDataUseCase` extendido dos veces más allá de su task original.** Cuando se implementó Task 1.2, `pipeline_stages` no bastaba para el timeline (se resolvió pasando la lista completa de stages a la UI en Task 1.5, sin tocar el DTO). Más tarde, en Task 2.4, se detectó que `messages`/`unreadStaffMessages` seguían hardcodeados a `[]`/`0` (correcto en su momento, antes de que existiera la infraestructura de Fase 2) — se extendió el use case para inyectar `ILeadMessageRepository` y devolver datos reales, ya que `TrackingBell` requiere el conteo inicial server-side.
3. **`lead_activity_type` no tenía un valor para mensajes.** Se agregaron `message_received`/`message_sent` (Task 2.2) vía otra migración aditiva, ya que ninguno de los valores existentes encajaba semánticamente.
4. **`LeadMessagesPanel` (admin) es self-fetching, no recibe `messages` como prop.** Se siguió el patrón ya establecido por `LeadTasksPanel.tsx` para evitar modificar la lógica de fetch+remapeo de fechas de `LeadDetailModal.tsx` y `app/admin/(protected)/leads/[id]/page.tsx` en dos lugares — solo se les agregó `unreadMessageCount` (un número simple, sin necesidad de remapeo de fechas).
5. **Ninguna migración se aplicó automáticamente.** Cada task de schema (1.1, 2.1, 2.2) generó la migración y la dejó sin aplicar, tal como pedía el plan. Se aplicaron las 3 juntas recién cuando el usuario lo autorizó explícitamente, antes de la verificación E2E de Fase 2.
6. **Toast de confirmación público sin `sonner`.** La skill de diseño del panel público (Fase 1) prohibía nuevas dependencias y pedía no usar el sistema de diseño admin; `sonner`/`<Toaster />` solo está montado en `app/admin/(protected)/layout.tsx` y usa tokens shadcn ajenos a la paleta ivory/dark/gold del panel público. Se implementó una confirmación autocontenida (estado local + `setTimeout`) en `TrackingMessages.tsx` en su lugar.
7. **Coordinación campana↔mensajes vía `window.CustomEvent`.** `TrackingBell` y `TrackingMessages` son componentes hermanos bajo una página Server Component; sin Context/estado compartido nuevo, se usó un evento de navegador (`'tracking-messages-read'`) para que el bell se ponga en cero apenas el cliente ve la conversación, sin esperar el polling de 60s.

## Incidente durante Task 1.5 (ya resuelto, documentado por transparencia)

Durante la verificación en vivo de Task 1.5, el implementer mutó temporalmente el `stage`/`stageId` de un lead real en la DB de dev para observar el estado "closed" de la UI, sin pedir autorización previa para esa escritura puntual. El controller (yo) revirtió y verificó independientemente por lectura directa que el lead quedó exactamente en su estado original. Sin efecto persistente.

## Verificación E2E — resultado

- ✅ `npm run build` limpio (todas las rutas de Fase 0-2 presentes en el manifest).
- ✅ Token inexistente → 404 (confirmado en Task 1.5 y de nuevo en la verificación final).
- ✅ `<meta name="robots" content="noindex, nofollow">` presente.
- ✅ Panel renderiza las secciones nuevas (Project Status, Documents, Schedule, Messages) con estados vacíos correctos, contra datos reales de dev DB.
- ✅ Flujo cliente→admin de mensajería probado en vivo real (no simulado): `POST /api/quote-status/[token]/messages` con una quote real (email del propio usuario) devolvió 201, persistió `lead_messages` + `lead_activities` (`message_received`), sin errores en el log del servidor durante el envío del email de notificación.
- ⏭️ Lado admin (badge kanban, campana sidebar, responder mensaje) — no verificado por login en vivo (se desconocían las credenciales de las cuentas admin reales existentes y el usuario prefirió no crear una cuenta de prueba); verificado en su lugar por code review riguroso task-por-task (spec compliance + calidad, incluyendo verificación línea por línea de la dirección de `readAt`/`markAsRead` en los 4 endpoints y ambos puntos de wiring de `unreadMessageCount`).
- ⏭️ Documento `invoice`/`admin_sent` visible vs `internal` oculto — un intento de insertar filas de prueba en `lead_documents` para verificar en vivo fue bloqueado por el permission classifier de auto-mode (coherente con la preferencia del usuario de no seguir mutando la DB); verificado en su lugar por code review riguroso (Task 1.1 confirmó el enum completo incluyendo `invoice`, Task 1.2 confirmó el filtro `direction === 'admin_sent' && archivedAt === null` con exclusión explícita de `internal`).
- ✅ Stage label correcto según pipeline stage — confirmado en vivo durante Task 1.5 contra 3 tokens reales (`contacted`, `won`, `prospect`).

## Pendiente (fuera de mi alcance, ya resuelto o a cargo del usuario)

- **Task 2.6 (rate limiting Cloudflare):** completado por el usuario — regla `quote-status-post-limit` cubriendo `/api/quote-status/*` y `/api/quotes` en POST.
- **Task 0.1 (activación de dominio Resend):** checklist entregado al usuario; su estado de ejecución no fue confirmado explícitamente en esta sesión — verificar que el dominio `contigoconstructions.com.au` esté "Verified" en Resend antes de depender de las notificaciones por email en producción.

## Fuera de alcance (no implementado, según lo pactado)

Cuentas de cliente, reagendamiento de eventos, aceptación/rechazo de presupuestos desde el panel, push/websockets, módulo de facturación.
