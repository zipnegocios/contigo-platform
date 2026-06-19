# 01 — Foundations (Design Tokens)

All tokens live in [`app/globals.css`](../../app/globals.css) (`:root`) and are exposed as Tailwind utilities via [`tailwind.config.js`](../../tailwind.config.js).

---

## 1. Color

### 1.1 Gold — brand primary (`#E2C063` at step 400)

The manual's gold is the **signature**, not the wallpaper: use it for CTAs, active states, rules/dividers, focus rings, and selective accents. Legacy golds were absorbed as real scale steps so nothing drifted.

| Token | Hex | Use |
|---|---|---|
| `--gold-50` | `#FBF7EC` | Tinted backgrounds, hover washes on light surfaces |
| `--gold-100` | `#F6EDD4` | Selected-row tints, subtle highlights |
| `--gold-200` | `#F0E1B2` | Decorative fills, charts |
| `--gold-300` | `#EAD28C` | Hover state of gold-200 surfaces |
| **`--gold-400`** | **`#E2C063`** | **BRAND PRIMARY — CTAs, active nav, brand rules** |
| `--gold-500` | `#C8A55C` | Secondary gold accents (ex `--brand-gold-light`) |
| `--gold-600` | `#D4AF37` | Hover state of primary CTAs (ex `--brand-gold-hover`) |
| `--gold-700` | `#A08040` | Gold text on light backgrounds — the only AA-safe gold for text on ivory (ex `--brand-gold-antique`) |
| `--gold-800` | `#6E5526` | Deep gold, borders on gold surfaces |
| `--gold-900` | `#4A3A1A` | Near-bronze, rare |
| `--gold-950` | `#2B2110` | Darkest bronze shadow tone |

Alpha tints (for overlays/borders on any background): `--gold-a06`, `--gold-a12`, `--gold-a15`, `--gold-a30` = `rgba(226,192,99, .06/.12/.15/.30)`.

### 1.2 Petrol — brand secondary (`#0D3C4C` at step 800)

The trust/solidity counterweight to the gold. Owns the **Projects ("Monolith") surfaces**, informational accents, secondary buttons, and data visualization.

| Token | Hex | Use |
|---|---|---|
| `--petrol-50` | `#ECF5F8` | Light petrol surface (Projects section canvas) |
| `--petrol-100` | `#D5E9EF` | Section backgrounds, info tints |
| `--petrol-200` | `#ABD3DF` | Borders on petrol surfaces |
| `--petrol-300` | `#7DB7C8` | Decorative, charts |
| `--petrol-400` | `#5295AA` | Charts, secondary icons |
| `--petrol-500` | `#34758C` | Muted petrol text on light petrol (≈4.6:1 on petrol-100) |
| `--petrol-600` | `#1F5A70` | Info status, links on light surfaces |
| `--petrol-700` | `#15485C` | Hover state of petrol-800 fills |
| **`--petrol-800`** | **`#0D3C4C`** | **BRAND SECONDARY — secondary buttons, headers, scrims** |
| `--petrol-900` | `#092B38` | Ink on petrol-tinted surfaces (≈12:1 on petrol-100) |
| `--petrol-950` | `#051E27` | Deepest petrol, overlays |

### 1.3 Neutral — warm scale anchored to `#1D1D1B` (step 900)

Light end preserves the Atelier ivory aesthetic; dark end lands exactly on the manual's neutral.

| Token | Hex | Was |
|---|---|---|
| `--neutral-50` | `#FAF6F0` | atelier-ivory (page background) |
| `--neutral-100` | `#F5EDE0` | atelier-cream (table headers, secondary surfaces) |
| `--neutral-200` | `#E5DDD0` | atelier-border (dividers, card borders) |
| `--neutral-300` | `#CFC5B6` | — (new intermediate) |
| `--neutral-400` | `#A89E8C` | heritage-muted (tertiary text on dark) |
| `--neutral-500` | `#847B6F` | — (new intermediate) |
| `--neutral-600` | `#6B6560` | atelier-muted (secondary text, placeholders) |
| `--neutral-700` | `#4D4843` | — (new intermediate) |
| `--neutral-800` | `#2D2924` | atelier-ink (primary text on light) |
| **`--neutral-900`** | **`#1D1D1B`** | **BRAND NEUTRAL (manual)** |
| `--neutral-950` | `#141312` | deepest surfaces |

Heritage earth accents (`--heritage-sand #E8DCC4`, `--heritage-dark #1E1812`, `--heritage-charcoal #3A3028`, `--heritage-terracotta #B8704A`, `--heritage-moss #6B7B5E`) remain as **deprecated literals** — they are tonal photography companions, not core brand tokens. New work should compose from neutral + gold + petrol.

### 1.4 Status colors

| Token | Hex | Notes |
|---|---|---|
| `--success-600` | `#15803D` | + `--success-a12` tint for badges |
| `--warning-600` | `#9A6700` | Amber-brown, harmonized with gold |
| `--error-500` / `--error-600` | `#D5483A` / `#C0392B` | Brick red — replaces ad-hoc `#e74c3c`; also drives shadcn `--destructive` |
| `--info-600` | `var(--petrol-600)` | Info **is** petrol — the secondary does double duty |

### 1.5 shadcn semantic mapping (HSL triplets)

| Var | HSL | Resolves to |
|---|---|---|
| `--background` / `--card` / `--popover` | `36 50% 96%` | neutral-50 `#FAF6F0` |
| `--foreground` | `60 4% 11%` | neutral-900 `#1D1D1B` |
| `--primary` | `44 69% 64%` | gold-400 `#E2C063` |
| `--primary-foreground` | `30 8% 15%` | neutral-800 (ink on gold) |
| `--secondary` | `195 71% 17%` | petrol-800 `#0D3C4C` |
| `--secondary-foreground` | `36 50% 96%` | neutral-50 (ivory on petrol) |
| `--destructive` | `6 64% 47%` | error-600 `#C0392B` |
| `--ring` | `44 69% 64%` | gold-400 |
| `--accent` / `--muted` / `--border` / `--input` | unchanged warm creams | hover fills & hairlines for 13 shadcn components — intentionally **not** petrol |

### 1.6 Contrast rules (non-negotiable)

1. **Never set gold text on light backgrounds** — `gold-400` on ivory is ~1.6:1. Use `gold-700` (AA for large text) or ink. Gold-400 *text* is permitted only on dark surfaces (neutral-800+, petrol-800+, heritage-dark): ≥7:1.
2. On gold fills, text is always ink (`neutral-800`/`900`) — never white.
3. On petrol-800+ fills, text is ivory (`neutral-50`) or gold-400 for accents.
4. Verified pairs: petrol-900 on petrol-100 ≈ 12:1 · petrol-500 on petrol-100 ≈ 4.6:1 · neutral-800 on neutral-50 ≈ 12.4:1.

---

## 2. Typography — the Alegreya superfamily

One superfamily, two voices, designed to pair (Juan Pablo del Peral / Huerta Tipográfica). Loaded via `next/font/google` in [`app/layout.tsx`](../../app/layout.tsx).

| Layer var | Family | Role |
|---|---|---|
| `--font-display` | **Alegreya** (serif) 400–700 + italic | Display, H1–H2, editorial moments, pull quotes |
| `--font-sans` | **Alegreya Sans** 300/400/500/700/800 + italic | Body, UI, H3–H6, labels, buttons, forms |
| `--font-data` | Space Grotesk 400–700 | Numerals/KPIs (`.data-text`, `tabular-nums`) — provisional, see roadmap |

> ⚠️ **Alegreya Sans has no 600 weight.** `font-semibold` resolves to 700. Requesting 600 from `next/font` fails the build. The manual's "Alegreya Sans Bold" = 700, the default emphasis weight.

Deprecated aliases (`--font-cormorant` → display, `--font-inter` → sans, `--font-space` → data) keep ~29 legacy component references working.

### Type scale (as shipped in `globals.css`)

| Level | Family / weight | Size | LH / tracking |
|---|---|---|---|
| Display / H1 | Alegreya 400 | `clamp(3rem, 7vw, 6rem)` | 1.05 |
| H2 / Section title | Alegreya 400 | `clamp(2rem, 4vw, 3.5rem)` | 1.15 |
| H3 / Card title | Alegreya Sans 500 | `1.25rem` | 1.3 |
| H4 / `.label` / overline | Alegreya Sans 700* | `0.75rem` | uppercase, +0.1em |
| Body L | Alegreya Sans 400 | `1.125rem` | 1.7 |
| Body M (default) | Alegreya Sans 400 | `1rem` | 1.6 |
| Body S / captions | Alegreya Sans 400 | `0.875rem` | 1.5 |
| Buttons | Alegreya Sans 700 | `0.875rem` | uppercase, +0.05em |
| Data / KPI | Space Grotesk 500 | contextual | `tabular-nums` |

\* declared 600 resolves to 700; drop to 500 if labels render too heavy.

**Hierarchy intent:** Alegreya's calligraphic serifs carry the *prestige/elegance* values at display sizes; Alegreya Sans' humanist warmth carries *closeness/professionalism* in the reading sizes. Use italic Alegreya sparingly — taglines and pull quotes only (e.g. login panel tagline).

---

## 3. Spacing

Tailwind's 4px-base scale, used with intent:

| Step | px | Use |
|---|---|---|
| 1 | 4 | Icon-to-text gaps, badge padding-y |
| 2 | 8 | Intra-component gaps, input padding-y |
| 3 | 12 | Form-field stacks, card grid gutters (compact) |
| 4 | 16 | Default component padding, paragraph spacing |
| 6 | 24 | Card padding, gaps between related blocks |
| 8 | 32 | Section-internal grouping, grid gaps |
| 12 | 48 | Sub-section separation |
| 16 | 64 | Section header → content |
| 24 | 96 | Between major page sections (static contexts) |
| 32 | 128 | Hero/section breathing room (large screens) |

Fluid section rhythm (marketing pages) stays on the existing utilities:
`.page-padding` = `clamp(1.5rem, 4vw, 4rem)` horizontal · `.section-gap` = `clamp(4rem, 8vw, 8rem)` vertical.
Rule of thumb: **fluid clamp() between sections, fixed steps inside components.**

---

## 4. Border radius

Derived from `--radius: 0.5rem`:

| Token | Value | Use |
|---|---|---|
| `rounded-xs` | 2px | Checkboxes, tiny chips |
| `rounded-sm` | 4px | Inputs (dense), accordion showcase items |
| `rounded-md` | 6px | Menus, popovers, small buttons |
| `rounded-lg` | 8px | **Buttons, inputs, standard cards — the house radius** |
| `rounded-xl` | 12px | Modals, large cards |
| `rounded-2xl` | 16px | Project/portfolio cards, form overlay panels |
| `rounded-full` | — | Pills, badges, dots, icon buttons |

Construction brand = precise edges: prefer lg and below for interactive controls; reserve 2xl for imagery containers.

---

## 5. Elevation (shadows)

Warm-tinted shadows (`45,41,36` = neutral-800 RGB) — never pure black on ivory:

| Level | Value | Use |
|---|---|---|
| 1 | `0 1px 2px 0 rgba(45,41,36,0.05)` | Inputs, hairline lift (`shadow-xs`) |
| 2 | `0 2px 8px rgba(45,41,36,0.06)` | KPI cards, resting cards |
| 3 | `0 4px 12px rgba(45,41,36,0.08)` | Hovered cards, dropdowns |
| 4 | `0 8px 24px rgba(45,41,36,0.12)` | Modals, drawers |
| 5 | `0 16px 48px rgba(45,41,36,0.18)` | Lightbox, command palette |
| Brand glow | `0 4px 12px var(--gold-a30)` | Primary CTA hover only |

---

## 6. Grid & breakpoints

| Token | Value |
|---|---|
| Breakpoints | Tailwind defaults: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 (do **not** add custom media queries — login page's 1100/960/767px queries are debt, see roadmap) |
| Containers | Marketing: full-bleed + `.page-padding`; content pages: `max-w-7xl` (projects), `max-w-6xl` (services), `max-w-2xl` (status/quote) |
| Columns | 12-col mental model via Tailwind grid: cards `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, footer `md:grid-cols-3`, masonry `columns-1 sm:columns-2 lg:columns-3` |
| Gaps | 24px (`gap-6`) default for card grids; 16px (`gap-4`) compact admin |
| Mobile detection | `use-mobile.ts` hook, 768px threshold |
