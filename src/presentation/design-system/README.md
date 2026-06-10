# contigo-design-system

**Professional, scalable design system for Contigo Platform**

Version 1.0 · June 2026

---

## Quick Start

### For Designers/Product
- View the **[Token Reference](./tokens/README.md)** for color scales, typography, spacing.
- Check **[Component Spec](./components/README.md)** for atomic components + composition rules.
- Review **[Motion Language](./motion.md)** for animation standards.

### For Engineers
- **Atoms** are in `./components/atoms/` — import directly:
  ```tsx
  import { Button, Input, Card } from '@/presentation/design-system/components/atoms';
  ```

- **Molecules** are in `./components/molecules/` — composed from atoms:
  ```tsx
  import { FormField } from '@/presentation/design-system/components/molecules';
  ```

- **Organisms** are in `./components/organisms/` — page-level sections:
  ```tsx
  import { Navigation, Footer } from '@/presentation/design-system/components/organisms';
  ```

- **Use contigo-* tokens** in styles:
  ```tsx
  <button style={{ backgroundColor: 'var(--contigo-primary)' }}>
    Click me
  </button>
  ```

---

## Structure

```
src/presentation/design-system/
├── tokens/                  ← Color scales, typography, spacing
│   ├── contigo-primitives.css
│   ├── contigo-semantic.css
│   └── README.md
├── components/
│   ├── atoms/               ← Base UI building blocks
│   ├── molecules/           ← Composed controls
│   ├── organisms/           ← Page sections
│   └── README.md
├── hooks/                   ← React hooks (animations, responsive, etc.)
├── styles/                  ← Global component styles
│   ├── contigo-components.css
│   └── contigo-utilities.css
├── README.md               ← You are here
└── COMPOSITION_RULES.md    ← Atomic design discipline + patterns
```

---

## Deprecation Notice

This system replaces the previous **theme-based approach** (Heritage, Atelier, Monolith). These names are deprecated:
- `--heritage-*`, `--atelier-*`, `--monolith-*` (colors)
- `--brand-gold`, `--admin-*` (semantics)
- `--font-cormorant`, `--font-inter`, `--font-space` (fonts)

**All new code must use `--contigo-*` tokens or Layer 1 primitives.** See migration plan in `docs/superpowers/plans/2026-06-10-contigo-design-system.md`.

---

## Composition Rules (Atomic Design Discipline)

1. **Atoms** are pure, self-contained, zero dependencies on other components.
   - Example: `Button`, `Input`, `Badge`
   - Must accept `className` prop for Tailwind overrides
   - Optionally accept `variant`, `size`, `disabled` props

2. **Molecules** compose 2–5 atoms into common patterns.
   - Example: `FormField` = Label + Input + Error message
   - May manage internal state (focus, error)
   - Still UI-agnostic (no business logic)

3. **Organisms** compose molecules + atoms into page-level sections.
   - Example: `Navigation`, `ContactForm`, `ProjectGrid`
   - May manage complex state, API calls, routing
   - Tied to specific business domain (marketing, admin)

4. **Composition rule**: Never skip a layer.
   - ❌ DON'T: Organism directly uses raw HTML `<div>`, `<button>`
   - ✅ DO: Organism uses `Button` (atom) or `FormField` (molecule)

5. **Styling rule**: All styling uses tokens
   - ❌ DON'T: `style={{ color: '#1D1D1B' }}`
   - ✅ DO: `style={{ color: 'var(--contigo-foreground)' }}`

---

## Common Patterns

### Adding a New Button Variant
1. Update `atoms/Button.tsx` CVA definition
2. Optionally create a `molecules/ButtonPair.tsx` if the variant is reusable
3. Use in organisms/pages

### Adding a New Section Type
1. Create `organisms/sections/YourSection.tsx`
2. Compose from atoms/molecules
3. Register in `organisms/sections/index.ts`
4. Import in page route

### Styling with Tokens
```tsx
// ✅ DO: Use contigo tokens
<div style={{ color: 'var(--contigo-foreground)' }}>

// ✅ DO: Use Tailwind utilities
<div className="text-neutral-900 bg-gold-50">

// ❌ DON'T: Hardcode hex
<div style={{ color: '#1D1D1B' }}>

// ❌ DON'T: Use deprecated tokens
<div style={{ color: 'var(--heritage-dark)' }}>
```

---

## Files to Read Next

- **[Token Reference](./tokens/README.md)** — all available colors, fonts, status colors
- **[Component Guide](./components/README.md)** — atoms, molecules, organisms specs
- **[Composition Rules](./COMPOSITION_RULES.md)** — when to use each layer
- **[Motion Language](./motion.md)** — animation durations, easings, GSAP patterns

---

## Brand Values

The Contigo design system transmits:
- **Prestige** — through selective gold accents, luxury typography (Alegreya)
- **Quality** — through precision spacing, consistent patterns, attention to detail
- **Trust** — through petrol secondary color, solid proportions, professional palette
- **Professionalism** — through clear hierarchy, semantic naming, documented patterns
- **Closeness** — through warm neutrals, human scale, accessible interactions
- **Constructive Solidity** — through petrol trust + gold signature, engineering credibility

---

## Implementation Status

**Phase 1: Token Consolidation** ✅ COMPLETE
- ✅ Layer 1 primitives (contigo-primitives.css)
- ✅ Layer 2 semantics (contigo-semantic.css)
- ✅ Modular imports in app/globals.css
- ✅ Token documentation (tokens/README.md)
- ✅ Main design system README (this file)

**Phase 2: Atomic Components** 🔄 IN PROGRESS
- ⏳ Atom library (Button, Input, Badge, Card, Icon)
- ⏳ Molecule library (FormField, ButtonGroup, CardGrid)
- ⏳ Organism library (Navigation, Footer, Forms, Sections)

**Phase 3-6:** See implementation plan in `docs/superpowers/plans/2026-06-10-contigo-design-system.md`

---

## Support

- **Token questions?** See [tokens/README.md](./tokens/README.md)
- **Component questions?** See [components/README.md](./components/README.md)
- **Deprecation migration?** See implementation plan
- **Motion/animation?** See motion.md

---

## Version History

### v1.0 (June 2026)
- Initial release: Token consolidation + atomic design foundation
- Consolidated Layer 1 (primitives) + Layer 2 (semantics)
- Eliminated deprecated themes (Heritage, Atelier, Monolith)
- Established composition rules for atoms/molecules/organisms
