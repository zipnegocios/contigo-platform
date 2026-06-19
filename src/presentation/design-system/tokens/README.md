# contigo-design-system Tokens

## Overview

The token architecture consists of two layers:

### Layer 1: Primitives (`contigo-primitives.css`)
Foundational color scales, status colors, and semantic utilities. These are the only source of color truth.

- **Gold scale** (50–950): Brand primary (#E2C063 at 400)
- **Petrol scale** (50–950): Brand secondary (#0D3C4C at 800)
- **Neutral scale** (50–950): Warm anchor (#1D1D1B at 900)
- **Status colors**: success, warning, error, info
- **Alpha tints**: `--gold-a06`, `--gold-a12`, `--gold-a15`, `--gold-a30`

### Layer 2: Semantics (`contigo-semantic.css`)
Brand-specific semantic names + shadcn HSL mappings.

- `--contigo-primary`, `--contigo-secondary`, etc. (NEW — use these)
- `--primary`, `--secondary`, `--destructive`, etc. (shadcn — for CVA components)
- Deprecated aliases: `--heritage-*`, `--atelier-*`, `--monolith-*`, `--admin-*`

## Usage Examples

### Colors

```css
/* ✅ DO: Use contigo semantics in new code */
.button {
  background-color: var(--contigo-primary);
  color: var(--contigo-foreground);
}

/* ✅ DO: Use gold scale primitives for fine-grained control */
.card-hover {
  background-color: var(--gold-a12);
}

/* ❌ DON'T: Use deprecated theme names */
.footer {
  background-color: var(--heritage-dark); /* Deprecated */
}

/* ❌ DON'T: Hardcode hex values */
.button {
  background-color: #E2C063; /* Use var(--contigo-primary) instead */
}
```

### Tailwind Utilities

```tsx
// ✅ DO
<div className="bg-gold-400 text-petrol-800 border-neutral-200">

// ❌ DON'T
<div style={{ backgroundColor: '#E2C063', color: '#0D3C4C' }}>
```

### TypeScript/TSX

```tsx
// ✅ DO: Reference in style object
<section style={{ backgroundColor: 'var(--contigo-secondary)' }}>

// ❌ DON'T: Hardcode
<section style={{ backgroundColor: '#0D3C4C' }}>
```

## Contrast Rules (Non-Negotiable)

1. **Gold as text**: Never on light backgrounds (`gold-400` on ivory ≈ 1.6:1 FAIL)
   - Use `gold-700` (AA for large text) or ink
   - Gold text only on dark surfaces (neutral-800+, petrol-800+): ≥7:1

2. **Gold fills**: Text is always ink (`neutral-800`/`900`), never white

3. **Petrol fills**: Text is ivory (`neutral-50`) or gold-400 for accents

4. **Verified pairs**:
   - petrol-900 on petrol-100: ≈12:1 ✅
   - neutral-800 on neutral-50: ≈12.4:1 ✅

## Migration Checklist

- [ ] Replace `--heritage-dark` → `var(--petrol-800)` (or `--neutral-900)` per context)
- [ ] Replace `--heritage-sand` → `var(--neutral-50)`
- [ ] Replace `--atelier-ivory` → `var(--neutral-50)`
- [ ] Replace `--brand-gold` → `var(--contigo-primary)`
- [ ] Replace hardcoded `#E2C063` → `var(--contigo-primary)`
- [ ] Replace hardcoded `#0D3C4C` → `var(--contigo-secondary)`
- [ ] Replace hardcoded `#1D1D1B` → `var(--contigo-foreground)`
- [ ] Remove `--font-cormorant` → use `--contigo-font-display`
- [ ] Remove `--font-inter` → use `--contigo-font-sans`

---

## Token Reference Tables

### Gold Scale
| Token | Hex | Usage |
|---|---|---|
| `--gold-50` | #FBF7EC | Light backgrounds, hover washes |
| `--gold-100` | #F6EDD4 | Selected rows, subtle highlights |
| `--gold-200` | #F0E1B2 | Decorative fills, charts |
| `--gold-300` | #EAD28C | Hover state of gold-200 |
| **`--gold-400`** | **#E2C063** | **BRAND PRIMARY — CTAs, active nav** |
| `--gold-500` | #C8A55C | Secondary accents |
| `--gold-600` | #D4AF37 | Hover state of CTAs |
| `--gold-700` | #A08040 | Gold text on light backgrounds |
| `--gold-800` | #6E5526 | Deep gold, borders |
| `--gold-900` | #4A3A1A | Near-bronze, rare |
| `--gold-950` | #2B2110 | Darkest shadow tone |

### Petrol Scale
| Token | Hex | Usage |
|---|---|---|
| `--petrol-50` | #ECF5F8 | Light petrol surface |
| `--petrol-100` | #D5E9EF | Section backgrounds |
| `--petrol-200` | #ABD3DF | Borders on petrol |
| `--petrol-300` | #7DB7C8 | Decorative, charts |
| `--petrol-400` | #5295AA | Charts, secondary icons |
| `--petrol-500` | #34758C | Muted petrol text |
| `--petrol-600` | #1F5A70 | Info status, links |
| `--petrol-700` | #15485C | Hover state |
| **`--petrol-800`** | **#0D3C4C** | **BRAND SECONDARY — buttons, headers** |
| `--petrol-900` | #092B38 | Ink on petrol |
| `--petrol-950` | #051E27 | Deepest petrol |

### Neutral Scale
| Token | Hex | Usage |
|---|---|---|
| `--neutral-50` | #FAF6F0 | Page background (ivory) |
| `--neutral-100` | #F5EDE0 | Secondary surfaces |
| `--neutral-200` | #E5DDD0 | Borders, dividers |
| `--neutral-300` | #CFC5B6 | Intermediate |
| `--neutral-400` | #A89E8C | Tertiary text |
| `--neutral-500` | #847B6F | Intermediate |
| `--neutral-600` | #6B6560 | Secondary text |
| `--neutral-700` | #4D4843 | Intermediate |
| `--neutral-800` | #2D2924 | Primary text (ink) |
| **`--neutral-900`** | **#1D1D1B** | **BRAND NEUTRAL** |
| `--neutral-950` | #141312 | Deepest surfaces |

## Semantic Tokens (Layer 2)

### Brand Semantics

| Token | Resolves To | Usage |
|---|---|---|
| `--contigo-primary` | gold-400 | Primary CTAs, active states |
| `--contigo-primary-hover` | gold-600 | Hover state of primary |
| `--contigo-secondary` | petrol-800 | Secondary buttons, headers |
| `--contigo-foreground` | neutral-900 | Primary text |
| `--contigo-background` | neutral-50 | Page background |
| `--contigo-muted` | neutral-600 | Secondary text |
| `--contigo-border` | neutral-200 | Borders, dividers |

### Font Families

| Token | Font | Usage |
|---|---|---|
| `--contigo-font-display` | Alegreya | Headings, display |
| `--contigo-font-sans` | Alegreya Sans | UI, body text |
| `--contigo-font-data` | Space Grotesk | Numerals, KPIs |

---

## FAQ

**Q: When should I use Layer 1 vs Layer 2?**
- Layer 1 when you need specific intensity (e.g., `var(--gold-700)` for text on light)
- Layer 2 when using semantic names (e.g., `var(--contigo-primary)` for CTAs)

**Q: Can I use both gold-400 and --contigo-primary?**
- Yes, both work. Prefer semantic names (Layer 2) in new code.

**Q: What about the deprecated tokens?**
- Still work for backwards compatibility. Migrate when touching a file.

**Q: How do I use these in TypeScript?**
- Import the CSS file in globals.css (already done)
- Reference in style objects: `{ backgroundColor: 'var(--contigo-primary)' }`
- Or use Tailwind utilities: `className="bg-gold-400"`
