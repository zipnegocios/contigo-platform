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
