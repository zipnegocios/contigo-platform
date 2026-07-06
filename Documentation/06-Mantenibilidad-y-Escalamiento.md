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
