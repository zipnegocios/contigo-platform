# 00 — Website Audit (Pre-Realignment)

**Scope:** full audit of the Contigo Platform UI against the Manual Corporativo (April 2026), conducted June 2026. Findings below describe the state **before** the Quick Wins realignment; items marked ✅ Fixed were resolved in that pass, the rest are tracked in [04-roadmap.md](04-roadmap.md).

---

## 1. Executive summary

The site demonstrates **strong design craft** — GSAP scroll choreography, fluid `clamp()` typography, a coherent luxury aesthetic — but had **drifted from the official brand identity** on every axis the manual defines:

| Axis | Manual | Found in code | Severity |
|---|---|---|---|
| Primary gold | `#E2C063` | Split: `#E3C064` in `--brand-gold` (globals.css:12), `#E2C063` in admin tokens | High (brand split) — ✅ Fixed |
| Secondary petrol | `#0D3C4C` | Absent from the system; 1 ad-hoc use in a Kanban status | High — ✅ Fixed (token + Projects section) |
| Neutral | `#1D1D1B` | Warm browns `#2D2924` / `#1E1812`; `#1D1D1B` nowhere | Medium — ✅ Fixed (scale anchor) |
| Typeface | Alegreya Sans Bold | Cormorant Garamond + Inter + Space Grotesk; Alegreya nowhere | High — ✅ Fixed (superfamily) |
| Token discipline | — | ~219 hardcoded hex occurrences across 53 files | High — roadmap |

## 2. Color findings

### 2.1 The split gold
`--brand-gold: #E3C064` (off-spec) drove the entire public site, while admin tokens (`--admin-gold`) and ~25 inline styles used the correct `#E2C063`. Two golds, one brand. The off-spec variant also leaked into rgba values: `rgba(227, 192, 100, 0.3)` in button hovers and form focus rings.

### 2.2 Missing petrol blue
The manual's secondary color appeared exactly once — as an unofficial "navy" in the leads Kanban (`in_progress` stage). Meanwhile the home "Featured Projects" section ran on a **"Monolith" theme built from Tailwind slate** (`#E2E8F0`, `#1E293B`, `#64748B`, `#CBD5E1`) — cool, generic, corporate-grey colors with no relationship to the brand palette. This was the single largest off-brand surface on the site.

### 2.3 Three competing sectional themes
`globals.css` defined Atelier (warm ivory), Heritage (dark earth), and Monolith (cool slate) palettes. Atelier and Heritage are tonally coherent with the gold; Monolith was not. Sectional theming itself is a legitimate narrative device — the problem was that one of the three themes belonged to a different brand.

### 2.4 Token bypass
- ~219 hardcoded hex occurrences across 53 files (`src/presentation/components/admin/*`, `ProjectsGrid.tsx`, `CategoryFilterPills.tsx`, `Lightbox.tsx`, portfolio pages, login page).
- Error red hardcoded as `#e74c3c` in ContactSection (6×) — not the destructive token, not harmonized with the palette. ✅ Fixed (`--error-600`).
- Status colors (Kanban/badges) defined inline per component rather than as tokens.

## 3. Typography findings

- **Loaded:** Cormorant Garamond (display serif), Inter (body), Space Grotesk (numerals) via `next/font/google`. **Alegreya appeared nowhere** in the codebase.
- The hierarchy itself was sound: fluid display sizes (`clamp(3rem, 7vw, 6rem)` for h1), tight luxury line-heights (1.05–1.15), uppercase tracked labels (0.1em). The *system* was good; the *typefaces* were off-manual.
- Verdict: replaced with the **Alegreya superfamily** — Alegreya (serif) inherits Cormorant's editorial display role, Alegreya Sans replaces Inter for UI/body. Space Grotesk retained provisionally for tabular numerals (see roadmap). Note: Alegreya Sans ships no 600 weight; `font-semibold` resolves to 700.

## 4. Component findings

### 4.1 Duplicated component library
`src/components/ui/` is **byte-identical** to `src/presentation/components/ui/` (48 shadcn components each). Only the `presentation` copy is imported. The duplicate, plus legacy `src/sections/`, `src/components/` (Vite-era `ParticleScene`, old `HeroSection`), `src/App.tsx`, and `src/index.css` (verified: zero imports) are dead code awaiting deletion.

### 4.2 Two button systems
- `.btn-primary` / `.btn-secondary` / `.btn-ghost` CSS classes in `globals.css` (used by marketing pages).
- shadcn `Button` CVA variants (used by admin).
Same brand, two abstractions, drifting independently. Consolidation specified in [02-components.md](02-components.md).

### 4.3 Two form patterns
- Public contact form: raw `<input>`/`<select>`/`<textarea>` styled by `.form-overlay` CSS, manual error spans.
- Admin: shadcn `Form` + `FormField` + react-hook-form + Zod with `aria-invalid` propagation.
Both use RHF+Zod underneath, so unification is feasible without behavior change.

### 4.4 Inline-style admin
Admin components (~533 `style={{}}` instances) hardcode the palette per component. Visual result is consistent *today* only because the values were copy-pasted; any rebrand requires touching every file. Estimated token compliance: ~35–40% overall.

## 5. UX & information architecture

**Strengths:** clear single-page marketing narrative (Hero → Brand → Services → Heritage → Projects → Contact); strong conversion paths ("Get a Quote" in nav, hero, project/service detail sidebars); token-based public quote tracking (`/quote-status/[token]`) builds trust; voice search affordance is a differentiator.

**Risks:**
- The hero subtitle ("We build with you") is the brand's closeness value — good — but the *petrol* trust dimension was absent everywhere, making the site read "boutique" more than "solid engineering."
- Custom cursor (`cursor: none` globally) is a luxury flourish but a usability gamble; correctly disabled on touch, still worth monitoring in analytics.
- Featured Projects carousel auto-plays at 4s — near the lower comfort bound for reading title + location.

## 6. Responsive findings

- Tailwind defaults (sm 640 / md 768 / lg 1024 / xl 1280) used broadly and correctly; fluid `clamp()` for type and section spacing is best-practice.
- **Login page uses non-standard breakpoints** (1100px / 960px / 767px media queries) — maintenance debt, tracked in roadmap.
- Accordion heights are stepped in px per breakpoint (500→420→320→260) rather than fluid — acceptable, slightly rigid.

## 7. Accessibility & performance

- ✅ `prefers-reduced-motion` honored globally; ARIA labels on icon buttons; form labels present; Next/Image throughout; GSAP uses transforms (GPU-friendly).
- ⚠️ Gold-on-ivory CTAs (`#E2C063` on `#FAF6F0`, ~1.6:1 as a *graphical* contrast) are fine for large surfaces but **gold text on ivory** would fail WCAG — the system therefore mandates ink/neutral text on gold fills, never gold text on light backgrounds (see [01-foundations.md](01-foundations.md) contrast rules).
- ⚠️ Dark mode configured (`darkMode: ["class"]`, next-themes installed) but never implemented — latent capability.

## 8. What was kept (deliberately)

- The **Atelier ivory + Heritage dark earth** sectional storytelling — it flatters the gold and photography.
- The complete **motion language** (Ken Burns hero, flip-letter heritage, parallax service strips, accordion showcase) — this is the site's memorability, and it aligns with "modern elegance."
- The 8px-base radius system, the fluid type scale's *structure*, and the shadcn HSL token plumbing.
- Logo asset trio (`logo-principal`, `logo-secundario`, `isotipo`) matching the manual's variant system (full / nav / monogram).
