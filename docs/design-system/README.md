# Contigo Constructions — Design System

**Version 1.0 · June 2026 · Source of truth for the Contigo Platform visual language**

This design system realigns the website with the official **Manual Corporativo Contigo Constructions Pty (April 2026)** and codifies a scalable token architecture for future growth.

## Brand reference (from the corporate manual)

| Role | Value | Meaning |
|---|---|---|
| Primary | `#E2C063` | Soft gold / premium mustard — prestige, quality |
| Secondary | `#0D3C4C` | Deep petrol blue — trust, solidity |
| Neutral | `#1D1D1B` | Warm near-black (C0 M0 Y0 K100) |
| Typeface | Alegreya Sans Bold | Implemented as the **Alegreya superfamily**: Alegreya (serif) for display, Alegreya Sans for UI/body |
| Logo protection area | 1.38 cm | All logo variants (full, CC monogram, text-only, positive/negative) |

Brand values the UI must transmit: **prestige, quality, trust, professionalism, closeness, constructive solidity, modern elegance.**

## Documents

| File | Contents |
|---|---|
| [00-audit.md](00-audit.md) | Audit of the pre-realignment website: findings, conflicts with the manual, risks |
| [01-foundations.md](01-foundations.md) | Design tokens: color scales, typography, spacing, radius, shadows, grid |
| [02-components.md](02-components.md) | Component specifications: navigation, buttons, cards, forms, overlays |
| [03-motion.md](03-motion.md) | Motion language: durations, easings, GSAP/Lenis patterns, accessibility |
| [04-roadmap.md](04-roadmap.md) | Premium positioning analysis + phased implementation roadmap with risks |

## The golden rule

> **Never hardcode a hex color or font name in a component.**
> Use Layer 1 primitives (`var(--gold-400)`, `var(--petrol-800)`, `var(--neutral-900)`), shadcn semantic tokens (`bg-primary`, `text-secondary`), or Tailwind brand utilities (`bg-gold-400`, `text-petrol-800`, `font-display`).

Legacy names (`--brand-gold`, `--atelier-*`, `--heritage-*`, `--monolith-*`, `--admin-*`, `--font-cormorant`, `--font-inter`, `--font-space`) are **deprecated aliases** kept only so existing components don't break. They now resolve to the new primitives. Do not use them in new code; migrate them opportunistically when touching a file (see [04-roadmap.md](04-roadmap.md)).

## Token architecture

```
Layer 1 — Primitives (app/globals.css :root)
  --gold-50…950, --gold-a06/a12/a15/a30      (primary scale, brand at 400)
  --petrol-50…950                             (secondary scale, brand at 800)
  --neutral-50…950                            (warm neutrals, brand at 900)
  --success/--warning/--error/--info          (status)

Layer 2 — Semantics
  shadcn HSL vars (--primary, --secondary, --destructive, --ring…)
  deprecated aliases (--brand-gold, --atelier-*, --heritage-*, --monolith-*, --admin-*)

Layer 3 — Utilities (tailwind.config.js)
  bg-gold-400 · text-petrol-800 · border-neutral-200 · font-display · font-sans · font-data
```

**Known limitation:** Tailwind opacity modifiers (`bg-gold-400/20`) do not work on var-backed hex colors. Use the alpha tint tokens (`--gold-a06`, `--gold-a12`, `--gold-a15`, `--gold-a30`) instead — this matches the existing codebase patterns.
