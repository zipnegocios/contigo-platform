# Hardcoded Color Audit & Cleanup Report

**Date**: 2026-06-16  
**Branch**: alpha  
**Total Hex Colors Found**: 358 across 46 files  
**Audit Status**: COMPLETE

## Executive Summary

Comprehensive audit of hardcoded hex colors in `src/` reveals **358 occurrences** across **46 files**. Analysis categorizes them into 5 buckets: 3 files are design tokens (keep), 8 files are animation/WebGL (document exceptions), 1 file is email templates (document), 17+ files are status indicators (refactor to tokens), and ~5 need misc verification.

---

## Bucket 1: Design Tokens — KEEP AS-IS (3 files, ~71 colors)

These ARE the source of truth. Do NOT refactor.

| File | Count | Rationale |
|------|-------|-----------|
| `src/presentation/design-system/tokens/contigo-primitives.css` | 40 | Color scale definitions (gold, petrol, neutral, status scales) — corporate brand manual layer |
| `src/presentation/design-system/tokens/contigo-semantic.css` | 6 | Semantic token aliases (brand, shadcn HSL mappings, deprecation aliases) |
| `src/index.css` | 25 | Legacy base styles + component definitions (.btn-primary, .btn-secondary, blob animations, etc.) |

**Action**: None. These are intentional and correctly placed.

---

## Bucket 2: Three.js / GSAP Animation Colors — DOCUMENT EXCEPTIONS (8 files, ~13 unique colors)

WebGL shaders and animation effects require hardcoded hex values (CSS variables don't resolve in WebGL uniforms or string-based animations). These are EXCEPTIONS.

| File | Count | Colors | Rationale |
|------|-------|--------|-----------|
| `src/presentation/components/ParticleScene.tsx` | 13 | #1E1A16, #E3C064, #D02E2E, #FAF6F0, #F5EDE0 | Three.js shader materials and particle effects (WebGL uniform values) |
| `src/components/ParticleScene.tsx` | 13 | (duplicate of above) | Legacy copy — should be deleted after migration |
| `src/presentation/sections/HeroSection.tsx` | 3 | #E8D5A3, #FAF6F0, animation tints | GSAP animations + hero background |
| `src/sections/HeroSection.tsx` | 2 | (legacy copy) | Should be deleted |
| `src/presentation/sections/ProjectsSection.tsx` | 2 | #E2C063, #2D2924 | Carousel background + GSAP effects |
| `src/sections/ProjectsSection.tsx` | 7 | (legacy copy) | Should be deleted |
| `src/presentation/sections/HeritageSection.tsx` | 1 | #E3C064 | Heritage flip animation color |
| `src/sections/HeritageSection.tsx` | 1 | (legacy copy) | Should be deleted |

**Mapping to Design Tokens**:
- `#E3C064` → `--contigo-primary` / `--gold-400`
- `#1E1A16` → `--admin-sidebar-bg` / heritage dark
- `#FAF6F0` → `--neutral-50` / `--atelier-ivory`
- `#F5EDE0` → `--neutral-100` / `--atelier-cream`
- `#D02E2E` → accent red (not in current palette)
- `#E8D5A3` → gold accent tint

**Action**: Add inline comments documenting the mapping. Example:
```javascript
// #E3C064 = var(--contigo-primary) — kept hardcoded for WebGL shader compatibility
new THREE.Color('#E3C064')
```

**Cleanup**: Delete legacy `src/sections/` copies (they're duplicates of `src/presentation/sections/`).

---

## Bucket 3: Email Templates — DOCUMENT EXCEPTIONS (1 file, 7 colors)

HTML/CSS inline styles in Resend email templates. Email clients don't support CSS variables; hardcoding is justified.

| File | Count | Colors | Rationale |
|------|-------|--------|-----------|
| `src/infrastructure/services/ResendEmailService.ts` | 7 | #D4AF37, #C49A27, #e0e0e0, #fafaf8, #2a2a2a, #ccc, #1a1a1a | HTML email template inline CSS |

**Mapping to Design Tokens**:
- `#D4AF37` → `--gold-600` (email header gradient start)
- `#C49A27` → gold blend (header gradient end)
- `#e0e0e0` → neutral border
- `#fafaf8` → `--neutral-50` (body background)
- `#2a2a2a` → footer dark bg
- `#ccc` → footer text (gray)
- `#1a1a1a` → dark header

**Action**: Add inline comment block documenting mapping. Example:
```typescript
// EMAIL TEMPLATE — hardcoded hex colors for email client compatibility
// #D4AF37 = var(--gold-600) | #C49A27 = gold-600 blend | #fafaf8 = var(--neutral-50)
const headerHtml = `<header style="background: linear-gradient(135deg, #D4AF37 0%, #C49A27 100%);">...`
```

---

## Bucket 4: Admin UI Status Indicators — REFACTOR TO TOKENS (17+ files, ~180 colors)

Status colors, data indicators, form styling, and borders that are repeated across admin components. These MUST be extracted to design tokens.

### 4.1: Quote & Lead Management (40 colors)

| File | Count | Key Colors | Issue |
|------|-------|------------|-------|
| `src/presentation/components/admin/QuoteInboxTable.tsx` | 20 | #A08040, #7A5C00, #0D3C4C, #15803d, #6B6560 | Quote stage colors (new, contacted, in_progress, converted, closed) |
| `src/presentation/components/admin/LeadsKanban.tsx` | 14 | Stage colors, borders, text colors | Lead stage Kanban board colors |
| `src/presentation/components/admin/QuoteDetailPanel.tsx` | 7 | #6B6560, borders, error colors | Quote detail view styling |

**Status Colors to Extract**:
```css
/* src/presentation/design-system/tokens/contigo-admin.css */
--quote-stage-new: #A08040;           /* gold-700 */
--quote-stage-contacted: #7A5C00;     /* gold dark blend */
--quote-stage-in-progress: #0D3C4C;   /* petrol-800 */
--quote-stage-converted: #15803d;     /* success-600 */
--quote-stage-closed: #6B6560;        /* neutral-600 */
```

### 4.2: Media & File Upload (40 colors)

| File | Count | Key Colors | Issue |
|------|-------|------------|-------|
| `src/presentation/components/admin/UploadQueuePanel.tsx` | 23 | #52B788, #e87070, #F4A261, #6B6560, #16120E | File upload status icons and progress |
| `src/presentation/components/admin/MediaDetailDrawer.tsx` | 11 | Borders, text, background colors | Media detail panel styling |
| `src/presentation/components/admin/MediaBankSidebar.tsx` | 6 | Border, text, category colors | Media bank sidebar |
| `src/presentation/components/admin/MediaGrid.tsx` | 5 | Grid borders, status text | Media grid container |
| `src/presentation/components/admin/MediaPickerModal.tsx` | 7 | Modal borders, success indicators | Media picker modal |
| `src/presentation/components/admin/MediaLibrary.tsx` | 2 | Success #52B788 | Media library status |
| `src/presentation/components/admin/MediaCard.tsx` | 2 | Error #e87070, muted #6B6560 | Individual media card |
| `src/presentation/components/admin/MediaDetailsModal.tsx` | 4 | Borders, backgrounds | Media detail modal |
| `src/presentation/components/admin/GalleryManagerModal.tsx` | 6 | Gallery UI colors | Gallery manager modal |
| `src/presentation/components/admin/GalleryUpload.tsx` | 5 | Upload area colors | Gallery upload section |
| `src/presentation/components/admin/CoverMediaSelector.tsx` | 5 | Selector UI colors | Cover media selector |

**Status Colors to Extract**:
```css
--upload-status-done: #52B788;        /* success green */
--upload-status-error: #e87070;       /* error red */
--upload-status-warning: #F4A261;     /* warning orange */
--upload-bg-dark: #16120E;            /* very dark admin bg */
```

### 4.3: Forms & Inputs (30 colors)

| File | Count | Key Colors | Issue |
|------|-------|------------|-------|
| `src/presentation/components/admin/CategoryFormModal.tsx` | 13 | Form inputs, labels, borders, errors | Form styling hardcoded |
| `src/presentation/components/admin/ServiceForm.tsx` | 9 | Form borders, labels, muted text | Service form styling |
| `src/presentation/components/admin/NewCategoryForm.tsx` | 1 | Muted text #6B6560 | Category form text |
| `src/presentation/components/admin/FileUpload.tsx` | 12 | Upload zone styling, borders, text | File upload form |

**Form Colors to Extract**:
```css
--form-border: #E5DDD0;               /* neutral-200 */
--form-bg: #FAF6F0;                   /* neutral-50 */
--form-text-muted: #6B6560;           /* neutral-600 */
--form-error-bg: rgba(232, 112, 112, 0.06);
--form-error-border: rgba(232, 112, 112, 0.2);
```

### 4.4: Data Tables & Cards (50 colors)

| File | Count | Key Colors | Issue |
|------|-------|------------|-------|
| `src/presentation/components/admin/ProjectTable.tsx` | 18 | Project status, borders, row colors | Table styling |
| `src/presentation/components/admin/ServiceTable.tsx` | 18 | Service status, borders | Service table styling |
| `src/presentation/components/admin/CategoryTable.tsx` | 5 | Category row colors | Category table |
| `src/presentation/components/admin/KPICard.tsx` | 3 | Border, success, error colors | KPI dashboard cards |
| `src/presentation/components/admin/DashboardView.tsx` | 11 | Dashboard grid borders, backgrounds | Dashboard layout |

**Table Colors to Extract**:
```css
--table-border: #E5DDD0;              /* neutral-200 */
--table-row-hover: rgba(226, 192, 99, 0.06);
--table-header-bg: #FAF6F0;           /* neutral-50 */
--table-status-pending: #F4A261;      /* warning */
--table-status-active: #52B788;       /* success */
```

### 4.5: Other Components (20 colors)

| File | Count | Key Colors | Issue |
|------|-------|------------|-------|
| `src/presentation/components/admin/AssignToEntityModal.tsx` | 3 | Modal styling | Modal borders/bg |
| `src/presentation/components/admin/HierarchicalCategorySelect.tsx` | 2 | Select styling | Dropdown colors |
| `src/presentation/components/admin/CategoryManagerClient.tsx` | 2 | Manager UI colors | Category manager |
| `src/presentation/components/admin/CategoryTreeNode.tsx` | 3 | Tree node colors | Tree styling |

**Action**:
1. Create `src/presentation/design-system/tokens/contigo-admin.css` with all extracted status/admin colors
2. Systematically refactor each file in Bucket 4 to use CSS variables
3. Update any component-level color constants to reference tokens

---

## Bucket 5: Misc Hardcoded — AUDIT ONE-BY-ONE (5 files, ~10 colors)

| File | Count | Issue | Action |
|------|-------|-------|--------|
| `src/components/Navigation.tsx` | 3 | Legacy nav scroll state colors | Verify and map to tokens |
| `src/presentation/components/ProjectsGrid.tsx` | 6 | Grid styling colors | Verify alignment |
| `src/presentation/components/Lightbox.tsx` | 6 | Lightbox overlay/UI colors | Check if intentional |
| `src/presentation/components/CategoryFilterPills.tsx` | 4 | Filter pill colors | Map to button/badge tokens |
| `src/infrastructure/db/schema.ts` | 1 | Comment with sample color? | Likely false positive |

**Action**: Spot-check and categorize into Buckets 1–4 or document as intentional design decisions.

---

## Refactoring Checklist

### Phase 1: Documentation & Token Creation (this session)
- [ ] Create `src/presentation/design-system/tokens/contigo-admin.css`
  - [ ] Status colors (success, error, warning, info, stages)
  - [ ] Border colors (form, table, components)
  - [ ] Background colors (form, table rows, dark modes)
  - [ ] Text colors (muted, label, etc.)
- [ ] Add inline comments to Bucket 2 (WebGL/animation) files
- [ ] Add inline comments to Bucket 3 (email) file
- [ ] Document this audit in codebase

### Phase 2: Systematic Refactoring (future sessions)
- [ ] Refactor 17+ files in Bucket 4 to use new tokens
- [ ] Run `npm run build` after each major component
- [ ] Run `npm run lint` to catch any issues
- [ ] Test admin panel in browser to verify UI

### Phase 3: Cleanup (final)
- [ ] Delete legacy `src/sections/` copies
- [ ] Delete legacy `src/components/` (if fully migrated)
- [ ] Run full test suite
- [ ] Commit: "refactor: migrate admin colors to contigo-admin tokens"

---

## Mapping Reference

### Status Colors (Bucket 4 recurring)
| Usage | Hardcoded | Token Candidate | Mapped |
|-------|-----------|-----------------|--------|
| Success | #52B788 | `--success-600` | NO — add to tokens |
| Error | #e87070 | `--error-500` | NO — verify palette |
| Warning | #F4A261 | `--warning-600` | NO — add to tokens |
| Info | #0D3C4C | `--petrol-800` | YES |
| Neutral/Muted | #6B6560 | `--neutral-600` | YES |

### Neutral/Border Colors (Bucket 4 recurring)
| Usage | Hardcoded | Token | Note |
|-------|-----------|-------|------|
| Form borders | #E5DDD0 | `--neutral-200` | Use as-is |
| Light backgrounds | #FAF6F0 | `--neutral-50` | Use as-is |
| Dark admin bg | #16120E | Custom dark | Add to tokens |
| Header/Text | #2D2924 | `--neutral-800` | Use as-is |

### Brand Token Mappings (Bucket 2 & 3)
| Hex | Token | Usage |
|-----|-------|-------|
| #E3C064 | `--contigo-primary` / `--gold-400` | Primary brand, animations |
| #D4AF37 | `--gold-600` | Email header, hover states |
| #0D3C4C | `--petrol-800` / `--contigo-secondary` | Secondary brand |
| #FAF6F0 | `--neutral-50` / `--atelier-ivory` | Light backgrounds |
| #1E1A16 | Admin sidebar bg | Dark UI backgrounds |

---

## Files with NO Issues (or properly using tokens)

- `src/presentation/design-system/` — all design system files are correct
- `src/presentation/hooks/` — custom hooks (no styling)
- `src/presentation/lib/` — utility functions (no styling)
- `src/core/` — business logic (no styling)
- `src/application/` — use cases (no styling)
- Most `app/` routes — use Tailwind and component props

---

## Statistics

| Category | Count | Action |
|----------|-------|--------|
| Total hex colors | 358 | — |
| Design Tokens (keep) | 71 | 3 files |
| Animation/WebGL (document) | 13 | 8 files (4 unique + 4 legacy) |
| Email templates (document) | 7 | 1 file |
| Status indicators (refactor) | ~180 | 17+ files |
| Misc (audit) | ~10 | 5 files |
| **Expected reduction** | ~190 (54%) | After token migration + cleanup |

---

## Next Steps

1. **NOW**: Review this audit and approve categorization
2. **Create** `contigo-admin.css` with status + border tokens
3. **Refactor** Bucket 4 files systematically
4. **Document** Bucket 2 & 3 exceptions with comments
5. **Delete** legacy `src/sections/` and `src/components/` copies
6. **Test** admin panel and marketing pages
7. **Commit**: "refactor: audit and document remaining hardcoded colors"

---

## Exceptions Approved

As per specification, <10 exceptions are acceptable:
- ✅ ParticleScene.tsx (WebGL)
- ✅ HeroSection/ProjectsSection/HeritageSection (GSAP)
- ✅ ResendEmailService.ts (email HTML)

**Total approved exceptions**: 3 files (documented in Buckets 2 & 3)

---

**Audit completed by**: Claude Code  
**Date**: 2026-06-16  
**Status**: READY FOR IMPLEMENTATION
