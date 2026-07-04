# Orden de trabajo — Fortificación de autenticación Admin/Staff

**Fecha:** 2026-07-04
**Rama base:** `main` (verificar con `git branch --show-current` — NO trabajar sobre `alpha`)
**Objetivo:** Endurecer el sistema de autenticación de admins y staff: eliminar credenciales hardcodeadas, forgot-password autogestionado, flujo de staff por invitación (sin passwords escritos por terceros), protección anti-fuerza-bruta, invalidación real de sesiones JWT, endurecimiento de endpoints y registro de eventos de seguridad.

**Contexto de evidencia:** Este plan cierra hallazgos confirmados en `AUDIT_REPORT_2026-06-24.md` (sección 15 — Security Audit): seed `owner/admin123` hardcodeado auto-ejecutado en cada boot (Crítica), sin throttling de login (Alta), bcrypt cost 10 (Baja), middleware sin cobertura de `/api/admin/**` (Baja), Zod sin `.max()` (Media). No re-auditar lo ya verificado correcto por ese reporte (cero SQL injection, 53 rutas con auth in-handler, etc.).

**Decisiones ya tomadas (no re-abrir):**
1. **Sin 2FA** — descartado explícitamente. No implementar TOTP ni preparar columnas para ello.
2. **Sesión JWT: 12 horas** (desde 7 días).
3. **Sin CSP** — ni enforced ni report-only. Los demás security headers sí entran.
4. 2FA y CSP quedan documentados como roadmap futuro al final de este archivo, no se ejecutan.

**Dependencia externa:** Las Fases 2 y 3 envían emails (reset + invitación). Requieren Resend operativo (Fase 0 de la orden `2026-07-04-client-tracking-panel-mvp.md`: dominio verificado + `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + fix del dominio con guión). Si esa fase no se ejecutó aún, ejecutar su Task 0.2 (fix de código) como parte de esta orden y coordinar la verificación DNS con Gustavo antes del deploy.

---

## Fase A — Auditoría previa (OBLIGATORIA antes de escribir código)

- [ ] **A.1 — Seed en el contenedor.** Confirmar CÓMO se ejecuta el seed en producción: revisar `Dockerfile`, `docker-compose.yml`, scripts de `package.json` y la configuración de EasyPanel si es visible en el repo. El reporte de auditoría dice que corre "automáticamente en cada boot" — confirmar el mecanismo exacto (¿`CMD`/`entrypoint`? ¿script npm encadenado?) y reportar la ruta del archivo.
- [ ] **A.2 — Versión exacta de `next-auth`.** Leer `package.json`. Es v5 beta; el número de beta importa para el comportamiento de `authorize` con errores custom y el manejo de `CredentialsSignin`. Verificar cómo la página de login actual interpreta `result?.error` (hoy muestra mensaje genérico — bien, mantener).
- [ ] **A.3 — Consumidores de `GET /api/admin/staff`.** Buscar todos los fetch a esa ruta. Se espera al menos: tabla de gestión de staff y el dropdown de assignee de Tasks (`LeadTasksPanel`/`TaskDetailDrawer`). Listar cada consumidor y qué campos usa realmente — determina el diseño de la Task 5.4.
- [ ] **A.4 — Callbacks `jwt`/`session`.** Confirmar la estructura actual en `auth.config.ts` (ya vista: token.id/email/name/role) y verificar si algún otro código lee claims del JWT directamente.
- [ ] **A.5 — Estado de `lastLogin`.** Confirmar que el update de `lastLogin` dentro de `authorize` funciona (será reutilizado y ampliado por la Fase 4).
- [ ] **A.6 — Página de login.** Confirmar estructura de `app/admin/login/page.tsx` (client component con `signIn('credentials', { redirect: false })`) — las páginas nuevas de forgot/reset/invitation deben seguir su mismo lenguaje visual (breakpoints no estándar conocidos: 1100/960/767px — NO propagarlos a las páginas nuevas; usar breakpoints Tailwind estándar).

**Entregable:** reporte corto de hallazgos en el chat antes de continuar. A.1 es bloqueante para la Fase 1.

---

## Fase 1 — Eliminar credenciales hardcodeadas (CRÍTICA — primera en ejecutarse)

### Task 1.1 — Seed seguro

**Files:** Modify `scripts/seed.ts` (o la ruta confirmada en A.1) + el mecanismo de auto-ejecución encontrado.

- [ ] El seed de admin pasa a: (a) ejecutarse SOLO manualmente (`npm run seed`), nunca en el boot del contenedor — remover del entrypoint/CMD lo que A.1 haya encontrado; (b) crear el owner SOLO si `admin_users` está vacía; (c) leer `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` de env vars — si faltan, abortar con mensaje claro, JAMÁS usar un default; (d) no imprimir el password en consola bajo ninguna circunstancia.
- [ ] Actualizar `.env.example` con las dos vars nuevas (valores placeholder).
- [ ] `pnpm build`. **Commit:** `fix(security): seed reads credentials from env, runs only manually, never on boot`

### Task 1.2 — Rotación de credencial (manual — Gustavo, coordinar)

- [ ] Cambiar el password del owner actual en producción (vía la UI de staff o SQL directo con hash bcrypt nuevo) ANTES del siguiente deploy.
- [ ] Verificar post-deploy que el contenedor ya no ejecuta el seed en boot (logs de EasyPanel).

---

## Fase 2 — Forgot password + invalidación de sesiones

### Task 2.1 — Schema: `auth_tokens` + `session_version`

**Files:** Modify `src/infrastructure/db/schema.ts`

```typescript
export const authTokenTypeEnum = pgEnum('auth_token_type', ['password_reset', 'invitation'])

export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  type: authTokenTypeEnum('type').notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(), // sha256 hex del token plano
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_auth_tokens_user_type').on(t.userId, t.type),
  index('idx_auth_tokens_hash').on(t.tokenHash),
])

// admin_users gana (aditivo):
// sessionVersion: integer('session_version').notNull().default(1)
// failedLoginCount: integer('failed_login_count').notNull().default(0)   ← usado en Fase 4
// lockedUntil: timestamp('locked_until', { withTimezone: true })          ← usado en Fase 4
```

- [ ] Migración aditiva, `npx drizzle-kit generate`, revisar SQL antes de aplicar. Extender `AdminUser` entity con los campos nuevos (+ `withIncrementedSessionVersion()`, `withFailedAttempt()`, `withResetLock()` inmutables, mismo patrón).
- [ ] `pnpm build`. **Commit.**

### Task 2.2 — Token service + use cases

**Files:**
- Create: `src/infrastructure/services/AuthTokenService.ts` — `generate()` retorna `{ plainToken, tokenHash }` con `crypto.randomBytes(32).toString('hex')` + sha256; `hash(plainToken)` para verificación. El token plano SOLO viaja en el email; la DB solo conoce el hash.
- Create: `src/application/use-cases/auth/RequestPasswordResetUseCase.ts` — busca por email; **si no existe, retorna éxito silencioso igual** (anti-enumeración); si existe: invalida tokens `password_reset` previos no usados (set `usedAt`), crea token nuevo (expira 30 min), dispara email.
- Create: `src/application/use-cases/auth/ResetPasswordUseCase.ts` — valida token (hash match + no usado + no expirado), valida password nuevo (Zod compartido, ver Task 2.4), hashea con bcrypt cost 12, marca token usado, **incrementa `sessionVersion`** (mata todas las sesiones activas del usuario).
- Modify: `IEmailService` + `ResendEmailService` — `sendPasswordResetEmail(user, resetUrl)`: template estilo existente, link a `{siteUrl}/admin/reset-password?token=...`, texto "expires in 30 minutes. If you didn't request this, ignore this email."

- [ ] `pnpm build`. **Commit.**

### Task 2.3 — Invalidación de sesiones vía `sessionVersion`

**Files:** Modify `src/infrastructure/auth/auth.config.ts`

- [ ] `authorize`: incluir `sessionVersion` en el objeto retornado. Callback `jwt`: guardar `token.sessionVersion`.
- [ ] En el callback `jwt`, en cada invocación (no solo en sign-in): consultar `sessionVersion` + `isActive` actuales del usuario en DB; si `token.sessionVersion !== db.sessionVersion` o `!isActive`, retornar un token marcado inválido (`token.invalid = true`) y en el callback `session` retornar `null`/sesión vacía para forzar re-login. **Nota de performance:** esto añade una query por request autenticado — aceptable para un equipo pequeño; si se quiere mitigar, cachear 60s en memoria por userId (decisión del implementador, documentar la elegida).
- [ ] Esto arregla también el hallazgo colateral: un staff desactivado hoy conserva su JWT hasta 7 días; con esto, `deactivate()` + incremento de `sessionVersion` (agregar al `DeactivateStaffUserUseCase`) lo expulsa de inmediato.
- [ ] `pnpm build`. **Commit.**

### Task 2.4 — Endpoints + páginas

**Files:**
- Create: `app/api/auth/forgot-password/route.ts` — POST `{ email }` (Zod: email válido, `.max(255)`). Respuesta SIEMPRE `{ success: true }` con el mismo shape y status, exista o no la cuenta.
- Create: `app/api/auth/reset-password/route.ts` — POST `{ token, password }`.
- Create: `src/presentation/lib/passwordPolicy.ts` — schema Zod compartido cliente/servidor: mínimo 12 chars, `.max(128)`, al menos una letra y un número. Mensajes de error claros.
- Create: `app/admin/forgot-password/page.tsx`, `app/admin/reset-password/page.tsx` — mismo lenguaje visual del login (A.6), breakpoints Tailwind estándar. Reset exitoso → toast + redirect a `/admin/login`.
- Modify: `app/admin/login/page.tsx` — link "Forgot your password?" bajo el form.
- Modify: `middleware.ts` — permitir sin sesión: `/admin/forgot-password`, `/admin/reset-password` (además del login ya permitido).

- [ ] `pnpm build`. **Commit.**

---

## Fase 3 — Staff por invitación

### Task 3.1 — Backend

**Files:**
- Modify: `src/application/use-cases/staff/CreateStaffUserUseCase.ts` — deja de recibir `password`. Crea el usuario con un `passwordHash` centinela imposible de matchear (hash de un `randomBytes(32)` descartado) e `isActive: true` pero sin credencial usable; genera token `invitation` (expira 72h); dispara email.
- Create: `src/application/use-cases/auth/AcceptInvitationUseCase.ts` — valida token, setea el password elegido (política compartida, bcrypt 12), marca token usado.
- Create: `app/api/auth/accept-invitation/route.ts` — POST `{ token, password }`, público.
- Modify: `app/api/admin/staff/route.ts` — POST ya no acepta `password` en el body (rechazar si viene, para no dejar el camino viejo vivo).
- Modify: `IEmailService`/`ResendEmailService` — `sendStaffInvitationEmail(user, inviteUrl)` → `{siteUrl}/admin/accept-invitation?token=...`.
- Create: endpoint `POST /api/admin/staff/[id]/resend-invitation` (permiso `users.manage`) — invalida invitación previa, genera y envía una nueva. Para el caso "expiró y no la aceptó".

- [ ] `pnpm build`. **Commit.**

### Task 3.2 — UI

**Files:**
- Create: `app/admin/accept-invitation/page.tsx` — set password (política compartida) → toast → redirect a login. Agregar a las rutas públicas del middleware.
- Modify: componente de creación de staff (modal en la página de staff management) — quitar el campo password; agregar aviso "An invitation email will be sent". En la tabla de staff: badge "Invitation pending" para usuarios que nunca hicieron login (`lastLogin IS NULL`) + botón "Resend invitation".

- [ ] `pnpm build`. **Commit.**

---

## Fase 4 — Anti-fuerza-bruta

### Task 4.1 — Lockout por cuenta + timing uniforme

**Files:** Modify `src/infrastructure/auth/auth.config.ts` (extraer la lógica a `src/application/use-cases/auth/VerifyCredentialsUseCase.ts` para que `authorize` quede delgado)

Reglas:
- [ ] **Timing uniforme:** si el email no existe, ejecutar igual un `compare()` contra un hash dummy precomputado (constante en el módulo) antes de rechazar — hoy el atacante puede enumerar cuentas midiendo latencia.
- [ ] **Lockout:** en fallo de password → `failedLoginCount + 1`; al llegar a 5 → `lockedUntil = now() + 15 min` y reset del contador. Si la cuenta está locked (`lockedUntil > now()`) → rechazar SIN ejecutar bcrypt y SIN mensaje distinto ("Invalid email or password" siempre — el lockout no se anuncia).
- [ ] Login exitoso → reset de `failedLoginCount`/`lockedUntil` + update de `lastLogin` (comportamiento actual, se conserva).
- [ ] Registrar cada evento en `security_events` (Fase 6 — si se ejecuta esta fase primero, dejar TODO y completar allí).
- [ ] `pnpm build`. **Commit.**

### Task 4.2 — Rate limiting por IP (manual — Gustavo)

- [ ] Cloudflare → Security → Rate Limiting Rules:
  - `POST /api/auth/callback/credentials` (y en general `/api/auth/*` POST): 10 req/min por IP → Block 10 min.
  - `POST /api/auth/forgot-password`: 3 req/10 min por IP → Block 15 min (evita spam de emails de reset).
- [ ] Documentar las reglas creadas (screenshot o export) en el reporte de cambios.

---

## Fase 5 — Endurecimiento de sesión y endpoints

### Task 5.1 — Sesión 12h

**Files:** Modify `auth.config.ts` — `session.maxAge` y `jwt.maxAge` a `12 * 60 * 60`. **Commit.**

### Task 5.2 — bcrypt cost 12 + re-hash transparente

**Files:** Modify `VerifyCredentialsUseCase` (Task 4.1), `CreateStaffUserUseCase`, `ResetPasswordUseCase`, `AcceptInvitationUseCase`, seed.

- [ ] Constante única `BCRYPT_COST = 12` en un módulo compartido (`src/infrastructure/auth/constants.ts`) — reemplazar todos los `10` literales.
- [ ] Re-hash transparente: tras un login exitoso, si `bcryptjs.getRounds(passwordHash) < 12`, re-hashear el password plano recibido con cost 12 y persistir. Los usuarios existentes migran solos sin reset masivo.
- [ ] `pnpm build`. **Commit.**

### Task 5.3 — Middleware como red para `/api/admin/**`

**Files:** Modify `middleware.ts`

- [ ] Matcher: `['/admin/:path*', '/api/admin/:path*']`. Para rutas `/api/admin/**` sin sesión → `Response.json({ error: 'Unauthorized' }, { status: 401 })` (JSON, no redirect). Los chequeos in-handler existentes SE MANTIENEN — esto es defensa en profundidad, no reemplazo.
- [ ] Verificar que las rutas públicas nuevas (`/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/accept-invitation`) quedan fuera del matcher.
- [ ] `pnpm build`. **Commit.**

### Task 5.4 — Fix del GET de staff + Zod `.max()`

**Files:** Modify `app/api/admin/staff/route.ts` + lo que A.3 haya encontrado.

- [ ] Según consumidores de A.3: el GET completo (emails, phones, lastLogin) exige `users.manage`. Para el dropdown de assignees crear `GET /api/admin/staff/options` (solo sesión) que devuelve únicamente `{ id, name }` de usuarios activos. Migrar los consumidores no-management al endpoint reducido.
- [ ] Agregar `.max()` a todos los campos string de los Zod schemas de: staff create/update, forgot/reset/invitation, y de paso `/api/quotes` (hallazgo Media pendiente de la auditoría: name `.max(255)`, email `.max(255)`, phone `.max(50)`, service `.max(255)`, message `.max(5000)`).
- [ ] `pnpm build`. **Commit.**

### Task 5.5 — Security headers (sin CSP)

**Files:** Modify `next.config.ts` (o `.mjs` según exista)

- [ ] `headers()` global: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY` (verificar que ninguna página del sitio se embebe en iframes propios antes de aplicar — si el page-builder/CMS embebe previews, scope el header solo a `/admin/:path*`).
- [ ] HSTS: verificar primero si Cloudflare ya lo inyecta (probable). Si no, `Strict-Transport-Security: max-age=31536000; includeSubDomains`. No duplicar.
- [ ] **NO agregar Content-Security-Policy** en ninguna variante (decisión explícita).
- [ ] `pnpm build`. **Commit.**

---

## Fase 6 — Registro de eventos de seguridad

### Task 6.1 — Schema + escritura

**Files:** Modify `schema.ts`; Create entity/repo mínimos.

```typescript
export const securityEventTypeEnum = pgEnum('security_event_type', [
  'login_success', 'login_failed', 'account_locked',
  'password_reset_requested', 'password_reset_completed',
  'invitation_sent', 'invitation_accepted',
  'user_deactivated', 'user_reactivated', 'permissions_changed',
])

export const securityEvents = pgTable('security_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => adminUsers.id, { onDelete: 'set null' }), // null si email desconocido
  type: securityEventTypeEnum('type').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6-safe
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'), // ej. { email: 'x@y.com' } en login_failed de cuenta inexistente
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_security_events_user').on(t.userId), index('idx_security_events_created').on(t.createdAt)])
```

- [ ] IP real: leer `CF-Connecting-IP` (Cloudflare delante) con fallback a `X-Forwarded-For` primer valor. Helper `getClientIp(request)` en `src/infrastructure/auth/`.
- [ ] Instrumentar: los puntos de las Fases 2–4 (login, lockout, reset, invitación) + `DeactivateStaffUserUseCase` + `SetStaffPermissionsUseCase`. La escritura del evento NUNCA rompe el flujo principal (try/catch con console.error).
- [ ] `pnpm build`. **Commit.**

### Task 6.2 — Vista de solo lectura

**Files:** Create `app/admin/(protected)/security/page.tsx` + `app/api/admin/security-events/route.ts` (GET paginado, permiso `settings.manage`).

- [ ] Tabla simple: fecha, tipo, usuario, IP, user agent truncado. Filtro por tipo. Paginación por cursor de `createdAt`. Sin acciones — solo lectura.
- [ ] Link en el sidebar del admin (visible solo con `settings.manage`).
- [ ] `pnpm build`. **Commit.**

---

## Verificación E2E final

- [ ] Boot del contenedor NO ejecuta seed (logs limpios). `npm run seed` con tabla poblada → no-op; sin env vars → aborta con mensaje.
- [ ] Forgot password: email existente → llega email, link resetea, login viejo password falla, nuevo funciona, **sesiones previas quedan invalidadas** (probar con dos navegadores). Email inexistente → misma respuesta HTTP, no llega nada.
- [ ] Token de reset: usado dos veces → segunda falla; expirado (manipular `expiresAt` en DB) → falla.
- [ ] Invitación: crear staff → email llega → set password → login OK → badge "pending" desaparece. Reenviar invitación invalida la anterior.
- [ ] Lockout: 5 passwords malos → sexto intento con password CORRECTO también falla durante 15 min → tras el lock, login OK y contador reseteado. Mensaje idéntico en todos los casos.
- [ ] Desactivar un staff con sesión abierta → su siguiente request lo expulsa al login.
- [ ] `curl` sin cookie a `/api/admin/leads` → 401 JSON del middleware.
- [ ] `getRounds` de un usuario pre-existente pasa de 10 a 12 tras su siguiente login.
- [ ] Headers presentes en respuesta de `/admin` (`curl -I`); CSP AUSENTE.
- [ ] Eventos visibles en `/admin/security` para cada acción anterior.
- [ ] `pnpm build` limpio.

## Reporte de cambios (obligatorio al cierre)

`docs/superpowers/reports/2026-07-XX-auth-hardening-report.md`: hallazgos de Fase A (especialmente A.1 con el mecanismo de seed encontrado), archivos creados/modificados, SQL de migraciones, decisión tomada sobre el caché de `sessionVersion` (Task 2.3), reglas de Cloudflare configuradas por Gustavo, y desviaciones justificadas.

## Fuera de alcance (roadmap futuro, NO implementar)

- **2FA TOTP** — descartado por decisión de producto en esta iteración; si se retoma, el diseño discutido (otplib, secret cifrado, recovery codes, obligatorio para owner) queda en el historial de la conversación de diseño.
- **Content-Security-Policy** — excluida explícitamente; si se retoma, empezar en modo Report-Only por el uso de GSAP/Three.js e inline styles del admin.
- Passkeys/WebAuthn, SSO corporativo, rotación forzada de passwords por antigüedad (anti-patrón según NIST — no implementar aunque se pida sin discusión previa).
