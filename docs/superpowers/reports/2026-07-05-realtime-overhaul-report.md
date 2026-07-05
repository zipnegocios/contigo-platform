# Reporte — Real-Time Overhaul (Client Tracking Panel v2)

**Fecha:** 2026-07-05
**Plan:** `C:\Users\zipne\.claude\plans\ahora-quiero-que-los-tender-church.md`
**Rama:** `main` (commits directos, sin worktree, continuando el patrón de la sesión)
**Rango de commits:** `4e80166`..`1a83e20` (46 commits propios; 3 commits interleaved del usuario en su propia sesión, no parte de este plan: `a7cf4a3`, `ff4f115`, `d17072e`)

---

## Resumen

Se llevó el panel de tracking de cliente (`/quote-status/[token]`) de polling de 60s a actualizaciones casi en tiempo real vía Server-Sent Events, se expandieron las notificaciones por email a cambios de status y eventos de agenda, se agregó detalle estructurado de reuniones/visitas con iconos, se rediseñó el layout en un bento grid de dos columnas con paleta petrol-blue, y se agregó una campana de notificaciones agregada en el menú principal (reemplazando "Request a Quote" en rutas de tracking) con alertas sonoras en ambos lados.

## Fases completadas

- **Fase 0** — columna `notifications_viewed_at` en `leads` (checkpoint del cliente, deliberadamente sin bump de `updatedAt` para no reordenar el kanban).
- **Fase 1** — infraestructura SSE compartida (`createSSEStream` + `useSSE`) y su wiring en 6 rutas: mensajes/status/schedule/notificaciones públicas, mensajes admin (global + por lead). `AdminRealtimeProvider` centraliza la única conexión admin compartida.
- **Fase 2** — 8 templates de email nuevos (cambio de status, evento agendado/actualizado/cancelado, ambos lados) disparados desde `ChangeLeadStageUseCase`/`ScheduleLeadEventUseCase`/`UpdateLeadEventUseCase`/`UpdateLeadEventStatusUseCase`, cada envío en su propio try/catch aislado.
- **Fase 3** — DTO de eventos expandido con `meetingDetails`/`siteVisitDetails` (nunca `notes`/`contactId`), iconos `lucide-react` en todas las cards y sub-secciones.
- **Fase 4** — swap completo de paleta brown→petrol-blue (scoped a `portal/` + `page.tsx`), reestructuración en bento grid de 2 columnas con `TrackingMessages` como rail sticky con scroll interno.
- **Fase 5** — `GetLeadNotificationFeedUseCase` (allowlist de 8 tipos de actividad, nunca `message_received`), endpoints públicos de feed/mark-viewed/stream, `TrackingNotificationBell` reemplazando el CTA en rutas de tracking, alertas sonoras (`message.mp3`/`message-admin.mp3`) con detección de "mensaje genuinamente nuevo" vía refs (evita disparo en el montaje inicial).
- **Fase 6** — verificación automatizada + de solo lectura (ver abajo).

## Migraciones aplicadas

Una sola migración nueva en este plan (además de las 3 de la sesión anterior, ya aplicadas): `20260704193356_brainy_shooting_star.sql` — `ALTER TABLE "leads" ADD COLUMN "notifications_viewed_at" timestamp with time zone;`. Aditiva, sin destructivos.

## Bugs reales encontrados y corregidos durante el proceso

1. **Condición de carrera del mensaje optimista** (Task 1.6): un tick de SSE llegando entre el append optimista y el commit real del POST podía hacer desaparecer momentáneamente el mensaje del propio cliente. Corregido preservando mensajes `temp-` pendientes que aún no tienen contraparte en el snapshot entrante.
2. **Re-resolución de token en cada tick** (Task 1.3): `status/stream` resolvía quote→lead completo en cada tick de 2.5s en vez de una sola vez por conexión — exactamente el anti-patrón que la arquitectura buscaba evitar. Corregido.
3. **Índice invertido en "último mensaje"** (Task 1.3): comparación leía el mensaje más viejo en vez del más nuevo (el array viene `desc(createdAt)`). Corregido, y explícitamente evitado en tasks posteriores que reutilizaban el mismo patrón.
4. **Badges de no-leídos que nunca bajaban a cero** (Task 1.7): el merge por spread de datos en vivo sobre datos SSR nunca podía representar "este lead ya bajó a cero" (el endpoint omite leads con 0 no-leídos). Corregido con un flag `connected` que hace el reemplazo completo (no merge) una vez que llega el primer snapshot real.
5. **Bug de serialización RSC** (detectado y corregido por el usuario en su propia sesión, commit `e593709`): `TrackingStatusCard` recibía instancias de la clase `PipelineStage` cruzando el límite Server→Client Component, lo cual crashea en runtime. Corregido con el DTO existente `toPipelineStageDTO`.
6. **Inconsistencia de color post-swap** (Fase 6): `TrackingNotificationBell.tsx`, creado en Task 5.3 después del swap de colores de Task 4.1, usaba el literal brown viejo `#1E1A16`. Corregido a `var(--petrol-900)`.

## Verificación E2E — resultado

**Automatizado:**
- ✅ `npx tsc --noEmit` limpio.
- ✅ `npm run lint`: 23 errores preexistentes, todos en un worktree ajeno (`.claude/worktrees/agent-a2ecfd5f08ab928b3`) o en `next-env.d.ts` autogenerado — cero relacionados a este plan. 1 warning preexistente sin relación a los cambios.
- ✅ `npm run build` limpio.
- ✅ Las 6 rutas SSE confirmadas con `export const dynamic = 'force-dynamic'`.
- ✅ Auditoría de color: cero tokens brown legacy en `portal/`/`page.tsx` tras la corrección; gold intacto; `AdminSidebar.tsx` sin tocar.

**Solo lectura, contra dev DB real:**
- ✅ Los 5 endpoints públicos nuevos devuelven 404 (nunca 403) con token inválido.
- ✅ `/api/admin/messages/stream` devuelve 401 sin sesión.
- ✅ Render real de `/quote-status/[token]`: 200, `robots noindex,nofollow`, grid bento + sticky + scroll interno presentes, las 4 secciones renderizando, sin errores de hydration.
- ✅ Condicional del header: "Request a Quote" ausente en `/quote-status/[token]`, presente en `/`.

**Diferido a code review riguroso (por elección del usuario, no por limitación técnica):** flujo de mensajería en tiempo real entre 2 pestañas, cambio de stage en vivo, agendar/cancelar evento en vivo con verificación de emails, verificación auditiva de los sonidos, inspección visual del bento grid en breakpoints reales. Cada task pasó por revisión spec+calidad verificada directamente contra el diff (no solo contra el reporte del implementer), incluyendo trace manual de la lógica de carrera, direcciones de `readAt`, y mecánica CSS del layout.

## Nota de proceso

Durante Task 5.4, el implementer subagent quedó trabado esperando su propio monitor de build en 3 intentos de resume consecutivos sin entregar reporte final. El controller inspeccionó el diff directamente, confirmó que coincidía con las instrucciones, corrió `npm run build` él mismo (limpio), y comiteó el trabajo. La revisión posterior trató esto como el único gate de calidad para esa task y fue exhaustiva en consecuencia — sin hallazgos críticos ni importantes.

## Fuera de alcance (no implementado, según lo pactado)

WebSockets/Postgres LISTEN-NOTIFY (se usó SSE con polling server-side de 2.5s), sincronización en tiempo real de Status/Schedule en el lado admin (solo mensajes), verificación con Postgres LISTEN/NOTIFY, doble campana (se retiró la `TrackingBell` original en favor de la nueva agregada en el header).
