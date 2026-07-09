# Compliance & Legal Pages v2 — Módulo CMS, Estructura de Dos Dominios y Validación de Anchors

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Fecha:** 2026-07-09
**Proyecto:** Contigo Constructions Platform v1.1
**Reemplaza a:** `2026-07-06-compliance-legal-pages.md` (v1)
**Estado:** Ready for execution — 1 placeholder pendiente (registered address)

---

## 0. Changelog v1 → v2

| # | Cambio | Fuente |
|---|--------|--------|
| 1 | Separación en dos dominios: Website (plataforma digital) vs Service (prestación del servicio de construcción). T&C se divide en `website-terms` y `service-terms`. 5 → 6 documentos. | Decisión Gustavo, 2026-07-09 |
| 2 | Identificación de entidad: "Contigo Constructions Pty Ltd, trading as Contigo Constructions". DOSORIO CARPENTRY (presente en registro CBS) NO se menciona — sin uso comercial actual. | Registro CBS + confirmación Gustavo |
| 3 | Alcance de servicios anclado a la licencia: Building Work Contractor with conditions — Carpentry and Joinery (BLD 357596). Servicios fuera de condiciones → "delivered in coordination with appropriately licensed trade professionals". | Registro CBS |
| 4 | Validez de cotizaciones: 14 días, sin cláusula de excepción. | Email Anamaria, punto 3 |
| 5 | Garantías: redacción genérica — legislación SA aplicable + contrato firmado por proyecto. Sin mención de períodos estatutarios específicos. | Email Anamaria, punto 5 + respuesta cuestionario |
| 6 | Fotografías: cláusula combinada (a) imágenes publicadas con autorización de clientes + (b) derecho de uso para marketing/portafolio/web/redes conforme a contratos firmados. Complemento en Privacy Policy: nunca se publican direcciones ni datos de propietarios/propiedades. | Email Anamaria, punto 6 + respuestas 4-5 |
| 7 | Third-party providers: redacción genérica ("reputable technology providers, some located overseas"). Sin mención de OpenAI ni detalles técnicos internos. Única excepción futura: Google (su ToS exige incorporación por referencia). Consultor legal tiene última palabra. | Email Anamaria, puntos 4 y decisión posterior |
| 8 | Dirección: `[REGISTERED ADDRESS — TO CONFIRM]`. Discrepancia detectada: CBS registra 25 Green Ave Seaton SA 5023; operación confirmada en 76 Coorara Ave Payneham South SA 5070. Pendiente respuesta de Anamaria (¿registered vs place of business? ¿actualizar CBS?). | Registro CBS vs SEO doc v4 |
| 9 | Sistema de validación de anchors requeridos por integraciones (Google, Meta) en el flujo de publicación. | Requisitos verificados en docs oficiales Google Maps Platform / Meta Developer |
| 10 | Auditabilidad reforzada: `contentHash` (SHA-256), `publishedBy`, evento en `security_events` al publicar. | Best practices sesión 2026-07-09 |

---

## 1. Objetivo

Módulo de Compliance gestionable desde el CMS con versionado inmutable, estructura de dos dominios legales, validación de anchors requeridos por integraciones de terceros, y trazabilidad completa de decisiones — preparado para revisión por consultores legales externos y para las integraciones futuras (Google Places/Reviews, Meta, Xero) sin reescritura.

**⚠️ Nota legal:** los textos son borradores técnicos. Publicación condicionada a aprobación del consultor legal australiano. El consultor tiene la última palabra sobre redacción de cláusulas third-party (decisión registrada, changelog #7).

---

## 2. Estructura de dos dominios — 6 documentos

### Dominio A — La plataforma digital (el sitio web y sus features)

| Doc | Slug | Cubre |
|-----|------|-------|
| Website Terms of Use | `website-terms` | Uso aceptable (spam, scraping, ataques, ingeniería inversa) · IP del sitio (fotos, textos, logo, código) · Disponibilidad y cambios · Enlaces externos · **Third-Party Content & Services** (bloque de incorporación por referencia — hook Google) · Governing law (SA) |
| Privacy Policy | `privacy-policy` | Datos capturados (formularios, uploads, portal de tracking, mensajería) · Finalidades · Almacenamiento y retención · Providers genéricos + overseas (APP 8 genérico) · Spam Act · NDB scheme · **Access, Correction & Deletion** (anchor estable `#data-deletion` — hook Meta) · Protección de imágenes de proyectos (sin direcciones ni datos de propietarios) · Future integrations · OAIC |
| Cookie Policy | `cookie-policy` | Esenciales (sesión admin, token tracking) · Preferencias · Placeholder analytics · Third-party futuras (Google) · Gestión en navegador · Sin banner (disclosure-only, AU) |
| Accessibility Statement | `accessibility` | Objetivo WCAG 2.1 AA · Medidas verificadas contra sitio real · Limitaciones conocidas (animaciones GSAP) · Canal de reporte · Revisión anual |

### Dominio B — El servicio de construcción

| Doc | Slug | Cubre |
|-----|------|-------|
| Service & Quotation Terms | `service-terms` | Identificación y licencia (BLD 357596, Carpentry & Joinery, cláusula de trades licenciados para servicios fuera de condiciones) · Cotizaciones (14 días, estimativas, sujetas a inspección, no vinculantes) · Contratación (contrato escrito separado; Building Work Contractors Act 1995 (SA) donde aplique) · Garantías (genérica: legislación SA + contrato por proyecto) · Consumer guarantees (ACL, no excluibles) · **Project imagery & marketing** (cláusula combinada changelog #6) · Limitación de responsabilidad subordinada a ACL |

### Transversal

| Doc | Slug | Cubre |
|-----|------|-------|
| Disclaimer | `disclaimer` | Información general · Errores y omisiones · Imágenes representativas · Enlaces externos · ACL preserved. Se mantiene como página independiente (directorios de trades piden link directo). |

### Artefactos técnicos (no CMS)

- `/.well-known/security.txt` (RFC 9116) — route handler estático
- `app/sitemap.ts` — incluye los 6 documentos legales
- `/legal` — página índice: lista los 6 documentos con effective date y dominio (A/B)

**Regla editorial transversal:** ningún documento del Dominio A puede contener obligaciones del servicio de construcción, y viceversa. Cross-references permitidas solo como links ("For terms governing our construction services, see Service & Quotation Terms").

---

## 3. Arquitectura del módulo

### 3.1 Schema (Drizzle)

```typescript
export const legalDocumentStatusEnum = pgEnum('legal_document_status', [
  'draft', 'in_review', 'published', 'archived',
])

export const legalDomainEnum = pgEnum('legal_domain', [
  'website', 'service', 'general',
])

export const legalDocuments = pgTable('legal_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull(),
  domain: legalDomainEnum('domain').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),                          // Markdown, sin HTML crudo
  contentHash: varchar('content_hash', { length: 64 }),        // SHA-256, set al publicar
  version: integer('version').notNull().default(1),
  status: legalDocumentStatusEnum('status').notNull().default('draft'),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedBy: uuid('published_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  reviewNote: text('review_note'),                             // p.ej. "Approved by [consultant] 2026-07-20"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_legal_slug_version').on(t.slug, t.version),
  index('idx_legal_slug_status').on(t.slug, t.status),
])
```

Estado `in_review` nuevo: draft enviado al consultor. Flujo: `draft → in_review → published → archived`. Publicar archiva la versión publicada anterior en la misma transacción. Las filas `published`/`archived` son inmutables (guard en el repositorio: UPDATE solo permitido sobre `draft`/`in_review`, y de `in_review` solo hacia `reviewNote`/`status`).

### 3.2 Registro de anchors requeridos (validación de integraciones)

Configuración en código (no en DB — cambia con deploys de integraciones, no con ediciones de contenido):

```typescript
// src/core/config/legal-requirements.ts
export interface LegalAnchorRequirement {
  anchorId: string          // id slugificado del heading H2
  requiredBy: string        // integración que depende del anchor
  reference: string         // URL de la exigencia (para auditoría)
  active: boolean           // false = integración aún no en producción
}

export const LEGAL_ANCHOR_REQUIREMENTS: Record<string, LegalAnchorRequirement[]> = {
  'privacy-policy': [
    {
      anchorId: 'data-deletion',
      requiredBy: 'meta-platform',
      reference: 'https://developers.facebook.com/docs/development/terms-and-policies/privacy-policy/',
      active: false,   // activar al integrar Instagram/Facebook
    },
    {
      anchorId: 'third-party-services',
      requiredBy: 'google-maps-platform',
      reference: 'https://developers.google.com/maps/documentation/places/web-service/policies',
      active: false,   // activar al integrar Places API
    },
  ],
  'website-terms': [
    {
      anchorId: 'third-party-content-and-services',
      requiredBy: 'google-maps-platform',  // ToU debe incorporar Google ToS por referencia
      reference: 'https://developers.google.com/maps/documentation/places/web-service/policies',
      active: false,
    },
  ],
}
```

**Generación de IDs:** el pipeline Markdown→HTML (rehype-slug) genera IDs slugificados de headings H2/H3. Determinístico: mismo heading → mismo id.

**Validación en `PublishLegalDocumentUseCase`:**

```typescript
// Pseudoflujo dentro del use case
const anchors = extractHeadingIds(markdown)            // mismo slugger que el render
const requirements = LEGAL_ANCHOR_REQUIREMENTS[slug] ?? []
const missing = requirements.filter(r => r.active && !anchors.includes(r.anchorId))
if (missing.length > 0) {
  throw new MissingRequiredAnchorsError(slug, missing) // 422 con detalle en admin UI
}
const softMissing = requirements.filter(r => !r.active && !anchors.includes(r.anchorId))
// softMissing → warning no bloqueante en la UI de publish
```

Regla de operación: **al activar una integración (Google/Meta), el mismo PR que la activa cambia `active: true`** — desde ese momento es imposible publicar una versión de la política que rompa la URL registrada ante el tercero.

### 3.3 Capas

```
src/core/entities/LegalDocument.ts
src/core/config/legal-requirements.ts
src/core/repositories/ILegalDocumentRepository.ts
    getPublished(slug)
    getVersionEffectiveAt(slug, date)        // vigencia temporal consultable
    listCurrent()                             // última versión por slug (admin + /legal index)
    listVersions(slug)
src/application/use-cases/legal/
    GetPublishedLegalDocumentUseCase.ts
    ListLegalDocumentsUseCase.ts
    SaveLegalDocumentDraftUseCase.ts
    SubmitForReviewUseCase.ts                 // draft → in_review
    PublishLegalDocumentUseCase.ts            // valida anchors, calcula contentHash,
                                              // archiva anterior, revalida paths,
                                              // security_events: legal_document_published
src/infrastructure/repositories/DrizzleLegalDocumentRepository.ts
src/infrastructure/markdown/legal-markdown.ts // pipeline compartido render + extractHeadingIds
```

### 3.4 Rutas y render

```
app/(marketing)/legal/page.tsx           — índice de 6 documentos por dominio
app/(marketing)/legal/[slug]/page.tsx    — SSR, generateStaticParams, revalidate 3600
app/admin/(protected)/legal/             — listado + editor + historial
app/api/admin/legal/**                   — CRUD + submit-review + publish (permiso legal.manage)
app/.well-known/security.txt/route.ts
app/sitemap.ts
```

Render público: `react-markdown` + `remark-gfm` + `rehype-slug` + `rehype-sanitize` (schema estricto, sin HTML crudo). Página muestra: título, "Last updated: {effectiveDate}", dominio como subtítulo discreto ("Applies to: use of this website" / "Applies to: our construction services"), contenido, y `<!-- v{version} {contentHash} -->` en comentario HTML. CSS `@media print`: oculta nav/footer/animaciones, tipografía serif legible — los consultores y clientes imprimen estas páginas.

Al publicar: `revalidatePath('/legal/{slug}')` + `revalidatePath('/legal')` + `revalidatePath('/sitemap.xml')`. Nada más.

### 3.5 Admin UI (`/admin/legal`)

- Listado agrupado por dominio con status badge, versión, effective date, y columna "Required anchors" (✓/⚠ según registro).
- Editor Markdown con preview (pipeline idéntico al público) y panel lateral de anchors detectados vs requeridos en tiempo real.
- Acciones: Save Draft → Submit for Review (adjunta `reviewNote`) → Publish (modal con diff resumido versión publicada vs candidata + confirmación). History: tabla read-only con versión, hash, quién publicó, cuándo.
- Permiso granular `legal.manage`. Publish adicional: solo roles owner/admin.

---

## 4. Footer

**Desktop:** columna "Legal" con los 6 links agrupados sutilmente (Website / Services) + línea de credenciales bajo el copyright:
`Contigo Constructions Pty Ltd · ABN 25 698 028 394 · BLD Licence 357596 · Member, Master Builders SA`

**Mobile (minimalismo de rigor):** sin acordeones ni columnas. Micro-línea única bajo el copyright:

```
Privacy · Website Terms · Service Terms · Cookies · Disclaimer · Accessibility
```

Alegreya Sans ~11px, color `#6B6B68`, separadores middot en gold `#B8962E`, `flex-wrap` con `column-gap`, padding vertical 12px por link (target táctil WCAG 2.5.8 sin ruido visual). Si en QA visual la línea resulta larga en 360px, fallback aprobado: un solo link "Legal" → `/legal` (la página índice ya existe como destino).

Los links del footer se leen de `listCurrent()` — un documento sin versión publicada no aparece (nunca un 404 desde el footer).

---

## 5. Fases de ejecución

### Fase 0 — Pre-audit
- [ ] `git log -1` en `main` para anclar referencia. Confirmar estado del merge de auth-hardening (reutilizamos `security_events`).
- [ ] Verificar pipeline Markdown existente en el repo (¿ya hay react-markdown/rehype? evitar duplicar).
- [ ] Confirmar sistema de permisos vigente para registrar `legal.manage`.

### Fase 1 — Schema + dominio
- [ ] Enums + tabla `legal_documents`, migración en staging.
- [ ] Entity con guards de inmutabilidad, repository interface + Drizzle impl, `legal-requirements.ts`, pipeline `legal-markdown.ts` (render + extractHeadingIds compartidos).
- [ ] 5 use cases. Tests del use case de publish: anchors faltantes activos (bloquea), inactivos (warning), hash calculado, archivado transaccional.
- [ ] `pnpm build`. **Commit.**

### Fase 2 — API + seed
- [ ] Endpoints admin (CRUD, submit-review, publish). Auth in-handler + `legal.manage`; publish restringido a owner/admin. Zod con `.max()`.
- [ ] Evento `legal_document_published` en `security_events` (payload: slug, version, hash, userId).
- [ ] Seed `seed:legal`: 6 documentos en `draft` con contenido §6 (placeholders de dirección incluidos).
- [ ] `pnpm build`. **Commit.**

### Fase 3 — Páginas públicas
- [ ] `/legal` índice + `/legal/[slug]` con metadata, print CSS, comentario de versión/hash.
- [ ] `security.txt` + `sitemap.ts`.
- [ ] Footer desktop + mobile según §4.
- [ ] `pnpm build`. **Commit.**

### Fase 4 — Admin UI
- [ ] Listado, editor con panel de anchors, flujo review, publish con diff, history.
- [ ] `pnpm build`. **Commit.**

### Fase 5 — Contenido v2 (inglés)
- [ ] Redactar los 6 documentos aplicando el changelog completo (§0) y la regla de separación de dominios.
- [ ] Resolver placeholder de dirección con respuesta de Anamaria (si CBS requiere actualización, anotarlo como acción del cliente, fuera de alcance).
- [ ] Regenerar docx preview v2 para el consultor con matriz de trazabilidad (§7) como anexo.
- [ ] Cargar textos al seed. Estado `in_review` al enviarse al consultor.

### Fase 6 — Auditoría + cierre
- [ ] Auditar implementación contra este plan (incluye: intentar publicar sin anchor activo → debe fallar; editar fila published → debe fallar; footer mobile en 360/390/430px).
- [ ] Crear `09-Compliance-y-Legal.md`; actualizar docs 02, 03, 05, 07.
- [ ] Closing report.

**Post-aprobación del consultor:** publicar v1 de los 6 documentos con `reviewNote` de aprobación. Toda edición posterior nace como v2 draft — el texto aprobado es inalterable.

---

## 6. Outlines de contenido v2 (para Fase 5)

**website-terms:** About these terms (entidad: Contigo Constructions Pty Ltd, trading as Contigo Constructions, ABN, `[REGISTERED ADDRESS]`) · Use of the website · Acceptable use · Intellectual property · Third-Party Content & Services *(H2 → anchor `third-party-content-and-services`; texto base neutro + espacio para incorporación Google al activarse)* · Availability & changes · Links · Governing law (SA) · Contact.

**privacy-policy:** Who we are · What we collect · Why · Storage & security ("industry-standard security measures", sin detalles internos) · Third-party providers *(genérico per changelog #7; H2 → `third-party-services`)* · Overseas disclosure (genérico, "including the United States") · Marketing emails (Spam Act) · Cookies (link) · Project imagery & your privacy (nunca direcciones/datos de propietarios) · Access, Correction & Deletion *(H2 → `data-deletion`; mailto + 30 días de respuesta)* · Data breaches (NDB) · Future integrations · Complaints (OAIC) · Contact.

**service-terms:** Who provides the services (licencia BLD 357596 Carpentry & Joinery; cláusula trades licenciados) · Scope of services (redacción ampliada anclada a licencia + categorías del sitio) · Quotations (14 días, estimativas, sujetas a inspección, no vinculantes) · Engagement (contrato escrito; BWCA 1995 SA donde aplique) · Warranties (genérica SA + contrato) · Consumer guarantees (ACL) · Project imagery & marketing (cláusula combinada) · Liability (subordinada a ACL) · Contact.

**cookie-policy / disclaimer / accessibility:** según v1 con ajustes menores (identificación de entidad, genericidad de providers, verificación de claims de accesibilidad contra sitio real antes de publicar).

---

## 7. Matriz de trazabilidad (anexo del preview v2 para consultores)

Tabla por cláusula sensible: *Cláusula → Documento/sección → Decisión → Fuente → Fecha*. Cubre como mínimo: identificación de entidad y trading name, dirección (con nota de discrepancia CBS), alcance de licencia y cláusula de trades, 14 días, garantías genéricas, cláusula de imágenes, genericidad de providers, ausencia de banner de cookies, anchors requeridos por Google/Meta con URLs de referencia. Objetivo: que el consultor pueda validar cada decisión contra su origen sin reconstruir el hilo de emails.

---

## 8. Open items

1. **Registered address** — pendiente Anamaria (Coorara vs Green Ave; ¿actualizar registro CBS?). Bloquea Fase 5, no las Fases 0-4.
2. **Redacción final de cláusulas third-party** — consultor legal, última palabra (decisión registrada).
3. **Verificación de claims de accesibilidad** contra el sitio vivo (incluye `prefers-reduced-motion` en secciones GSAP) antes de publicar `accessibility`.
