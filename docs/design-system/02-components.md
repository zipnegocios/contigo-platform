# 02 — Component Specifications

Specs use the foundation tokens ([01-foundations.md](01-foundations.md)). Components marked **[consolidate]** have two competing implementations today; the spec below is the target.

---

## 1. Navigation

**Desktop (fixed, 72px, z-100)**
- Unscrolled: transparent over hero; links ivory (`neutral-50`); logo `logo-secundario.png` with brightness lift.
- Scrolled (>100px): `rgba(250,246,240,0.9)` + `backdrop-blur(12px)` (`.nav-scrolled`); links `neutral-800`.
- Link hover: gold underline bar animating `w-0 → w-full`, 300ms; active link: `gold-700` text (AA on ivory — *not* gold-400).
- CTA "Get a Quote": primary button (below).

**Mobile drawer:** right slide-in `w-80`, 500ms, `heritage-sand` panel, `neutral-800` links, full-width CTA, `bg-black/40` scrim. Keep.

**Future mega-menu (services taxonomy):** ivory panel, `neutral-200` hairlines, three columns max, petrol-800 section headers (0.75rem uppercase labels), thumbnails 4:3 `rounded-lg`.

## 2. Buttons [consolidate]

Today: `.btn-primary/.btn-secondary/.btn-ghost` CSS (marketing) **and** shadcn `Button` CVA (admin). Target: one shadcn `Button` with brand variants; keep `.btn-*` classes as thin shims until migration completes.

| Variant | Resting | Hover | Notes |
|---|---|---|---|
| **primary** | `gold-400` fill, ink text (`neutral-800`), 700 weight, uppercase +0.05em, `rounded-lg`, pad 14×32 | `gold-600` fill, `translateY(-2px)`, glow `0 4px 12px var(--gold-a30)` | The one-per-view hero action |
| **secondary** | transparent, 1px `gold-400` border, gold-400 text (dark surfaces) / `gold-700` text (light surfaces) | `var(--gold-a12)` wash, `translateY(-2px)` | Paired action next to primary |
| **petrol** *(new)* | `petrol-800` fill, ivory text | `petrol-700` fill | Trust-context actions: quotes, documents, admin confirmations |
| **ghost** | transparent, `neutral-200` border, ink text | `rgba(45,41,36,0.05)` wash | Tertiary/cancel |
| **destructive** | `--destructive` (#C0392B) fill, white text | 90% opacity | Admin deletes |

States (all variants): `focus-visible:` 3px ring `--ring` (gold) + offset; `active:` translateY(0), shadow none; `disabled:` 50% opacity, no pointer events; loading: spinner + label, keep width.

## 3. Cards

- **Project card** (portfolio grid): `rounded-2xl`, 4:3, image `scale-105` on hover (700ms), gradient scrim `rgba(30,26,22,0.85) → transparent 55%`, overline gold-400 (on dark ✓), title Alegreya, location fades in on hover. Featured badge: gold-400 pill, ink text, 10px uppercase.
- **Service card / parallax strip**: aspect 1.8, `rounded-[1.25rem]`, hover overlay + label rise. Keep.
- **Stat / KPI card** (admin): white, `rounded-lg`, `neutral-200` border + 4px gold-400 left rule, elevation 2; value in `font-data` tabular; label `neutral-600`.
- **Testimonial block** *(spec — not yet built)*: ivory card, elevation 2, Alegreya italic quote (Body L), 1px gold rule above attribution, attribution as label style; optional petrol-100 variant for alternating rows.
- **CTA block** *(spec)*: full-bleed `petrol-800` band, ivory display heading (Alegreya), gold primary button, optional `petrol-950` photographic scrim — this is the canonical gold-on-petrol brand moment.

## 4. Forms [consolidate]

Target pattern everywhere: **react-hook-form + Zod + shadcn `Form`/`FormField`** (admin already does this; contact form to migrate).

- **Input / Select / Textarea**: `rounded-lg`, 1px `neutral-200` border (1.5px `#DDD5C8` on login is acceptable variant), white/translucent fill per context, `neutral-800` text, `neutral-600` placeholder.
- **Focus**: border `gold-400` + `0 0 0 3px var(--gold-a30)` ring. Never browser-default outline.
- **Error**: border + message in `--error-600`; message 0.75rem under field; `aria-invalid` set (shadcn handles).
- **Success/confirmation**: `--success-600` icon + message; quote form keeps inline success state.
- File/attachment dropzone: dashed `var(--gold-a30)` border → solid gold-400 on dragover.

## 5. Overlays

- **Modal/Dialog**: `bg-black/50` scrim, ivory panel `rounded-xl`, elevation 4, zoom-in-95 animation (shadcn default). Title: Alegreya Sans 700.
- **Drawer/Sheet**: side panel, elevation 4; admin detail drawers keep `heritage-dark`-style headers with gold accents.
- **Lightbox**: `rgba(0,0,0,0.96)` backdrop, elevation 5 controls, gold-400 active dots. Keep.

## 6. Disclosure & navigation-in-page

- **Accordion (shadcn)**: `neutral-200` hairlines, 200ms ease-out height animation, chevron rotate.
- **Showcase accordion (projects carousel)**: flex-expand `1 → 3`, 500ms `cubic-bezier(0.25,0.1,0.25,1)`; scrim now petrol-tinted `rgba(13,60,76,0.85)`.
- **Tabs**: muted cream track `p-[3px] rounded-lg`, active trigger ivory card; admin forms keep.
- **Timeline** (quote status): 5 stage dots; completed = gold-400, current = petrol-600 + label 700, pending = `neutral-300` at 50%; connector 1px `neutral-200`. (Replaces the ad-hoc per-status hexes — migrate with the page.)

## 7. Status badges & Kanban (token re-expression)

| Status | Fill | Text |
|---|---|---|
| new | `var(--gold-a15)` | `gold-700` |
| contacted | `var(--gold-a30)` | `gold-800` |
| in_progress / quoted | `rgba(13,60,76,0.12)` | `petrol-800` |
| converted / won | `var(--success-a12)` | `--success-600` |
| closed / lost | `rgba(107,101,96,0.1)` | `neutral-600` |

Pill: `rounded-full`, 0.75rem, 500 weight. Kanban column tints follow the same pairs at a06 strength.

## 8. Admin sidebar

Dark `#1E1A16` (warm black — on-brand), idle text `heritage-sand`, muted `neutral-400`, hairlines `var(--gold-a12)`, active item `var(--gold-a15)` fill + `gold-400` text + 2px gold left rule. Brand wordmark in `font-display`. Already token-aligned via `--admin-*` aliases.

## 9. Project showcase (home carousel)

Petrol surfaces post-realignment: section `petrol-100` canvas, overline `petrol-500`, heading `petrol-900`, scrim `rgba(13,60,76,0.85)`, nav buttons gold-on-dark, dots ink/28%. Autoplay 4s, pause on hover. This section is the **secondary-color showcase** — keep it petrol-pure (gold only on interactive elements).
