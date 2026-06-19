# contigo-design-system Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the design language into a single, maintainable `contigo-design-system` using atomic design patterns, eliminating deprecated theme aliases (Heritage, Atelier, Monolith) and establishing professional token standards for all UI—both marketing front-page and admin dashboard.

**Architecture:** 
- **Token layer:** Consolidate Layer 1 (primitives) + Layer 2 (semantics) into `contigo-design-system` with a clean component CSS library, removing all deprecated `--heritage-*`, `--atelier-*`, `--monolith-*` aliases.
- **Component layer:** Implement explicit atomic design (`atoms/` → `molecules/` → `organisms/` folders) with shadcn components mapped to atoms, admin/marketing components composed from atoms + molecules.
- **Implementation order:** Tokens first (foundation), then atoms (UI primitives), then molecules (form controls, cards), then organisms (pages/sections), then migrate both front-page and admin to consume the new system.

**Tech Stack:** 
- CSS variables (Layer 1 primitives), Tailwind utilities (brand scales), shadcn/ui (atom library), React (component composition), GSAP (animations), TypeScript, Next.js 15 App Router.

---

## File Structure (Pre-Implementation)

### New Directories
```
src/presentation/
├── design-system/                    ← NEW: All design system code
│   ├── tokens/
│   │   ├── contigo-primitives.css   ← Layer 1: gold/petrol/neutral/status
│   │   ├── contigo-semantic.css     ← Layer 2: brand semantics (--contigo-primary, etc.)
│   │   └── README.md                ← Token reference
│   ├── components/
│   │   ├── atoms/                   ← UI primitives (Button, Input, Badge, Icon, etc.)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Icon.tsx
│   │   │   └── index.ts             ← Barrel export
│   │   ├── molecules/               ← Composed controls (FormField, ButtonGroup, etc.)
│   │   │   ├── FormField.tsx        ← Label + Input + Error
│   │   │   ├── ButtonGroup.tsx
│   │   │   ├── CardGrid.tsx
│   │   │   └── index.ts
│   │   ├── organisms/               ← Page-level (Navigation, Footer, Sidebar, etc.)
│   │   │   ├── navigation/
│   │   │   │   ├── Navigation.tsx
│   │   │   │   ├── AdminSidebar.tsx
│   │   │   │   └── index.ts
│   │   │   ├── forms/
│   │   │   │   ├── ProjectForm.tsx
│   │   │   │   ├── ContactForm.tsx
│   │   │   │   └── index.ts
│   │   │   ├── sections/            ← Marketing sections
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── HeritageSection.tsx (renamed from "About")
│   │   │   │   ├── ProjectsSection.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── index.ts                 ← Unified export (atoms + molecules + organisms)
│   ├── hooks/                        ← Design system hooks (moved from ../hooks)
│   │   ├── useBreakpoint.ts
│   │   ├── useSectionAnimation.ts
│   │   └── index.ts
│   ├── styles/
│   │   ├── contigo-components.css   ← Atomic component base styles (buttons, cards, forms)
│   │   └── contigo-utilities.css    ← Helper classes (.page-padding, .section-gap)
│   └── README.md                     ← Design system guide + composition rules
├── components/
│   ├── atoms/                        ← Symlink or re-export to design-system/components/atoms
│   ├── molecules/
│   ├── organisms/
│   └── index.ts                      ← Re-exports from design-system for backwards compat
├── sections/                         ← Legacy (DEPRECATED — consumers migrate to organisms/sections/)
└── hooks/                            ← Legacy (DEPRECATED — move to design-system/hooks)

app/
├── globals.css                       ← Updated: imports contigo-system tokens + components
└── globals-legacy.css               ← Temporary: preserved for backwards compat (delete in cleanup phase)
```

---

## Phase 1: Token Consolidation & Foundation (3 days)

### Task 1.1: Create Layer 1 Primitives (contigo-primitives.css)

**Files:**
- Create: `src/presentation/design-system/tokens/contigo-primitives.css`
- Modify: `app/globals.css` (will import this new file)

- [ ] **Step 1: Create contigo-primitives.css with all color scales**

Create `src/presentation/design-system/tokens/contigo-primitives.css` with:
- Gold scale (50–950): `#FBF7EC` to `#2B2110`
- Petrol scale (50–950): `#ECF5F8` to `#051E27`
- Neutral scale (50–950): `#FAF6F0` to `#141312`
- Status colors: success, warning, error, info
- Alpha tints: `--gold-a06`, `--gold-a12`, `--gold-a15`, `--gold-a30`

Expected result: CSS file, no errors on `npm run build`

- [ ] **Step 2: Verify CSS syntax**

Run: `npm run build`
Expected: No CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add src/presentation/design-system/tokens/contigo-primitives.css
git commit -m "feat: create Layer 1 token primitives (gold/petrol/neutral scales)

- Extract from app/globals.css without value changes
- Add alpha tints for overlay support
- Add migration status documentation"
```

---

### Task 1.2: Create Layer 2 Semantic Tokens (contigo-semantic.css)

**Files:**
- Create: `src/presentation/design-system/tokens/contigo-semantic.css`

- [ ] **Step 1: Create contigo-semantic.css with new naming**

Create with:
- `--contigo-primary`, `--contigo-secondary`, `--contigo-foreground`, etc.
- shadcn HSL mappings: `--primary`, `--secondary`, `--destructive`, `--ring`
- Deprecated aliases for backwards compat: `--heritage-*`, `--atelier-*`, `--monolith-*`, `--admin-*`

- [ ] **Step 2: Commit**

```bash
git add src/presentation/design-system/tokens/contigo-semantic.css
git commit -m "feat: create Layer 2 semantic tokens for contigo-design-system

- Add --contigo-primary/secondary/foreground/background
- Map shadcn HSL triplets
- Maintain deprecated aliases for migration phase"
```

---

### Task 1.3: Update app/globals.css to Import Tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace inline :root with imports**

Replace the `:root { ... }` section with:

```css
@import '../src/presentation/design-system/tokens/contigo-primitives.css';
@import '../src/presentation/design-system/tokens/contigo-semantic.css';
```

- [ ] **Step 2: Verify no duplicate definitions**

Search for remaining `--gold-`, `--petrol-`, `--neutral-` in globals.css and remove duplicates.

- [ ] **Step 3: Test locally**

```bash
npm run dev
# Navigate to http://localhost:3000
# Verify: Hero section colors, buttons, overall styling unchanged
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "refactor: import contigo-design-system tokens from modular files

- Replace inline tokens with imports from contigo-primitives/semantic
- Verify no visual regressions"
```

---

### Task 1.4: Create Token Documentation

**Files:**
- Create: `src/presentation/design-system/tokens/README.md`

- [ ] Write comprehensive token reference with:
  - Color scales + usage
  - Typography mapping
  - Contrast rules
  - Usage examples (CSS, Tailwind, TSX)
  - Migration checklist

- [ ] **Commit**

```bash
git add src/presentation/design-system/tokens/README.md
git commit -m "docs: add token reference for contigo-design-system"
```

---

### Task 1.5: Create Main Design System README

**Files:**
- Create: `src/presentation/design-system/README.md`

- [ ] Write with sections:
  - Quick start for designers/engineers
  - Directory structure
  - Deprecation notice
  - Composition rules (atomic design)
  - Common patterns

- [ ] **Commit**

```bash
git add src/presentation/design-system/README.md
git commit -m "docs: add main entry point for contigo-design-system"
```

---

## Phase 2: Atomic Component Foundation (4–5 days)

### Task 2.1: Create Atom Components

**Files:**
- Create: `src/presentation/design-system/components/atoms/`
  - `Button.tsx` (primary, secondary, outline, ghost, destructive variants)
  - `Input.tsx` (with focus states using tokens)
  - `Badge.tsx` (default, secondary, success, warning, error, outline)
  - `Card.tsx` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
  - `Icon.tsx` (wrapper for lucide-react)
  - `index.ts` (barrel export)

- [ ] Implement Button with CVA (class-variance-authority)
- [ ] Implement Input with contigo tokens for focus states
- [ ] Implement Badge with status variants
- [ ] Implement Card family
- [ ] Create barrel export
- [ ] Test: `npm run build` (no errors)

- [ ] **Commit**

```bash
git add src/presentation/design-system/components/atoms/
git commit -m "feat: create atomic component library (Button, Input, Badge, Card, Icon)

- All use --contigo-* tokens, zero hardcoded colors
- Button: primary/secondary/outline/ghost/destructive variants + sizes
- Input: focus ring uses gold-400
- Badge: success/warning/error/outline variants
- Card: composable CardHeader/Title/Description/Content/Footer
- Icon: wrapper for lucide-react icons"
```

---

### Task 2.2: Create Molecule Components

**Files:**
- Create: `src/presentation/design-system/components/molecules/`
  - `FormField.tsx` (Label + Input + Error/Helper)
  - `ButtonGroup.tsx` (flex container for buttons, row/column)
  - `CardGrid.tsx` (responsive grid 1–4 columns)
  - `index.ts` (barrel export)

- [ ] Implement FormField using Input atom + label + error display
- [ ] Implement ButtonGroup with direction prop
- [ ] Implement CardGrid with responsive columns
- [ ] Create barrel export

- [ ] **Commit**

```bash
git add src/presentation/design-system/components/molecules/
git commit -m "feat: create molecule library (FormField, ButtonGroup, CardGrid)

- FormField: label + input + error/helper text
- ButtonGroup: flexible row/column arrangement
- CardGrid: responsive 1–4 column grid
- All composed from atoms"
```

---

## Phase 3: Organism Components (5–7 days)

### Task 3.1: Refactor Navigation to Atoms

**Files:**
- Modify: `src/presentation/sections/Navigation.tsx`

- [ ] Replace inline styles with `Button` atom
- [ ] Replace `var(--heritage-*)` with `var(--contigo-*)`
- [ ] Ensure focus states use gold-400 ring

- [ ] **Commit**

```bash
git commit -m "refactor: migrate Navigation to atomic design + contigo-tokens

- Use Button atom instead of inline styles
- Replace deprecated theme variables
- Verify focus states (gold ring)"
```

---

### Task 3.2: Refactor Footer (Heritage → Petrol)

**Files:**
- Modify: `src/presentation/sections/Footer.tsx`

- [ ] Change `backgroundColor: 'var(--heritage-dark)'` → `'var(--petrol-800)'`
- [ ] Change text `var(--heritage-sand)` → `var(--neutral-50)`
- [ ] Use `Button` atom for social links
- [ ] Rename nav ID from "heritage" to "footer"

- [ ] **Commit**

```bash
git commit -m "refactor: migrate Footer to petrol-800 + atomic design

- Change background from heritage-dark to petrol-800
- Change text from heritage-sand to neutral-50
- Use Button atom for social links
- Update navigation IDs"
```

---

### Task 3.3: Refactor Heritage Section (About)

**Files:**
- Modify: `src/presentation/sections/HeritageSection.tsx`

- [ ] Replace `.flip-section` background: `var(--heritage-dark)` → `var(--petrol-800)`
- [ ] Verify flip-letters animate to gold-400

- [ ] **Commit**

```bash
git commit -m "refactor: migrate HeritageSection to petrol-800 + contigo-tokens"
```

---

### Task 3.4: Refactor AdminSidebar to Atoms + Tokens

**Files:**
- Modify: `src/presentation/components/admin/AdminSidebar.tsx`

- [ ] Replace `'#1E1A16'` → `'var(--contigo-secondary)'` (or petrol-800)
- [ ] Replace `'#E8DCC4'` → `'var(--neutral-50)'`
- [ ] Replace `'#A89E8C'` → `'var(--contigo-muted)'`
- [ ] Replace `'--font-cormorant'` → `'--contigo-font-display'`
- [ ] Use `Button` atom instead of custom inline styles

- [ ] **Commit**

```bash
git commit -m "refactor: AdminSidebar to contigo-tokens + Button atom

- Replace 8+ hardcoded colors with token vars
- Use Button atom for nav items
- Replace deprecated font alias"
```

---

### Task 3.5: Refactor ContactForm to Molecules

**Files:**
- Modify or Create: `src/presentation/sections/ContactSection.tsx`

- [ ] Use `FormField` molecule for all inputs
- [ ] Use `Button` atom for submit
- [ ] Replace error red `#e74c3c` → `var(--error-600)`
- [ ] Remove hardcoded `heritage-*` colors

- [ ] **Commit**

```bash
git commit -m "refactor: ContactForm to molecules + contigo-tokens

- Use FormField for all form controls
- Replace hardcoded colors (8+ hex values → tokens)
- Use Button atom for submit"
```

---

### Task 3.6: Refactor ProjectForm (Admin)

**Files:**
- Modify: `src/presentation/components/admin/ProjectForm.tsx`

- [ ] Audit: count `style={{}}` instances with hardcoded colors
- [ ] Replace all with contigo tokens (~50+ replacements)
- [ ] Use atoms/molecules from design-system

- [ ] **Commit**

```bash
git commit -m "refactor: ProjectForm to atomic design + contigo-tokens

- Replace 50+ hardcoded hex colors with token vars
- Use Input/Button atoms, FormField molecules
- Zero remaining hardcoded colors"
```

---

## Phase 4: Token Migration (3–5 days)

### Task 4.1: Migrate All Public Page Sections

**Files:**
- All in `src/presentation/sections/`

- [ ] Run automated migration:

```bash
find src/presentation/sections -type f -name "*.tsx" -exec sed -i \
  -e 's/var(--heritage-dark)/var(--petrol-800)/g' \
  -e 's/var(--heritage-sand)/var(--neutral-50)/g' \
  -e 's/var(--atelier-ivory)/var(--neutral-50)/g' \
  -e 's/var(--brand-gold)/var(--contigo-primary)/g' \
  -e "s/'#1E1812'/var(--petrol-800)/g" \
  -e "s/'#E2C063'/var(--contigo-primary)/g" \
  {} \;
```

- [ ] Visual regression test: `npm run dev`, screenshot each section
- [ ] Verify colors match design spec

- [ ] **Commit**

```bash
git commit -m "refactor: migrate sections from deprecated themes to contigo-tokens

- Automated replacement of --heritage-*, --atelier-* with --contigo-*
- Visual regression tested (screenshots match)"
```

---

### Task 4.2: Migrate All Admin Components

**Files:**
- All in `src/presentation/components/admin/`

- [ ] Run automated migration:

```bash
find src/presentation/components/admin -type f -name "*.tsx" -exec sed -i \
  -e "s/'#1E1A16'/var(--contigo-secondary)/g" \
  -e "s/'#E8DCC4'/var(--neutral-50)/g" \
  -e "s/'#A89E8C'/var(--contigo-muted)/g" \
  -e "s/var(--font-cormorant)/var(--contigo-font-display)/g" \
  {} \;
```

- [ ] Test admin locally: `npm run dev /admin`, verify all sections
- [ ] Check colors, typography, button states

- [ ] **Commit**

```bash
git commit -m "refactor: migrate admin to contigo-tokens

- Replace 30+ hardcoded admin colors with token vars
- Functional test: login, navigate all admin pages
- Verify form states, hover effects, focus states"
```

---

### Task 4.3: Audit Remaining Hardcoded Colors

**Files:**
- All `*.tsx`, `*.css`

- [ ] Run grep for remaining hex colors:

```bash
grep -r '#[0-9A-Fa-f]\{6\}' src --include="*.tsx" --include="*.css" | \
  grep -v node_modules | \
  grep -v '.next' | \
  wc -l
```

Expected: < 5 instances (acceptable: GSAP animations, vendor code, etc.)

- [ ] Document exceptions and commit

- [ ] **Commit**

```bash
git commit -m "refactor: audit and document remaining hardcoded colors

- Grep audit: X instances remaining (acceptable: GSAP tweens, vendor code)
- All UI component colors now use --contigo-* tokens"
```

---

## Phase 5: Cleanup & Documentation (2–3 days)

### Task 5.1: Delete Dead Code

**Files to Delete:**
- `src/presentation/components/ui/` (replaced by atoms/)
- `src/sections/` (legacy)
- `src/components/` (legacy)
- `src/index.css`
- `src/App.tsx`
- `app/globals.css.backup.v1`

- [ ] Verify zero imports:

```bash
grep -r "from.*src/sections" src --include="*.tsx" | wc -l
grep -r "from.*src/components" src --include="*.tsx" | wc -l
```

Expected: 0

- [ ] Delete files
- [ ] Run `npm run build`

- [ ] **Commit**

```bash
git commit -m "refactor: delete dead code (duplicate ui/, legacy sections/, App.tsx)

- Verified zero imports of deleted files
- Build succeeds
- No functional changes"
```

---

### Task 5.2: Create Composition Rules

**Files:**
- Create: `src/presentation/design-system/COMPOSITION_RULES.md`

Document:
1. Atoms never depend on atoms
2. Molecules compose 2–5 atoms
3. Organisms compose molecules + atoms
4. Never skip a layer (no raw HTML in components)
5. All styling uses tokens
6. Import paths (atoms, molecules, organisms)
7. Testing patterns

- [ ] **Commit**

```bash
git commit -m "docs: add composition rules for atomic design discipline

- Rules for atoms/molecules/organisms
- Import path conventions
- Testing patterns
- Examples of correct/incorrect composition"
```

---

### Task 5.3: Update Main Documentation

**Files:**
- Update: `src/presentation/design-system/README.md`

Add:
- Migration checklist (✅ tokens, ✅ atoms, ✅ organisms, ✅ migration)
- Component inventory
- Common recipes (add page, add component variant, etc.)

- [ ] **Commit**

```bash
git commit -m "docs: update design-system README with final status and recipes"
```

---

### Task 5.4: Create CHANGELOG

**Files:**
- Create: `src/presentation/design-system/CHANGELOG.md`

Document v1.0:
- ✅ Consolidated tokens
- ✅ Atomic design implemented
- ✅ Deprecated themes eliminated
- ✅ Front page and admin migrated
- Breaking changes
- Upgrade path

- [ ] **Commit**

```bash
git commit -m "docs: add CHANGELOG for contigo-design-system v1.0"
```

---

## Phase 6: Testing & Verification (1–2 days)

### Task 6.1: Visual Regression Testing

- [ ] Screenshot public pages: Hero, Services, Heritage, Projects, Contact, Footer
- [ ] Compare with previous version
- [ ] Document acceptable differences
- [ ] Commit: `"test: visual regression testing — contigo-design-system v1.0"`

### Task 6.2: Admin Dashboard Testing

- [ ] Login to admin
- [ ] Test: Dashboard, Projects, Services, Categories, Media, Leads, Settings
- [ ] Verify buttons, forms, colors, typography
- [ ] Commit: `"test: functional testing of admin dashboard"`

---

## Success Criteria

- ✅ All hardcoded colors → `var(--contigo-*)` tokens
- ✅ Deprecated aliases removed from new code
- ✅ Front page + admin visually identical or improved
- ✅ Atomic design enforced (atoms → molecules → organisms)
- ✅ Zero dead code
- ✅ Documentation complete
- ✅ Team can add components following pattern in 15 minutes

---

## Execution Options

**Which approach?**

1. **Subagent-Driven (Recommended)** - Fresh subagent per phase + reviews
2. **Inline Execution (This Session)** - Execute tasks sequentially with checkpoints
