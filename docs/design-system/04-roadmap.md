# 04 — Premium Positioning & Implementation Roadmap

## Part A — Premium positioning (international benchmark)

Reference class: high-end architecture studios and luxury builders (e.g. the visual language of firms like Olson Kundig, Vincent Van Duysen, KÅRK-tier builder portfolios): restrained palettes, editorial serif display type, photography-first layouts, engineered motion.

### Adopt

1. **Duotone discipline** — ivory/neutral canvas, petrol for structure & trust surfaces, gold *only* where attention is earned (CTAs, rules, active states). Scarcity is what makes gold premium.
2. **Editorial display serif** (Alegreya) at very large sizes with tight line-height — already the site's strength; now on-manual.
3. **Photography as material**: full-bleed imagery with one standardized scrim family (warm dark `rgba(30,26,22,…)` for heritage surfaces, petrol `rgba(13,60,76,…)` for project surfaces). Avoid mixed scrim hues per section.
4. **Quiet confidence in copy + numbers**: tabular KPIs, project counts, completion dates — engineering credibility signals (already present via `.data-text`).
5. **Engineered motion** (03-motion.md): slow, weighty, precise.

### Avoid

- Purple/blue SaaS gradients, glassmorphism-as-identity, neon accents.
- Generic corporate slate/grey (the removed Monolith palette) — it reads "office park," not "luxury builder."
- Gold overuse: gold backgrounds behind body text, gold-on-gold, more than one gold CTA per viewport.
- Stock-photo handshake imagery; trend-chasing (3D mascots, bento-grid-everything).

### Differentiators to lean into

- The **petrol+gold pairing is rare** in the construction segment (most competitors: navy+white or black+orange). Owning it consistently is the brand moat.
- Voice search, token-based quote tracking, and the cinematic scroll narrative are genuine functional differentiators — surface them.
- "Building dreams together" (closeness) + petrol (solidity) covers both emotional poles competitors usually pick only one of.

---

## Part B — Roadmap

### Tier 1 — Quick Wins ✅ SHIPPED (June 2026)

| Item | Status |
|---|---|
| Layer 1 primitives (gold/petrol/neutral 50–950 + status) in globals.css | ✅ |
| `--brand-gold` corrected `#E3C064 → #E2C063`; stray rgba/hex cleaned | ✅ |
| Legacy themes remapped as deprecated aliases (zero component edits) | ✅ |
| Monolith → petrol: Featured Projects section now on brand secondary | ✅ |
| shadcn vars: `--primary` exact gold, `--secondary` petrol-800, `--destructive` brick red, `--foreground` `#1D1D1B` | ✅ |
| Alegreya superfamily via next/font; font alias layer (29 files untouched) | ✅ |
| Tailwind `gold/petrol/neutral` scales + `font-display/sans/data` utilities | ✅ |
| ContactSection error red → `--error-600` | ✅ |
| This documentation set; old DESIGN_TOKENS.md deprecated | ✅ |

### Tier 2 — Medium impact (structural, 1–3 weeks)

| # | Item | Notes / risk |
|---|---|---|
| 2.1 | **Migrate hardcoded hex → tokens** in the 53 affected files (worst first: `ProjectForm`, `MediaGrid`, `LeadsKanban`, `AdminSidebar`, portfolio pages) | Mechanical; verify per screen. Replace inline `style={{}}` colors with `var(--gold-400)` etc. or Tailwind utilities |
| 2.2 | **Delete dead code**: `src/components/ui/` (byte-identical dup), `src/index.css`, `src/sections/`, `src/components/` legacy, `src/App.tsx` | Verify zero imports first (audited: zero) — low risk, big hygiene win |
| 2.3 | **Unify forms** on shadcn `Form`/`FormField` (migrate ContactSection) | Keep gooey visual shell; only swap field internals. Risk: focus/blur styling regressions |
| 2.4 | **Consolidate buttons**: shadcn `Button` brand variants (primary/secondary/petrol/ghost); `.btn-*` become shims, then delete | Touches marketing CTAs — visual-diff each |
| 2.5 | **Standardize login breakpoints** (1100/960/767 → Tailwind sm/md/lg) | Cosmetic refactor |
| 2.6 | **Space Grotesk decision**: specimen-test Alegreya Sans `tabular-nums`/`lnum` for KPIs; if stable, `--font-data: var(--font-sans)` and drop the third font (perf win) | Risk: Google-Fonts subset may lack reliable tnum — test before switching |
| 2.7 | **Status tokens adoption**: quote-status timeline + Kanban use the 02-components.md badge table | Removes last ad-hoc status hexes |

### Tier 3 — High impact (transformational, 1–2 months)

| # | Item | Notes / risk |
|---|---|---|
| 3.1 | **Sectional theme consolidation**: express Atelier/Heritage surfaces entirely through neutral+gold+petrol tokens; retire `--heritage-*` literals into a documented "photography companion" palette | Highest visual risk — needs art direction sign-off per section |
| 3.2 | **Petrol expansion**: petrol CTA blocks (02-components §3), petrol secondary buttons across quote flows, petrol data-viz theme in admin charts | Builds the trust pole of the brand |
| 3.3 | **Dark mode**: infrastructure exists (`darkMode:["class"]`, next-themes installed, HSL vars); define `.dark` values (neutral-950 canvas, gold-400 primary survives, petrol lifts two steps) | Medium effort; admin first, marketing later |
| 3.4 | **Contrast audit** (automated, axe/Lighthouse CI): enforce gold-text rules from 01-foundations §1.6 | Pairs with 2.1 migration |
| 3.5 | **Component hardening**: the 48 shadcn components are present but Dialog/Tabs/Drawer/Accordion are barely consumed — add stories/usage or prune to what the product needs | Reduces untested surface |
| 3.6 | **Photography & scrim standard**: shoot/edit guidelines (warm grade, golden-hour exteriors, petrol-cool drafting/detail shots) + the two-scrim system | Brand-level, beyond code |

### Sequencing logic

2.2 (deletion) → 2.1 (migration shrinks) → 2.4/2.3 (consolidation on clean ground) → Tier 3. Each Tier-2 item is independently shippable; Tier 3.1 should not start until 2.1 is complete, or the migration doubles.

### Standing risks

1. **Alias debt**: deprecated vars work indefinitely but invite new usage — lint rule (`no-restricted-syntax` on `--atelier|--heritage|--monolith|--brand-gold|#[0-9A-Fa-f]{6}` in style objects) recommended when 2.1 starts.
2. **Font metrics**: Alegreya's larger x-height vs Cormorant — display clamps may need the documented fallback adjustment (`h1: clamp(2.75rem, 6.5vw, 5.25rem)`) if any layout shows wrapping; check hero + flip-letters + login after content changes.
3. **Weight 600 gap**: `font-semibold` → 700 in Alegreya Sans; if admin labels feel heavy, drop label rule to 500.
4. **Opacity modifiers**: `bg-gold-400/20` silently fails on var-backed colors — use `--gold-a*`; consider a stylelint guard.
