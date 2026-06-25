# Reestructuración de Services — Taxonomía 4 Categorías, Admin Unificado y Página Pública `/services`

> **Para agentes (Claude Code):** Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar este plan fase por fase. Los pasos usan checkboxes (`- [ ]`). **No incluir pasos de `git add` / `commit` / `push`** — Gustavo gestiona el control de versiones manualmente. Al cerrar cada fase, producir un resumen de cambios (qué se creó, qué se modificó, qué quedó pendiente) en lugar de un commit. Si alguna ambigüedad aparece durante la ejecución, detenerse y preguntar — no asumir.

**Goal:** Reemplazar el "Atelier Index" de 10 disciplinas en `/services` por una nueva taxonomía de 4 categorías (Carpentry, Cladding, Gyprock Fixing & Flushing, Additional Services) con filtro tipo tabs + grid de cards mobile-first, unificar la gestión de categorías en el admin (hoy separada en dos tabs Project/Service), y completar la "Ficha de Servicio completa" por cada uno de los 30 sub-servicios — la Fase 2 que había quedado diferida en el spec `docs/superpowers/specs/2026-06-09-services-index-design.md`.

**Architecture:** Clean Architecture existente (domain → application → infrastructure → presentation). Todo el contenido nuevo vive en las tablas ya existentes `categories` (taxonomía jerárquica) y `services` (contenido de cada ficha) — no se crean tablas nuevas, solo se reutilizan y se completan datos. SSG vía `generateStaticParams` para SEO en las 4 categorías y los 30 ítems.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Drizzle ORM, PostgreSQL 15, GSAP (stagger de entrada), Tailwind CSS, design tokens existentes (`--brand-gold`, `--atelier-ink`, `--atelier-ivory`, Cormorant Garamond / Space Grotesk).

---

## 0. Decisiones de alcance ya tomadas

1. **El Atelier Index se reemplaza**, no convive. Las 6 disciplinas fuera de la nueva lista (New Home Building, Home Extensions, Home Renovations, Landscaping standalone, Internal & External Painting standalone, Render & Solid Plastering, Venetian Plastering) se **desactivan** (`isActive=false`) en `categories` — nunca se eliminan, quedan recuperables.
2. **Unificación de `admin/categories`** = una sola interfaz/árbol de gestión, sin tabs duplicados Project/Service. El campo `type` se conserva (sigue discriminando `projects.categoryId` vs `services.categoryId`); no hay fusión semántica de taxonomías — un proyecto y un servicio nunca comparten el mismo nodo.
3. **Cada card enlaza a su Ficha de Servicio completa**, controlable desde el admin vía el campo `services.published` ya existente (`true` = card con botón de enlace, `false` = card sin botón).
4. **Imágenes:** se asignan al azar desde los assets ya existentes como placeholder; el equipo las reemplaza después por foto real. **Íconos:** se diseñan 30 SVG nuevos, uno por sub-servicio (Fase 3).
5. **SEO:** cada categoría y cada ficha es una URL real e indexable con `generateStaticParams` — el filtro no es 100% client-side.
6. **Copy:** los `shortDescription` y `fullDescription` de los 30 ítems se redactan en inglés AU con el tono de marca ya usado en `serviceMeta.ts` / `Services Contigo Constructions.md` (ver §4). El equipo de Contigo los revisa y ajusta después.

### § Pregunta abierta (bloquea solo el contenido de la Fase 1)

¿El orden interno de los 11 ítems de Carpentry y los 11 de Additional Services debe respetar el orden en que los escribiste originalmente, o tienes un orden de prioridad distinto (ej. los servicios más solicitados primero)?
**Asunción si no se responde antes de ejecutar:** se usa el orden tal cual fue listado en el mensaje original.

---

## 1. Mapa de rutas resultante

```
/services                              → redirect a /services/carpentry
/services/carpentry                    → grid de 11 cards (tab activo)
/services/cladding                     → grid de 4 cards
/services/gyprock-fixing-flushing      → grid de 4 cards
/services/additional-services          → grid de 11 cards
/services/[category]/[item-slug]       → Ficha de Servicio completa (404 si services.published=false)
```

Los 4 tabs son `<Link>` reales (no solo estado de cliente) — cambiar de tab navega a una URL distinta, indexable y compartible.

---

## 2. Fase 0 — Auditoría previa obligatoria (antes de tocar nada)

Ya existen filas parciales en la BD que no calzan 1:1 con la lista nueva. Antes de migrar, correr una auditoría de **solo lectura**:

- [ ] Confirmar `id` y `slug` reales de las categorías root `Carpentry`, `Cladding`, `Gyprock Fixing & Flushing` (ya existen desde el seed original de 10 disciplinas en `scripts/seed-categories.ts`).
- [ ] Listar sus sub-categorías actuales. Diferencias ya detectadas que hay que resolver:
  - Carpentry tiene hoy `Decking & Pergolas` como un solo ítem → la lista nueva pide **dos** ítems separados: `Deck` y `Pergola`. Desactivar el ítem combinado, crear los dos nuevos.
  - Cladding tiene hoy 8 sub-ítems (incluye `ExoTec Facade`, `Foam`, `Matrix`, `Stria`) → la lista nueva solo pide 4 (`Axon`, `Blueboard`, `Hebel`, `Weatherboard`). Desactivar los 4 sobrantes.
  - Gyprock Fixing & Flushing tiene hoy 10 sub-ítems → la lista nueva solo pide 4. Desactivar los 6 restantes (`Commercial & Retail Fitouts`, `Fire-Rated Systems`, `Garage & Shed Conversions`, `Metal Stud & Track Framing`, `Partition Walls`, `Raked & Shadow Line Ceilings`). El nombre `Water-Resistant Boarding` ya coincide tal cual, no requiere cambio.
- [ ] Confirmar si `DrizzleCategoryRepository.findAll` / `findFlat` ya filtran por `isActive`. **Hoy no lo hacen** (revisado en `src/infrastructure/repositories/DrizzleCategoryRepository.ts`) — sin este filtro, desactivar las 6 disciplinas viejas no tendría ningún efecto visual en el Atelier Index actual ni en el admin.
- [ ] Revisar `src/presentation/components/admin/ProjectForm.tsx` (o el componente equivalente) para confirmar cómo selecciona hoy la categoría de un proyecto — necesario antes de tocar `CategoryManagerClient` en la Fase 2.
- [ ] Revisar si hay filas huérfanas en `services` de versiones previas del prototipo que convenga limpiar o desactivar también.

---

## 3. Fase 1 — Migración de datos y taxonomía

**Files:**
- Create: `scripts/seed-services-taxonomy-2026-06.ts`
- Modify: `src/infrastructure/repositories/DrizzleCategoryRepository.ts` (filtro `isActive`)

**Descripción:** Script idempotente (mismo patrón `upsertCategory` por slug+type que `seed-categories.ts`) que:

1. Reutiliza los `id` existentes de Carpentry, Cladding y Gyprock Fixing & Flushing (los busca por slug, no los recrea).
2. Crea la categoría root nueva `Additional Services`.
3. Fija `orderIndex` de los 4 roots: Carpentry=0, Cladding=1, Gyprock Fixing & Flushing=2, Additional Services=3.
4. Crea/ajusta las 30 sub-categorías como hijas (`parentId`) según el catálogo del §4.
5. Desactiva (`isActive=false`, nunca `DELETE`) las 6 disciplinas root fuera de lista y los sub-ítems sobrantes señalados en la Fase 0.
6. Crea una fila en `services` por cada uno de los 30 sub-ítems: `shortDescription` + `fullDescription` (del §4), `categoryId` apuntando al leaf correspondiente, `imageUrl` tomado al azar de los assets existentes en `/public/assets/service-*.jpg` como placeholder, `published: false` (el equipo activa cada ficha al revisarla), `orderIndex` según el orden listado.

```typescript
// scripts/seed-services-taxonomy-2026-06.ts (esqueleto — completar el detalle de upsert
// reutilizando las funciones de scripts/seed-categories.ts donde aplique)
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and } from 'drizzle-orm'
import * as schema from '../src/infrastructure/db/schema'

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

const ROOT_ORDER = [
  'Carpentry',
  'Cladding',
  'Gyprock Fixing & Flushing',
  'Additional Services',
] as const

// Roots a desactivar (no borrar)
const DEACTIVATE_ROOT_SLUGS = [
  'new-home-building',
  'home-extensions',
  'home-renovations',
  'landscaping',
  'internal-external-painting',
  'render-solid-plastering',
  'venetian-plastering',
]

// Sub-categorías a desactivar dentro de Carpentry / Cladding / Gyprock
const DEACTIVATE_CHILD_NAMES = [
  'Decking & Pergolas',
  'ExoTec Facade',
  'Foam',
  'Matrix',
  'Stria',
  'Commercial & Retail Fitouts',
  'Fire-Rated Systems',
  'Garage & Shed Conversions',
  'Metal Stud & Track Framing',
  'Partition Walls',
  'Raked & Shadow Line Ceilings',
]

// ... lógica de upsert por slug+type (reutilizar makeSlug de seed-categories.ts),
// luego insertar/actualizar filas en `services` con el catálogo del §4.
```

**Steps:**

- [ ] Paso 1: Con los `id` confirmados en la Fase 0, ajustar el script para reutilizar Carpentry/Cladding/Gyprock sin recrearlos.
- [ ] Paso 2: Upsert de la categoría root `Additional Services` + las 30 sub-categorías.
- [ ] Paso 3: Desactivación (`isActive=false`) de roots y sub-ítems obsoletos listados arriba.
- [ ] Paso 4: Insert de las 30 filas en `services` con el catálogo de copy del §4 (`published: false`).
- [ ] Paso 5: Agregar parámetro `activeOnly` (default `true`) en `findAll`/`findFlat` de `DrizzleCategoryRepository`, para que el público solo vea categorías activas pero el admin pueda seguir viendo las inactivas si lo necesita.
- [ ] Paso 6: Ejecutar en local/staging. Verificar: 4 roots activos, 30 hijos activos, 30 filas en `services`, conteos de desactivados coherentes con la Fase 0.

---

## 4. Catálogo de contenido (copy en inglés AU, tono de marca)

### 4.1 Categorías raíz

| Slug | Tagline | Support |
|---|---|---|
| `carpentry` | Precision in every cut, soul in every finish. | Decking, pergolas, staircases and fine interior joinery, in timber chosen to thrive in South Australian conditions. |
| `cladding` | The shield your home wears well. | Weather-tight, thermally sharp and visually striking, with Hebel, Axon and Weatherboard detailed to the millimetre. |
| `gyprock-fixing-flushing` | Flawless surfaces, ready for the spotlight. | Expert plasterboard for new builds and luxury renovations: raked ceilings, bulkheads and fire-rated systems with tight, true lines. |
| `additional-services` | Every trade your project needs, under one roof. | From design and engineering to the final coat of paint, the specialist trades that complete a Contigo build — coordinated, vetted and held to the same standard as our core craft. |

### 4.2 Carpentry (11 ítems)

| # | Name | shortDescription (card) | fullDescription (ficha) |
|---|---|---|---|
| 1 | 1st Fix & 2nd Fix | Structural framing through to final trims — the two-stage carpentry sequence that shapes every build. | First fix lays down the structural bones of a build — framing, flooring and roof carpentry — before walls close in. Second fix follows after plastering, fitting skirting, architraves, doors and cabinetry to a precise, paint-ready finish. We sequence both stages tightly with the rest of the trades, so nothing is rushed and nothing is redone. |
| 2 | Architraves & Skirting | Crisp, true-line trims that frame doors, windows and floors with a tailored finish. | Architraves and skirting are the quiet detail that makes a room feel finished. We mitre, scribe and fix every length by hand, in profiles to match heritage detailing or clean contemporary lines, for a result that reads as seamless from every angle. |
| 3 | Deck | Outdoor decking built to handle the South Australian sun, engineered to last for decades. | From a simple entertaining platform to a multi-level timber deck, we engineer the substructure for real load and weather exposure before a single board is laid. Hardwood, composite or treated pine — detailed with hidden fixings and proper drainage falls so it stays solid for decades. |
| 4 | Pergola | Custom pergolas that extend your living space outdoors, built to council-compliant standard. | A pergola should earn its place in the garden, not just sit in it. We design and build to suit the orientation of your block — open rafters for dappled light, or a fully battened roof for shade — with engineering and approvals handled end to end. |
| 5 | Eaves & Fencing | Weatherproof eaves detailing and boundary fencing, finished to match the rest of the home. | Eaves protect a home's envelope from wind-driven rain and pests, and we detail them to seal properly the first time. Our fencing work covers boundary, paling and feature fencing, built plumb and true and finished to sit comfortably alongside the main build. |
| 6 | General Repairs & Maintenance | Responsive carpentry repairs — sticking doors, rotten boards, loose joinery — fixed properly, not patched. | Not every job is a renovation. Our maintenance carpentry covers the everyday wear of an older or busy home: doors that stick, timber that's rotted, joinery that's come loose. We diagnose the actual cause before we fix it, so the repair holds. |
| 7 | Interior & Exterior Doors | Supply and installation of interior and exterior doors, hung true and sealed for performance. | A door that's hung even slightly out of square will fight you every day. We install interior and exterior doors — hinged, sliding or cavity — checking frame, level and clearances before fixing, and finish with hardware that operates smoothly from day one. |
| 8 | Renovations & Extensions | Carpentry for renovations and extensions, matched seamlessly to the existing structure. | Tying new carpentry into an existing home is the hardest kind of joinery — nothing is ever quite standard. We match existing profiles, ceiling heights and structural lines so an extension reads as original, not added on. |
| 9 | Shop Fitouts | Commercial fitout carpentry built for durability, fast turnaround and council compliance. | Retail and hospitality fitouts run on tight deadlines and even tighter durability requirements. Our shop fitout carpentry covers framing, joinery and fixtures built to commercial standard, programmed to get a tenancy trading on schedule. |
| 10 | Staircases & Studwork | Structural studwork and staircases built to engineered specification, from frame to final tread. | Staircases carry both structural load and visual weight in a home, so we build them to engineered specification from the stringers up. Our studwork framing follows the same discipline — true, plumb and ready for the trades that follow. |
| 11 | Verandahs | Verandahs that extend a home's street presence and outdoor living, built to match its character. | A verandah sets the tone for a home before you even reach the front door. We build to match existing roof lines and period detailing where it counts, or design a clean contemporary verandah for a newer build — engineered, council-approved and built to last. |

### 4.3 Cladding (4 ítems)

| # | Name | shortDescription (card) | fullDescription (ficha) |
|---|---|---|---|
| 1 | Axon | Vertically-jointed Axon cladding panels, fixed for a sharp, linear façade finish. | Axon panel cladding gives a façade crisp, consistent vertical lines with minimal visible jointing. We fix to manufacturer specification over a properly prepared frame, so the finish stays straight and weather-tight for the life of the building. |
| 2 | Blueboard | Blueboard base sheeting for rendered façades, fixed and jointed to a true, render-ready surface. | Blueboard is the substrate behind many of Adelaide's rendered façades, and getting the fixing and jointing right underneath is what stops cracking later. We install to a flat, true plane so the render coat over the top performs as it should. |
| 3 | Hebel | Hebel PowerPanel cladding installation — lightweight, fire-rated and thermally efficient. | Hebel PowerPanel gives a home the thermal and acoustic performance of masonry at a fraction of the weight. We install to engineered fixing patterns and seal every joint correctly, so the panel performs as designed against weather and fire. |
| 4 | Weatherboard | Timber and composite weatherboard cladding, fixed with consistent reveals for a classic finish. | Weatherboard remains one of the most enduring looks for an Adelaide home, and the finish lives or dies on consistent reveals and tight end-joints. We fix in timber or low-maintenance composite, detailed properly around openings and corners. |

### 4.4 Gyprock Fixing & Flushing (4 ítems)

| # | Name | shortDescription (card) | fullDescription (ficha) |
|---|---|---|---|
| 1 | Acoustic & Suspended Ceilings | Suspended ceiling systems with acoustic-rated plasterboard for sound control between levels and rooms. | Suspended grid and acoustic plasterboard ceilings reduce noise transfer between rooms and levels while concealing services cleanly above. We install to the specified acoustic rating, with true, level lines across the whole ceiling plane. |
| 2 | Bulkheads & Pelmet Boxes | Custom bulkheads and pelmet boxes, framed and sheeted for sharp, geometric ceiling lines. | Bulkheads and pelmet boxes hide services and create clean architectural lines at the same time. We frame to the exact geometry in the drawings, then sheet and finish to a crisp, shadow-free result that reads as deliberate, not boxed-in. |
| 3 | Residential Plasterboard Fixing | Full plasterboard fixing for new builds and renovations, with tight joints and a smooth finish. | Plasterboard fixing sets the standard for every wall and ceiling that follows it — paint, tiling, render all show its flaws if it's rushed. We fix, set and sand to a smooth, true finish across new builds and renovation work alike. |
| 4 | Water-Resistant Boarding | Water-resistant plasterboard for bathrooms, laundries and wet areas, fixed to waterproofing standard. | Wet areas need a board that can handle moisture without breaking down, fixed in a way that supports the waterproofing membrane that follows. We install WR boarding to manufacturer and Australian Standard requirements in every bathroom and laundry we fit out. |

### 4.5 Additional Services (11 ítems)

| # | Name | shortDescription (card) | fullDescription (ficha) |
|---|---|---|---|
| 1 | Design & Drafting | Concept design and construction drawings, prepared in-house to keep your project moving. | Every build starts with a drawing that actually works on site. Our design and drafting service takes a brief from concept through to construction-ready documentation, coordinated with engineering and council requirements from the outset. |
| 2 | Electrical & Plumbing | Licensed electrical and plumbing trades, coordinated as part of the full build program. | We work with licensed electrical and plumbing contractors who know our standards and our schedule, so rough-in and fit-off happen exactly when the build needs them — no waiting, no clashing with other trades. |
| 3 | Engineering | Structural engineering for footings, framing and load-bearing work, sized correctly the first time. | Underbuilt structure is a liability and overbuilt structure is wasted budget. We engage structural engineers early to size footings, beams and framing correctly for the site and the load, with documentation council can approve without delay. |
| 4 | Painting | Interior and exterior painting with proper preparation, for a finish that lasts. | Paint only looks as good as the surface beneath it. Our painting work includes the preparation most quotes skip — filling, sanding and priming — before a premium coating system goes on, inside and out. |
| 5 | Roofing & Guttering | Roofing and guttering installation and repair, detailed to shed South Australian storms properly. | A roof only has one job — keep the weather out — and the detailing around penetrations, valleys and gutters is where that usually fails. We install and repair roofing and guttering to a standard that holds up to Adelaide's storm season. |
| 6 | Windows & Glazing | Window and glazing supply and installation, sealed and flashed to manufacturer specification. | Windows are one of the most common sources of water ingress when they're flashed incorrectly. We supply and install windows and glazing with proper sealing and flashing detail, so the opening performs as well as the glass itself. |
| 7 | Landscaping | Hard and soft landscaping that extends your home's design into the garden. | We treat the garden as part of the build, not an afterthought — paving, retaining walls, turf and planting designed to suit Adelaide's climate and to sit naturally alongside the architecture of the home. |
| 8 | Bathroom Renovation | Full bathroom renovations, from waterproofing and tiling through to the final fitout. | A bathroom renovation has more failure points per square metre than almost any other room. We manage the full sequence — demolition, waterproofing, tiling, plumbing and fitout — so every layer is right before the next one goes on. |
| 9 | Demolition | Selective and full demolition, carried out safely and cleared ready for the next trade. | Whether it's a single wall or a full strip-out, demolition is sequenced to protect what stays standing and to keep the site safe. We clear and dispose of waste properly, leaving the space ready for the trades that follow. |
| 10 | Grouting | Tile grouting and re-grouting, finished for a clean, consistent line and long-term water resistance. | Grout lines are a small detail with a big impact on how a tiled surface ages. We grout to a consistent width and depth, in a product suited to the area's moisture exposure, so the finish stays clean and water-resistant. |
| 11 | Timber Framing | Timber wall and roof framing, built square and true to engineered specification. | Framing sets the accuracy for every trade that follows it. We build timber wall and roof frames to engineered specification, checked for square and level before sheeting begins, so the rest of the build goes together cleanly. |

---

## 5. Fase 2 — Unificación de `admin/categories` (+ impacto en `admin/projects` y `admin/services`)

**Files:**
- Modify: `src/presentation/components/admin/CategoryManagerClient.tsx` (eliminar el switch de tabs `service`/`project`, renderizar un único árbol)
- Modify: `src/presentation/components/admin/CategoryTreeView.tsx` (agregar filtro por `type` como chip/dropdown opcional en vez de tab; agregar edición del campo `icon`)
- Review: cualquier componente en `admin/projects` que use un selector de categoría propio (confirmado en la auditoría Fase 0) — apuntar al mismo componente/repositorio unificado.
- Review: `admin/services` (`ServiceTable.tsx` o equivalente) — confirmar que ya lee `categoryId` correctamente y que el toggle de `published` está expuesto en la UI (si no existe, agregarlo: es la pieza que activa/desactiva el botón de enlace en la card pública).

**Descripción:** `CategoryManagerClient` hoy mantiene dos árboles separados (`serviceFlat` / `projectFlat`) detrás de un tab. Se reemplaza por una sola vista con:
- Un único `CategoryTreeView` que recibe ambos flats combinados, con una columna o chip de `type` visible por fila.
- Filtro opcional por `type` (no obligatorio, a diferencia del tab actual).
- Edición de `icon` por categoría (campo ya existe en el schema, hoy sin UI de edición) — necesario para que la Fase 3 tenga dónde asignar los 30 íconos nuevos.
- Mismo repositorio (`DrizzleCategoryRepository`), sin cambios de contrato salvo el parámetro `activeOnly` agregado en la Fase 1.

**Steps:**

- [ ] Paso 1: Con el resultado de la auditoría Fase 0, listar todos los puntos del código (admin/projects, admin/services, formularios) que hoy dependen de `CategoryManagerClient` o de los flats por separado.
- [ ] Paso 2: Refactor de `CategoryManagerClient` a vista única + filtro por `type`.
- [ ] Paso 3: Agregar edición de `icon` en `CategoryTreeView` (input de texto con el key del ícono, ver Fase 3 — no upload de SVG, solo el key).
- [ ] Paso 4: Confirmar que `admin/projects` sigue funcionando sin cambios de comportamiento (mismo `categoryId`, misma data) — solo cambia de dónde se gestiona el árbol.
- [ ] Paso 5: Agregar/confirmar toggle de `published` visible en `admin/services` por cada fila.
- [ ] Paso 6: `npm run build` + `npx tsc --noEmit` limpio.

---

## 6. Fase 3 — Sistema de íconos SVG (30 conceptos)

**Files:**
- Modify: `src/presentation/components/ServiceIcons.tsx` (agregar 30 entradas nuevas al mapa de íconos)

**Estilo:** mismo lenguaje visual que los íconos existentes — línea simple (`stroke-width: 1.5`), `viewBox="0 0 24 24"`, compatible con la animación de "self-draw" ya usada en el Atelier Index (`stroke-dasharray` / `stroke-dashoffset`, ~0.6s). El `key` de cada ícono es lo que se guarda en `categories.icon` (texto, no el SVG completo).

**Conceptos a diseñar (30, uno por sub-servicio del §4):**
`1st-2nd-fix`, `architraves-skirting`, `deck`, `pergola`, `eaves-fencing`, `general-repairs`, `interior-exterior-doors`, `renovations-extensions`, `shop-fitouts`, `staircases-studwork`, `verandahs`, `axon`, `blueboard`, `hebel`, `weatherboard`, `acoustic-ceilings`, `bulkheads-pelmet`, `plasterboard-fixing`, `water-resistant-boarding`, `design-drafting`, `electrical-plumbing`, `engineering`, `painting`, `roofing-guttering`, `windows-glazing`, `landscaping`, `bathroom-renovation`, `demolition`, `grouting`, `timber-framing`.

**Steps:**

- [ ] Paso 1: Definir/dibujar los 30 paths SVG según el estilo de línea existente.
- [ ] Paso 2: Agregarlos al mapa de `ServiceIcons.tsx`.
- [ ] Paso 3: Asignar cada `key` al campo `icon` de su categoría correspondiente (vía el admin unificado de la Fase 2, o directamente en el seed de la Fase 1 si ya están listos a tiempo).

---

## 7. Fase 4 — Página pública `/services/[category]`

**Files:**
- Create: `app/(portfolio)/services/page.tsx` (redirect a `/services/carpentry`)
- Create: `app/(portfolio)/services/[category]/layout.tsx` (tabs compartidos + `generateStaticParams` de las 4 categorías)
- Create: `app/(portfolio)/services/[category]/page.tsx` (server component: fetch de la categoría + sus `services` hijos, fallback estático si la BD no responde)
- Create: `src/presentation/sections/ServiceCategoryGrid.tsx` (`'use client'` — grid + animación de entrada)
- Create: `src/presentation/components/ServiceCategoryTabs.tsx` (los 4 `<Link>`, estado activo según `category` actual)
- Modify: `app/globals.css` (estilos del grid, manteniendo paleta ivory/gold/Cormorant existente para continuidad de marca)

**Descripción:** Mobile-first. Grid de 1 columna en mobile, 2 en tablet, 3–4 en desktop (`clamp()`/`grid-template-columns` con los breakpoints ya usados en el resto del sitio). Animación de entrada inspirada en el stagger del CodePen de referencia (no el carrusel completo — ese no es responsive): al montar o cambiar de tab, las cards entran con `gsap.from({ opacity: 0, y: 24 }, { stagger: 0.06, ease: 'power3.out' })`, mismo lenguaje de movimiento que ya usa el Atelier Index. Respetar `prefers-reduced-motion` (sin stagger, aparición instantánea).

Cada card muestra: ícono (Fase 3), nombre, `shortDescription`, imagen de fondo/placeholder. Si `services.published=true` para ese ítem → botón "View full details" enlazando a la Ficha (Fase 5); si `false` → card sin botón, solo informativa.

**Steps:**

- [ ] Paso 1: `layout.tsx` con los 4 tabs + `generateStaticParams` (`carpentry`, `cladding`, `gyprock-fixing-flushing`, `additional-services`).
- [ ] Paso 2: `page.tsx` — `DrizzleCategoryRepository.findBySlug(category, 'service')` + fetch de servicios por `categoryId`; fallback estático con el catálogo del §4 si la BD no responde (mismo patrón de resiliencia que el Atelier Index).
- [ ] Paso 3: `ServiceCategoryGrid.tsx` con el stagger GSAP descrito arriba.
- [ ] Paso 4: Responsive sweep: mobile, tablet, laptop, desktop.
- [ ] Paso 5: `npm run build` + `npx tsc --noEmit` limpio.

---

## 8. Fase 5 — Ficha de Servicio completa `/services/[category]/[item-slug]`

**Files:**
- Create: `app/(portfolio)/services/[category]/[item]/page.tsx`
- Retire/redirect: el viejo `app/(portfolio)/services/[slug]/page.tsx` (era el placeholder pre-categorías; revisar si conviene redirigir las URLs viejas a la nueva ruta o dejar que retornen 404 — confirmar con Gustavo si hay backlinks externos a esas URLs).

**Descripción:** Server component, `generateStaticParams` solo para los ítems con `published=true`. Si se accede directo a la URL de un ítem con `published=false` → `notFound()`. Contenido: `fullDescription`, imagen/galería, CTA "Request a Quote" → `/#contact`, CTA secundaria "View Our Projects" → `/projects` (mismo patrón que la página de detalle vieja).

**Steps:**

- [ ] Paso 1: Crear la ruta dinámica con los dos segmentos (`category`, `item`).
- [ ] Paso 2: `notFound()` si `published=false`.
- [ ] Paso 3: Decidir y resolver el destino de las URLs viejas `/services/[slug]` (redirect 308 a la nueva ruta si el slug matchea, o 404 limpio).
- [ ] Paso 4: Verificar `npm run build` con `generateStaticParams` solo de ítems publicados.

---

## 9. Fase 6 — Gancho a futuro (Form Builder por servicio)

**No se construye ahora** — solo se deja la puerta abierta para el work order de CRM/Form Builder ya en curso.

**Files:**
- Modify: `src/infrastructure/db/schema.ts` — agregar columna nullable `services.requestFormId` (uuid, sin FK todavía, sin índice).

**Steps:**

- [ ] Paso 1: Agregar la columna nullable, sin lógica asociada.
- [ ] Paso 2: Documentar en el código (comentario) que se conectará al Form Builder cuando ese módulo esté listo.

---

## 10. Checklist de verificación final

1. `npm run dev` → `/services` redirige a `/services/carpentry`; los 4 tabs navegan correctamente y son URLs reales.
2. Cada categoría muestra el número correcto de cards (11 / 4 / 4 / 11) con ícono, nombre y `shortDescription`.
3. Cards con `published=true` muestran botón de enlace a la Ficha; las `published=false` no.
4. Ficha de Servicio: contenido completo, CTAs funcionando, 404 si no está publicada.
5. `prefers-reduced-motion`: sin stagger, contenido legible de inmediato.
6. Responsive: mobile, tablet, laptop, desktop.
7. Admin: un solo árbol de categorías (sin tabs Project/Service), edición de `icon` funcionando, `admin/projects` y `admin/services` sin regresiones.
8. Las 6 disciplinas viejas desaparecen del sitio público pero siguen en la BD con `isActive=false`.
9. `npm run build` + `npx tsc --noEmit` limpios en todas las fases.

## 11. Reporte de cambios esperado

Al finalizar cada fase, Claude Code debe entregar un resumen con: archivos creados/modificados, decisiones tomadas durante la auditoría (Fase 0) que no estaban explícitas en este plan, y cualquier desviación respecto a lo aquí descrito — en vez de un commit, como insumo para que Gustavo revise antes de aplicar los cambios.
