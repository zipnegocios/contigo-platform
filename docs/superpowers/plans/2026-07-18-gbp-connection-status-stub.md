# Work Order — GBP Connection Status Stub (Pending API Approval)

**Fecha:** 2026-07-18
**Proyecto:** contigo-platform
**Módulo:** Google Business Profile — Reputation Management (pre-M1)
**Autor:** Gustavo Amarista (zipnegocios) / Claude
**Ejecutor:** Claude Code
**Destino:** `docs/superpowers/plans/2026-07-18-gbp-connection-status-stub.md`

---

## 1. Contexto

El proyecto GCP `delta-entity-500212-d8` (project number `121307221241`) tiene la integración OAuth con Google Business Profile funcionando, pero **el proyecto aún no está aprobado por Google para la Business Profile API**. Esto se manifiesta como un error `429 RESOURCE_EXHAUSTED` con `quota_limit_value: "0"` en `mybusinessaccountmanagement.googleapis.com`.

Ese 429 **no es rate limiting**: es la señal de que el acceso no ha sido otorgado. La solicitud de Basic API Access fue enviada (Business Profile ID `2373348681553577527`, perfil verificado) y la aprobación puede tardar días a ~2 semanas. Cuando Google apruebe, la cuota pasa de 0 a 300 QPM y la integración debe arrancar **sin cambios de código**.

**Objetivo:** interpretar los errores de la API de Google como estados de dominio y mostrar en el admin un estado de conexión claro ("Google approval pending") en lugar del JSON crudo del 429. Además, proteger los jobs de sync para que no generen ruido de errores durante la espera.

## 2. Alcance

**Incluye:**
- Tipo de estado de conexión GBP en la capa de dominio.
- Intérprete de errores de la API de Google (infraestructura).
- Caso de uso de health check con caché.
- Endpoint admin `GET /api/admin/gbp/connection-status`.
- Card/badge de estado en la UI de settings del módulo GBP.
- Guard de short-circuit en los jobs/flows de sincronización.
- Tests unitarios del intérprete de errores.

**NO incluye:**
- Implementación de M1 (sync de reseñas, moderación) — bloqueado hasta aprobación de Google.
- Cambios al flujo OAuth existente.
- Rotación del client secret expuesto (work order separado — sigue pendiente y es prioritario).

## 3. Reglas globales de ejecución

Aplican las Instrucciones Globales de Ejecución vigentes:
- **NO ejecutar** `git commit`, `git push`, ni crear PRs/Releases. Working tree únicamente.
- Validar mediante build, lint, typecheck y tests — no pruebas manuales como mecanismo principal.
- Prohibido MCP Chrome DevTools.
- No crear archivos markdown de resumen (SUMMARY.md, REPORT.md, etc.). El cierre se entrega en el chat con el formato de Respuesta Final Obligatoria.
- Sugerir mensajes de commit (Conventional Commits) sin ejecutarlos.

---

## Fase 0 — Auditoría previa (BLOQUEANTE)

> No escribir código de las fases 1–6 hasta completar y reportar los hallazgos de esta fase. Si algún hallazgo contradice los supuestos de este plan, DETENERSE y reportar antes de continuar.

- [ ] **0.1** Localizar el servicio/cliente GBP existente que produce el 429 actual. Documentar ruta exacta del archivo y método(s) que llaman a `mybusinessaccountmanagement.googleapis.com`.
- [ ] **0.2** Confirmar el mecanismo de llamada: ¿`googleapis` npm (GaxiosError), `google-auth-library` + fetch, o fetch directo? Documentar el **shape real del objeto de error** capturado (dónde vive `code`, `status`, `details[]`). Este hallazgo determina el unwrap del intérprete en Fase 2.
- [ ] **0.3** Localizar dónde se persisten los tokens OAuth de GBP (tabla, columnas, servicio). Confirmar cómo se determina hoy "hay conexión" vs "no hay conexión".
- [ ] **0.4** Identificar si existe una tabla de settings/config del módulo GBP. Si existe, documentar su schema; si no, se usará caché en memoria (sin migración — ver §8 Q1).
- [ ] **0.5** Localizar la página/sección de settings del admin donde vive (o debe vivir) la UI de conexión GBP. Documentar ruta de la page y componentes existentes.
- [ ] **0.6** Identificar todos los puntos de entrada de sincronización GBP existentes (crons, jobs, endpoints manuales de sync) que deban recibir el guard de Fase 6. Listar rutas.
- [ ] **0.7** Confirmar el patrón de casos de uso y repositorios vigente en `src/application/use-cases/` para replicarlo (naming, inyección, retorno).

**Reporte de Fase 0:** entregar en el chat un resumen con: archivo(s) del cliente GBP, shape del error, tabla de tokens, existencia o no de settings GBP, ruta de la UI, lista de puntos de sync. **Esperar confirmación si hay desviaciones del plan.**

---

## Fase 1 — Dominio

- [ ] **1.1** Crear `src/domain/entities/GbpConnection.ts`:

```typescript
export type GbpConnectionStatus =
  | 'disconnected'          // No OAuth tokens stored
  | 'pending_api_approval'  // OAuth OK, but quota = 0 (project not approved by Google)
  | 'connected'             // OAuth OK and API responding
  | 'auth_error'            // Invalid/revoked token (401/403) — reconnect required
  | 'rate_limited'          // Real 429 post-approval — retry with backoff
  | 'error';                // Any other failure

export interface GbpConnectionState {
  status: GbpConnectionStatus;
  checkedAt: Date;
  detail?: string;
}
```

- [ ] **1.2** Sin lógica en esta capa. Sin dependencias externas. Verificar que el archivo respeta los límites de capa (no importa nada de infrastructure/presentation).

---

## Fase 2 — Infraestructura: intérprete de errores

- [ ] **2.1** Crear `src/infrastructure/services/gbp/interpretGbpApiError.ts`. Base de referencia (ajustar el unwrap según hallazgo 0.2):

```typescript
import type { GbpConnectionStatus } from '@/domain/entities/GbpConnection';

interface GoogleApiErrorDetail {
  '@type'?: string;
  metadata?: Record<string, string>;
}

interface NormalizedGoogleError {
  code?: number;
  status?: string;
  details?: GoogleApiErrorDetail[];
}

/**
 * Normalizes the raw error thrown by the GBP client into the
 * canonical Google API error body. Adjust per Phase 0 findings:
 * - googleapis (GaxiosError): error.response?.data?.error
 * - direct fetch: parsed body.error
 */
function normalizeGoogleError(error: unknown): NormalizedGoogleError {
  // TODO (Phase 0.2): implement per the real client in use.
  const err = error as Record<string, unknown>;
  return (err?.error ?? err) as NormalizedGoogleError;
}

export function interpretGbpApiError(error: unknown): GbpConnectionStatus {
  const err = normalizeGoogleError(error);

  if (err.code === 401 || err.code === 403) return 'auth_error';

  if (err.code === 429) {
    const errorInfo = err.details?.find((d) =>
      d['@type']?.includes('google.rpc.ErrorInfo')
    );
    const quotaLimitValue = errorInfo?.metadata?.quota_limit_value;

    // quota_limit_value "0" means the GCP project has not been
    // approved for Business Profile API access. This is NOT rate
    // limiting — retrying is pointless until Google approves.
    if (quotaLimitValue === '0') return 'pending_api_approval';

    return 'rate_limited';
  }

  return 'error';
}
```

- [ ] **2.2** Tests unitarios en el patrón de testing vigente (si no hay framework configurado — hallazgo conocido: sin tests automatizados — crear el test igualmente con el runner que el proyecto adopte o dejar los fixtures listos y reportarlo; NO instalar un framework de testing nuevo sin confirmación — ver §8 Q2). Casos mínimos:
  - 429 con `quota_limit_value: "0"` → `pending_api_approval` (usar como fixture el JSON real del error de producción)
  - 429 con `quota_limit_value: "300"` → `rate_limited`
  - 429 sin `details` → `rate_limited`
  - 401 → `auth_error`; 403 → `auth_error`
  - 500 → `error`; objeto arbitrario/undefined → `error` (no lanzar)

---

## Fase 3 — Aplicación: caso de uso de health check

- [ ] **3.1** Crear `src/application/use-cases/gbp/GetGbpConnectionStatusUseCase.ts` siguiendo el patrón confirmado en 0.7:
  - Si no hay tokens OAuth persistidos (según 0.3) → retornar `{ status: 'disconnected', checkedAt: now }` sin llamar a Google.
  - Si hay tokens → ejecutar la llamada más barata disponible (`accounts.list` del Account Management API).
  - Éxito → `connected`. Error → `interpretGbpApiError(error)` + `detail` con el mensaje corto (NUNCA incluir tokens ni el error crudo completo en `detail`).
- [ ] **3.2** Caché del resultado con TTL de **15 minutos**:
  - Si Fase 0.4 encontró tabla de settings GBP → persistir `{ status, checkedAt, detail }` como JSON en esa tabla (sin migración nueva si la columna/estructura lo permite; si requiere migración, ver §8 Q1 antes de crearla).
  - Si no existe → caché en memoria a nivel de módulo (Map/singleton). Aceptable: se pierde en redeploy y el primer request lo repuebla.
- [ ] **3.3** Parámetro `forceRefresh: boolean` para el botón "Check again" (ignora TTL).

---

## Fase 4 — API

- [ ] **4.1** Crear `app/api/admin/gbp/connection-status/route.ts`:
  - `GET` → retorna `GbpConnectionState` (cacheado; `?refresh=1` fuerza el health check).
  - Protección con `auth()` en el handler, consistente con el resto de `/api/admin/**`.
  - Validación de query param con Zod si el patrón del proyecto lo exige.
- [ ] **4.2** Respuesta tipada:

```typescript
// 200
{ "status": "pending_api_approval", "checkedAt": "2026-07-18T...", "detail": "..." }
```

---

## Fase 5 — Presentación: card de estado

- [ ] **5.1** Crear componente `GbpConnectionStatusCard` en la carpeta de componentes admin identificada en 0.5, usando shadcn/ui y los tokens de marca existentes.
- [ ] **5.2** Mapeo estado → UI (texto de UI en inglés):

| Status | Badge | Mensaje | Acción |
|---|---|---|---|
| `pending_api_approval` | Amber | "Google approval pending — our API access request is under review by Google. Sync will start automatically once approved." | Botón **Check again** (`?refresh=1`) |
| `auth_error` | Red | "Google connection expired or revoked. Please reconnect." | Botón **Reconnect** (flujo OAuth existente) |
| `connected` | Green | "Connected to Google Business Profile" | Última verificación (`checkedAt`) |
| `rate_limited` | Light amber | "Temporarily rate limited by Google — retrying automatically." | — |
| `disconnected` | Gray | "Not connected" | Botón **Connect** |
| `error` | Red | "Connection check failed." + `detail` | Botón **Check again** |

- [ ] **5.3** Estado de carga (skeleton) y manejo de fallo del propio endpoint (retry manual).
- [ ] **5.4** Montar el card en la página de settings GBP (ruta según 0.5). Si la página no existe todavía, crearla mínima (solo el card) bajo el layout protegido del admin.

---

## Fase 6 — Guard en sincronización

- [ ] **6.1** Para cada punto de entrada de sync identificado en 0.6: consultar el estado (vía use case, respetando caché) **antes** de ejecutar.
- [ ] **6.2** Comportamiento por estado:
  - `pending_api_approval` o `disconnected` → short-circuit silencioso: log nivel `info` ("GBP sync skipped: <status>"), NO log de error, NO reintentos.
  - `auth_error` → skip + log `warn` (requiere acción humana).
  - `rate_limited` → aplicar el retry con exponential backoff + jitter existente (o implementarlo si no existe — reportar en Fase 0 si falta).
  - `connected` → ejecutar sync normal.
- [ ] **6.3** Verificar que ningún flujo quede llamando a Google directamente sin pasar por el guard.

---

## Fase 7 — Validación

- [ ] **7.1** `pnpm build` → sin errores.
- [ ] **7.2** `pnpm lint` → sin errores nuevos (recordar que eslint ignora parte del árbol de UI — validar que los archivos nuevos SÍ estén cubiertos o reportar si caen en las exclusiones).
- [ ] **7.3** `pnpm typecheck` (o el script equivalente del proyecto) → sin errores.
- [ ] **7.4** Tests de Fase 2.2 en verde (o fixtures entregados + reporte, según resolución de §8 Q2).

---

## 8. Preguntas abiertas (responder antes de la fase dependiente)

| # | Pregunta | Bloquea | Default si no hay respuesta |
|---|---|---|---|
| Q1 | Si el caché persistente requiere migración de BD (nueva tabla/columna de settings GBP), ¿se crea la migración ahora o se usa caché en memoria? | Fase 3.2 | **Caché en memoria** (cero migraciones; se revisará al implementar M1) |
| Q2 | El proyecto no tiene framework de tests configurado. ¿Se instala Vitest ahora (decisión de stack) o se entregan los fixtures y casos documentados para cuando se configure? | Fase 2.2 | **Entregar fixtures + casos documentados**, sin instalar framework |
| Q3 | ¿La página de settings GBP debe quedar visible para rol `staff` o solo `owner`? | Fase 5.4 | **Solo `owner`** (consistente con settings sensibles) |

> Instrucción para Claude Code: si al llegar a una fase dependiente no hay respuesta del usuario, aplicar el default indicado y dejarlo registrado en el reporte final.

---

## 9. Reporte de cierre (obligatorio, en el chat — NO en archivo)

Entregar con el formato de Respuesta Final Obligatoria:

1. **Resumen Ejecutivo** — objetivo, componentes modificados, archivos, cambios de arquitectura/BD, riesgos, observaciones.
2. **Verificación Manual en Producción** — checklist: card visible en settings con badge ámbar "Google approval pending"; botón "Check again" fuerza health check; logs de sync muestran skip `info` (no errores 429); estados `disconnected`/`auth_error` simulables; permisos correctos según Q3.
3. **Migraciones Ejecutadas** — esperado: **ninguna** (salvo resolución distinta de Q1).
4. **Builds y Validaciones** — resultados de build/lint/typecheck/tests.
5. **Commits Sugeridos** — propuesta base (ajustar según cambios reales):

```bash
git commit -m "feat(gbp): add connection status domain model and error interpreter"
git commit -m "feat(gbp): add connection health check use case with cached status"
git commit -m "feat(admin): add GBP connection status endpoint and settings card"
git commit -m "feat(gbp): guard sync entry points against unapproved API access"
```

---

## 10. Criterio de éxito

- El admin muestra "Google approval pending" (badge ámbar) en lugar del JSON del 429.
- Los logs no acumulan errores 429 durante la espera de aprobación.
- El día que Google apruebe: "Check again" (o expiración del TTL) → estado `connected` → sync operativo **sin ningún cambio de código**.
