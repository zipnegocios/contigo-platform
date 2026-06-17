# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-16

### Added

#### Design System Foundation
- **Token Architecture (Layer 1 & 2)**
  - `src/presentation/design-system/tokens/contigo-primitives.css`: 43 foundational color tokens (gold/petrol/neutral scales, status colors, alpha tints)
  - `src/presentation/design-system/tokens/contigo-semantic.css`: 14 brand semantic tokens + shadcn HSL mappings + deprecated aliases (backwards compatibility)
  - `src/presentation/design-system/tokens/contigo-admin.css`: 40+ admin-specific tokens (status colors, form styling, table tokens)

#### Atomic Component Library
- **Atoms (6 components)**
  - `Button.tsx`: 5 variants (primary/secondary/outline/ghost/destructive) + 3 sizes (sm/md/lg) with CVA
  - `Input.tsx`: Focus states with gold-400 ring, full Tailwind integration
  - `Badge.tsx`: 6 variants (default/secondary/success/warning/error/outline)
  - `Card.tsx`: Composable family (Card + CardHeader/Title/Description/Content/Footer)
  - `Icon.tsx`: lucide-react wrapper with 5 sizes (xs/sm/md/lg/xl)
  - `index.ts`: Barrel export with full TypeScript support

- **Molecules (3 components)**
  - `FormField.tsx`: Label + Input + Error/Helper text with aria-invalid
  - `ButtonGroup.tsx`: Flexible container (row/column) with responsive stacking
  - `CardGrid.tsx`: Responsive grid (1-4 columns) with mobile-first breakpoints
  - `index.ts`: Barrel export

#### Documentation
- `src/presentation/design-system/README.md`: Main entry point with quick start, structure, deprecation notice, composition rules
- `src/presentation/design-system/tokens/README.md`: Token reference with color scales, usage examples, contrast rules, migration checklist
- `src/presentation/design-system/COMPOSITION_RULES.md`: Atomic design discipline, import paths, testing patterns
- `docs/design-system/` (expanded): Foundation audit, components spec, motion language, implementation roadmap

### Changed

#### Migration to contigo-design-system
- **Organism Refactoring**
  - `Navigation.tsx`: Migrated to use Button atom + contigo tokens (replaced atelier-*, brand-* tokens)
  - `Footer.tsx`: Migrated from heritage-dark (#1E1812) to **petrol-800** (#0D3C4C) + neutral-50 text
  - `HeritageSection.tsx`: Migrated background from heritage-dark to **petrol-800** (kept flip-letter animation intact)
  - `AdminSidebar.tsx`: Migrated from #1E1A16 to petrol-800 + neutral-50, added Button atom for nav items
  - `ContactForm.tsx`: Migrated to FormField molecules + Button atom, replaced error red with --error-600
  - `ProjectForm.tsx`: Migrated 50+ hardcoded hex colors to contigo tokens

- **Public Page Sections (Automated Migration)**
  - `BrandBar.tsx`: Replaced atelier-ivory with neutral-50
  - `HeroSection.tsx`: Replaced brand-gold with contigo-primary
  - `ServicesSection.tsx`: Replaced 8+ theme tokens with neutral/gold scales
  - `ContactSection.tsx`: Migrated form styles to FormField molecules + tokens

- **Admin Components (Bulk Migration)**
  - 29 admin component files migrated from hardcoded hex colors to design system tokens
  - Examples: UploadQueuePanel, QuoteInboxTable, LeadsKanban, ProjectTable, MediaGrid, etc.
  - Color replacements: #1E1A16 → petrol-800, #E8DCC4 → neutral-50, #A89E8C → neutral-600, etc.

- **Token Layer Consolidation**
  - `app/globals.css`: Refactored to import `contigo-primitives.css` + `contigo-semantic.css` instead of inline definitions
  - Removed 138+ lines of inline `:root` token definitions
  - Cleaner separation: primitives → semantics → utilities → components

### Removed

#### Deprecated Theme System
- **Theme Aliases (Deprecated but maintained for backwards compatibility)**
  - `--heritage-*` (dark earth palette): Marked as "do not use in new code"
  - `--atelier-*` (warm ivory palette): Marked as "do not use in new code"
  - `--monolith-*` (cool slate palette): Remapped to petrol scale
  - `--brand-gold`, `--admin-*` (legacy semantics): Deprecated in favor of contigo-* naming
  - `--font-cormorant`, `--font-inter`, `--font-space` (legacy fonts): Remapped to contigo-font-*

#### Dead Code (Pending)
- `src/sections/` (7 files): Duplicates of `src/presentation/sections/` — marked for deletion
- `src/components/` (legacy): Duplicates including CustomCursor, Navigation, ParticleScene — marked for deletion
- `src/components/ui/` (53 files): Byte-identical copies of `src/presentation/components/ui/` — marked for deletion
- `src/App.tsx`: Legacy Vite entry point — marked for deletion
- `src/index.css`: Legacy styles — marked for deletion
- Screenshots and verification images (6 files): footer-*.png files — marked for deletion

### Fixed

- **Color Contrast Compliance**: All text/background pairs now respect WCAG AA standards
  - Gold text only on dark surfaces (neutral-800+, petrol-800+): ≥7:1
  - Never gold-400 as body text on light backgrounds
  - Proper ink/neutral text on all filled surfaces

- **Typography Migration**: Replaced Cormorant Garamond + Inter + Space Grotesk with Alegreya superfamily
  - `--font-display`: Alegreya serif for headings/display
  - `--font-sans`: Alegreya Sans for UI/body/labels
  - `--font-data`: Space Grotesk for numerals/KPIs

### Build & Verification

- ✅ `npm run build` PASSING (no CSS/TypeScript errors)
- ✅ All 16 tasks (Phases 1-4) implemented and reviewed
- ✅ 20+ commits with detailed messages
- ✅ Zero deprecated tokens in active UI code
- ✅ All animations, form validation, scroll behaviors preserved
- ✅ Comprehensive documentation in place

### Next Steps (Phase 5 - Cleanup)

- [ ] Delete src/sections/ (7 legacy files)
- [ ] Delete src/components/ legacy files
- [ ] Delete src/components/ui/ (53 duplicate shadcn components)
- [ ] Delete src/App.tsx and src/index.css
- [ ] Clean up deprecated CSS in app/globals.css (18 references to legacy tokens)
- [ ] Remove screenshots and verification images (6 files)
- [ ] Final audit for remaining hardcoded colors (documented exceptions: WebGL shaders, email templates)

### Technical Debt Resolved

- ✅ Consolidated fragmented theme system (Heritage/Atelier/Monolith) → unified contigo-design-system
- ✅ Eliminated 200+ hardcoded hex colors → tokens
- ✅ Implemented atomic design architecture (atoms → molecules → organisms)
- ✅ Established 2-layer token architecture (primitives + semantics)
- ✅ Created production-ready component library
- ✅ Aligned 100% with corporate brand manual (April 2026)

## [0.1.0] - Pre-refactor state

### Legacy State
- Fragmented theme system (Heritage brown, Atelier ivory, Monolith slate)
- 300+ hardcoded hex colors across codebase
- No atomic design structure
- Multiple component library copies
- Deprecated typography (Cormorant, Inter, Space Grotesk as separate fonts)
- Inconsistent token naming across layers

---

**Semantic Versioning Notes:**
- v1.0.0: Complete design system consolidation, atomic architecture, brand realignment
- Future v1.1.0: Dark mode support, additional component variants
- Future v2.0.0: Multi-brand support, extended token system for different customer tiers
