# Contigo Design Tokens

Reference for all UI modules. Source: `github.com/zipnegocios/contigo-design-system`.

## Colors

### Brand Gold
| Token | Value | Use |
|---|---|---|
| `--brand-gold` / `#E2C063` | Primary accent | CTAs, active nav, icons, borders |
| `--brand-gold-hover` / `#D4AF37` | Hover state | All interactive gold elements |
| `--brand-gold-light` / `#C8A55C` | Lighter variant | Subtle tints |
| `--brand-gold-antique` / `#A08040` | Darker variant | Text on light gold bg |

### Admin Sidebar
| Token | Value |
|---|---|
| Sidebar BG | `#1E1A16` |
| Sidebar Text (idle) | `#E8DCC4` |
| Sidebar Muted | `#A89E8C` |
| Sidebar Active BG | `rgba(226, 192, 99, 0.15)` |
| Sidebar Active Text | `#E2C063` |
| Sidebar Border | `rgba(226, 192, 99, 0.12)` |

### Atelier (Primary Theme — Warm Luxury)
| Token | Value | Use |
|---|---|---|
| `--atelier-ivory` / `#FAF6F0` | Admin page background |
| `--atelier-cream` / `#F5EDE0` | Table headers, secondary surfaces |
| `--atelier-ink` / `#2D2924` | Primary text |
| `--atelier-muted` / `#6B6560` | Secondary text, labels |
| `--atelier-border` / `#E5DDD0` | Card borders, dividers |

### Status Badge Palette
| Status | BG | Text |
|---|---|---|
| `new` | `rgba(226,192,99,0.15)` | `#A08040` |
| `contacted` | `rgba(228,193,92,0.2)` | `#7A5C00` |
| `in_progress` | `rgba(13,60,76,0.12)` | `#0D3C4C` |
| `converted` / `won` | `rgba(34,197,94,0.12)` | `#15803d` |
| `closed` / `lost` | `rgba(107,101,96,0.1)` | `#6B6560` |

### Kanban Column Palette
| Stage | Column BG | Border | Header Accent |
|---|---|---|---|
| prospect | `rgba(226,192,99,0.06)` | `rgba(226,192,99,0.25)` | gold |
| contacted | `rgba(228,193,92,0.08)` | `rgba(228,193,92,0.3)` | gold-light |
| quoted | `rgba(13,60,76,0.06)` | `rgba(13,60,76,0.2)` | navy |
| won | `rgba(34,197,94,0.06)` | `rgba(34,197,94,0.25)` | green |
| lost | `rgba(107,101,96,0.08)` | `rgba(107,101,96,0.2)` | muted |

## Typography

| Family | Variable | Use |
|---|---|---|
| Cormorant Garamond | `var(--font-cormorant)` / `var(--font-cormorant-garamond)` | Page headings, section titles, luxury display |
| Inter | `var(--font-inter)` / `var(--font-inter-regular)` | Body, labels, nav, form text |
| Space Grotesk | `var(--font-space)` / `var(--font-space-grotesk)` | Numbers, KPI values, monospace, data |

### Heading Scale
| Level | Size | Weight | Font |
|---|---|---|---|
| Display | `text-4xl` to `text-5xl` | 700 | Cormorant |
| H1 | `text-3xl` | 600 | Cormorant |
| H2 | `text-xl` | 600 | Cormorant |
| Label | `text-xs` uppercase | 500 | Inter |
| Body | `text-sm` to `text-base` | 400 | Inter |
| Data | `text-2xl` | 700 | Space Grotesk |

## Tailwind Arbitrary Values Quick Reference

```
bg-[#1E1A16]            → sidebar dark
bg-[#FAF6F0]            → admin page background
text-[#E2C063]          → gold accent
text-[#E8DCC4]          → sidebar idle text
text-[#2D2924]          → ink (primary text)
text-[#6B6560]          → muted secondary
text-[#A89E8C]          → sidebar muted
border-[#E5DDD0]        → card/table border
border-[#E2C063]        → gold border
bg-[rgba(226,192,99,0.15)]  → active nav bg / gold tint
font-[family-name:var(--font-cormorant)]     → serif headings
font-[family-name:var(--font-space)]         → numeric data
```

## Spacing & Shape Tokens

| Token | Value |
|---|---|
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| Sidebar Width | 280px |
| Card Shadow | `0 4px 12px rgba(45,41,36,0.08)` |

## Assets

| File | Use |
|---|---|
| `/public/logo-principal.png` | Full horizontal logo (login page, wide spaces) |
| `/public/logo-secundario.png` | Secondary variant |
| `/public/isotipo.png` | Icon only (sidebar header, favicon areas) |

## Animations

| Token | Value | Use |
|---|---|---|
| `transition-fast` | 150ms ease | Hover states |
| `transition-base` | 250ms ease | Active/focus states |
| Easing | `cubic-bezier(0.4, 0, 0.2, 1)` | All transitions |
