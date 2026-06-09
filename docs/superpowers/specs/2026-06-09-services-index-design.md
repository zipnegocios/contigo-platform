# Spec — Services Index Page ("The Atelier Index")

**Date:** 2026-06-09
**Status:** Approved (design), pending implementation plan
**Scope:** Phase 1 — the `/services` index page only. Detail/sub-services page is designed here but built in Phase 2.

---

## 1. Purpose

Build the most important page of the business: an AWWWARDS-grade, immersive **Services index** that presents Contigo's ten core construction disciplines as a single editorial experience. The page must:

- Feel disruptive and memorable, yet stay true to the established brand (refined, editorial, artisanal — not corporate-tech).
- Provoke the visitor to explore **all** ten services through dynamic, enveloping interaction and captivating copy.
- Be production-grade, responsive, and accessible.

It also fixes a latent bug: the existing `/services/[slug]` detail page links back to `/services`, which currently 404s.

---

## 2. Concept — "The Atelier Index"

An editorial, restraint→revelation index. At rest, the page is a quiet ivory manifesto: a numbered list of ten disciplines in Cormorant Garamond. On interaction, each row "blooms" into a **full-bleed cinematic takeover** — the service photograph fills the canvas under a warm-dark veil, a custom line-icon draws itself, and captivating copy rises over the image.

**Narrative spine (the order is the story):** the ten services are ordered structure → finish — from the bones of a home to its final layer of luxury. Scrolling the list = walking a home from foundation to Venetian polish. This gives a reason to explore every row.

```
01 New Home Building → 02 Home Extensions → 03 Home Renovations →
04 Carpentry → 05 Cladding → 06 Gyprock Fixing & Flushing →
07 Landscaping → 08 Internal & External Painting →
09 Render & Solid Plastering → 10 Venetian Plastering
```

---

## 3. Page Architecture

Three movements on one page (route: `app/(portfolio)/services/page.tsx`):

1. **Intro** — editorial, ivory, calm. Overline `OUR CRAFT`, a Cormorant statement (e.g. *"Ten disciplines. One standard."*), one supporting line, a scroll cue. Brief — hands off to the index quickly so scroll cost stays low.
2. **The Index** — the core. Ten rows. Full-bleed reveal on hover (desktop) / scroll-into-center activation (touch).
3. **Closing** — brand reprise (*"Building Dreams Together."*) + primary CTA → `/#contact` ("Start your project").

---

## 4. Row Anatomy

**At rest (ivory):**
- Number `01` — Space Grotesk, small, muted gold (`--brand-gold` at reduced weight).
- Name — Cormorant Garamond, `clamp(2rem, 4vw, 3.4rem)`, ink (`--atelier-ink`).
- Thin gold rule beneath each row; `↗` marker at the right edge.
- Row height generous (~13vh) — the list *is* the journey.

**On activation (full-bleed takeover):**
- Section background transitions to the service photograph + warm-dark veil (`#1E1812` at ~0.72 alpha).
- Active row → gold, shifts right (`x: +20px`), name scales up subtly.
- Inactive rows → `opacity: 0.2`.
- Custom architectural line-icon self-draws (`stroke-dashoffset`, ~0.6s).
- Tagline (Cormorant, large) + supporting sentence + `Explore this service →` cue rise/fade in over the image.
- Micro Ken Burns on the image (`scale 1.0 → 1.06`) while active.
- On exit: return to ivory silence. Crossfade ~0.55s, easing `expo.out` (architectural weight; no bounce).

---

## 5. Custom Icon System

Ten inline SVG icons — `1.5px` gold stroke, blueprint / technical-drawing language, ~56px — that self-draw on reveal via `stroke-dashoffset`.

| # | Service (slug) | Icon concept (line-art) |
|---|---|---|
| 01 | New Home Building (`new-home-building`) | house gable / frame |
| 02 | Home Extensions (`home-extensions`) | house + added volume (arrow) |
| 03 | Home Renovations (`home-renovations`) | wall + trowel / transform arrows |
| 04 | Carpentry (`carpentry`) | set square + timber joint |
| 05 | Cladding (`cladding`) | overlapping panels |
| 06 | Gyprock Fixing & Flushing (`gyprock-fixing-flushing`) | board + corner bead / level |
| 07 | Landscaping (`landscaping`) | leaf + ground line |
| 08 | Internal & External Painting (`internal-external-painting`) | roller + stroke |
| 09 | Render & Solid Plastering (`render-solid-plastering`) | trowel + textured wall |
| 10 | Venetian Plastering (`venetian-plastering`) | polished sweep / diamond sheen |

Icons live as a keyed map in the presentation layer (`iconKey` per slug). `prefers-reduced-motion` → render fully drawn, no animation.

---

## 6. Copy (AU English)

Names come from the DB. Each service's **tagline** (evocative clause) + **support** (one sentence) are art-directed, distilled from the existing seed descriptions. Full set:

- **01 New Home Building** — *Built from the ground up — and built with you.* / Custom homes shaped to the South Australian landscape and the way you live, delivered end-to-end without the council headaches.
- **02 Home Extensions** — *Expand your horizons — without moving house.* / Seamless additions that feel like they were always part of the home, from a sun-drenched living room to a full second storey.
- **03 Home Renovations** — *Elevate your everyday.* / Kitchens, bathrooms and laundries reworked into high-performance spaces that add value the day they're done.
- **04 Carpentry** — *Precision in every cut, soul in every finish.* / Decking, pergolas, staircases and fine interior joinery, in materials chosen to thrive in South Australian conditions.
- **05 Cladding** — *The ultimate shield for your masterpiece.* / Weather-tight, thermally sharp and visually striking — Hebel, Axon and Weatherboard, detailed to the millimetre.
- **06 Gyprock Fixing & Flushing** — *Flawless surfaces, ready for the spotlight.* / Expert plasterboard for new builds and luxury renovations — raked ceilings, bulkheads and fire-rated systems with tight, true lines.
- **07 Landscaping** — *Living beyond the walls.* / We treat the garden as architecture — driveways, retaining walls and drought-tolerant planting built for Adelaide's climate.
- **08 Internal & External Painting** — *The final touch of perfection.* / Premium coating systems and meticulous prep for a sharp, even finish that stands up to the South Australian sun.
- **09 Render & Solid Plastering** — *Durable elegance for every surface.* / Clean, lasting finishes for brick, blueboard and Hebel — from acrylic texture coats to a classic white set.
- **10 Venetian Plastering** — *The final, quiet luxury — walls you can touch.* / Seamless mineral finishes that turn walls, fireplaces and benchtops into works of art.

---

## 7. Data & Layers

**Source of truth:** `categories` table, `type='service'`, root rows (`parentId === null`), ordered by `orderIndex`. Already seeded by `scripts/seed-categories.ts`. Read via `DrizzleCategoryRepository.findAll('service')`.

**Server component** (`app/(portfolio)/services/page.tsx`, `dynamic = 'force-dynamic'`):
1. `findAll('service')` → filter `parentId === null` → sort by `orderIndex`.
2. Join each with a presentation-layer **`serviceMeta`** map keyed by slug: `{ image, iconKey, tagline, support }`.
3. If DB empty/unavailable → fall back to a static list of the ten (same resilience pattern as the home page). Page never breaks.
4. Pass view model to client component `<ServicesIndex>`.

**`serviceMeta`** (presentation config, art-directed — keyed by the seeded slugs above):
- `image`: curated asset from `/public/assets/service-*.jpg` (10 available). Mapping: new-home, extension, renovation, carpentry, cladding, gyprock, landscaping, painting, rendering, plaster (Venetian → `service-plaster.jpg` until a bespoke asset exists).
- `iconKey`: key into the inline SVG icon map.
- `tagline`, `support`: the copy in §6 (rendered if present; falls back to DB `description` if a slug is unmapped).

**Linking:** each row's `Explore this service →` and row click → `/services/[slug]` (category slug). Destination is rebuilt on categories in Phase 2; the href is wired now.

---

## 8. Motion Language (design-motion-principles)

- **Load:** rows reveal in a single orchestrated moment — staggered from the top (`stagger 0.06s`, slide-up + fade), `power3.out`.
- **Reveal:** one focal change at a time; image crossfade `0.55s expo.out`; icon self-draw `0.6s`.
- **Cursor:** existing `CustomCursor` (ring + dot). Light enhancement — over the index, the ring scales up (gold) via a CSS class toggled on row hover. Nice-to-have; degrade gracefully if skipped.
- **Scroll:** Lenis smooth scroll already global; rows get subtle scroll-triggered reveals via GSAP ScrollTrigger.
- **Accessibility:** honor `prefers-reduced-motion` — no Ken Burns, instant crossfades, icons pre-drawn, no stagger. Rows are real links (keyboard focusable); focus state mirrors hover (activates the reveal) so keyboard users get the same experience.

---

## 9. Responsive / Touch

- **Desktop (`hover: hover`):** index + full-bleed hover reveal.
- **Touch / small screens (`hover: none`):** rows become **stacked editorial tiles** — image already visible under the veil, with number + name + tagline + CTA stacked. The full-bleed reveal becomes the default state. Optional scroll-into-center activation (IntersectionObserver) for liveliness. Tap → detail. No hover dependency.
- Breakpoints follow existing conventions (`page-padding`, `clamp()` sizing). Verify at desktop, laptop, mini-laptop, tablet, mobile.

---

## 10. Components / Files

**New:**
- `app/(portfolio)/services/page.tsx` — server component (data fetch + fallback + meta join).
- `src/presentation/sections/ServicesIndex.tsx` — `'use client'` index experience (rows, reveal, motion).
- `src/presentation/components/ServiceIcons.tsx` — inline SVG icon map + self-draw.
- `src/presentation/data/serviceMeta.ts` — slug→`{ image, iconKey, tagline, support }` map + static fallback list.
- CSS additions in `app/globals.css` (`@layer components`) for index rows, veil, reduced-motion rules.

**Touched:**
- Navigation (e.g. `VoiceSearchNav`) — ensure `/services` is linked.
- `app/globals.css` — index styles.

**Reused:** `DrizzleCategoryRepository`, `Category` entity, `CustomCursor`, brand tokens, `page-padding` / `section-gap` utilities.

---

## 11. Scope

**In (Phase 1):** `/services` index (full Atelier Index), custom icons, copy, motion, responsive, DB-driven with static fallback, broken-link fix, nav link.

**Deferred (Phase 2 — designed, not built):** `/services/[slug]` detail rebuilt on categories with sub-services; admin icon management; bespoke per-service imagery uploads.

---

## 12. Verification

1. `npm run dev` → `/services` renders the ten services from the DB in order 01–10.
2. Desktop hover: full-bleed takeover, icon self-draws, copy enters, neighbours dim; exit returns to ivory.
3. Keyboard: Tab through rows; focus activates the same reveal; Enter navigates.
4. Touch (devtools mobile): stacked tiles, imagery visible, tap navigates.
5. `prefers-reduced-motion` on: no Ken Burns / self-draw / stagger; content fully legible.
6. DB empty (or `DATABASE_URL` unset): static fallback renders the ten services.
7. The existing `/services/[slug]` back-link resolves to the new index (no 404).
8. Responsive sweep: desktop / laptop / mini-laptop / tablet / mobile.
9. `npm run build` + `npx tsc --noEmit` clean.
