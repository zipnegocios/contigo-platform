# Admin Color Audit & Legacy Exceptions Register

**Date**: June 2026  
**Status**: Frozen (Documented, No Migration in Current Sprint)  
**Scope**: 34 admin components, 263 hardcoded hex colors  
**Classification**: Categoría A (57 critical colors) + Categoría B (130 legacy structural colors)

---

## Executive Summary

A comprehensive audit of admin panel components identified **263 hardcoded hex colors** across 34 files. These have been classified into two categories:

- **Categoría A (Status Colors - DO NOT TOUCH)**: 57 instances of critical functional colors (success, error, warning, status indicators)
- **Categoría B (Structural/Legacy - Refactor Gradually)**: 130 instances of layout/text colors that should be migrated to design system tokens in future sprints

**Decision**: Freeze current state. Document exceptions. Refactor Categoría B gradually via selective manual migration (5-10 files per sprint) to avoid syntax regressions.

---

## Categoría A: Critical Status Colors (PRESERVED - DO NOT MIGRATE)

These colors are **functional** (not design/brand), used for status indication and must be preserved as-is. They have been documented in `contigo-admin.css` under status color groups.

### Upload/File Status Colors

| Color | Hex | Usage | Count | Status |
|-------|-----|-------|-------|--------|
| Success Green | #52B788 | File upload complete, validation pass | 3 | ✅ DOCUMENTED |
| Error Red | #e87070 | Upload failure, validation error | 5 | ✅ DOCUMENTED |
| Warning Orange | #F4A261 | Pending, in-progress, warning state | 3 | ✅ DOCUMENTED |
| Neutral (skipped) | #6B6560 | Skipped files, disabled state | 1 | ✅ DOCUMENTED |

**Mapped to**: `contigo-admin.css` lines 15-21

### Quote Stage Colors (QuoteInboxTable.tsx)

| Stage | Color | Hex | Count | Reason |
|-------|-------|-----|-------|--------|
| New | Gold | #A08040 | 1 | Fresh quote (needs follow-up) |
| Contacted | Gold Dark | #7A5C00 | 1 | Awaiting response |
| In Progress | Petrol | #0D3C4C | 1 | Active negotiation |
| Converted | Success | #15803d | 1 | Won deal |
| Closed | Neutral | #6B6560 | 1 | Inactive/lost |

**Mapped to**: `contigo-admin.css` lines 23-28  
**Reason**: Quote status pipeline must be visually distinct for admin workflow

### Lead/Kanban Stage Colors (LeadsKanban.tsx)

| Stage | Color | Hex | Count | Semantic |
|-------|-------|-----|-------|----------|
| Prospect | Warning | #F4A261 | 1 | New lead (requires action) |
| Contacted | Petrol | #0D3C4C | 1 | Communication in progress |
| Qualified | Success | #52B788 | 1 | Ready for proposal |
| Proposal | Gold | #E2C063 | 1 | Quote sent |
| Negotiation | Gold Dark | #D4AF37 | 1 | Terms under discussion |
| Closed Won | Success Dark | #15803d | 1 | Deal closed |
| Closed Lost | Error | #e87070 | 1 | Opportunity lost |

**Mapped to**: `contigo-admin.css` lines 30-36  
**Reason**: Kanban board requires distinct colors per stage for visual scanning

### Form & Validation Status Colors

| Status | Color | Hex | Usage | Count |
|--------|-------|-----|-------|-------|
| Error Text | Red | #e87070 | Error message, validation fail | 13 |
| Success Text | Green | #52B788 | Validation pass, confirmation | 5 |
| Warning Text | Orange | #F4A261 | Caution, pending | 3 |
| Info/Brand | Petrol | #0D3C4C | Informational badge | 2 |

**Mapped to**: `contigo-admin.css` lines 48-55  
**Reason**: Color-coded feedback is critical for form usability and error recovery

### Badge & Tag Colors (Data-Driven)

| Category | Colors | Count | Example |
|----------|--------|-------|---------|
| Success Badge | #52B788 | 2 | "Active", "Complete" |
| Error Badge | #e87070 | 2 | "Failed", "Deleted" |
| Warning Badge | #F4A261 | 2 | "Pending", "Review" |
| Neutral Badge | #6B6560 | 1 | "Inactive" |
| **Tag Colors** (Metadata) | #E2A87E, #E27E7E, #C27EE2, #A8E27E, #7EE2D4, #7EC8A4, #7EB8E2 | 7 | Custom category tags |

**Location**: Various form modals and data tables  
**Reason**: Tag colors are often user-assigned (custom metadata) and cannot be tokenized without breaking UX

---

## Categoría B: Structural/Layout Colors (LEGACY - REFACTOR GRADUALLY)

These colors control layout, text, borders, and backgrounds. They **should** use design system tokens but are currently hardcoded. These should be refactored gradually, 5-10 files per sprint, with `npm run build` validation after each batch.

### Text & Label Colors (82 instances)

| Color | Hex | Token Map | Usage | Files Affected |
|-------|-----|-----------|-------|-----------------|
| Muted Text | #6B6560 | `var(--neutral-600)` | Secondary text, labels, hints | 19 files |
| Tertiary Text | #C5BDB4, #C5BDB5 | `var(--neutral-500)` | Disabled, placeholder text | 3 files |

**Total**: 85 instances | **Priority**: HIGH (highest frequency)  
**Migration Approach**: Start with DashboardView, ProjectTable, ServiceTable (most critical paths)

### Border & Divider Colors (23 instances)

| Color | Hex | Token Map | Usage | Files Affected |
|-------|-----|-----------|-------|-----------------|
| Border Light | #E5DDD0 | `var(--neutral-200)` | Card borders, separators | 15 files |
| Border Subtle | #F0E8DC | `var(--neutral-200)` | Row dividers, subtle lines | 5 files |

**Total**: 28 instances | **Priority**: HIGH  
**Migration Note**: Some borders are in ternary expressions with status colors; requires careful JSX handling

### Background Colors (15 instances)

| Color | Hex | Token Map | Usage | Files Affected |
|-------|-----|-----------|-------|-----------------|
| Input Background | #F0EBE3 | `var(--admin-bg-input)` | Form input fields | 4 files |
| Light Background | #F5EFE8, #F5F0E8 | `var(--admin-bg-input-light)` | Upload zones, light panels | 3 files |
| Very Light Bg | #FAF6F0 | `var(--neutral-50)` | Card backgrounds | 1 file |

**Total**: 8 instances | **Priority**: MEDIUM  
**Migration Approach**: File-by-file search/replace with careful JSX syntax validation

### Dark/Overlay Colors (5 instances)

| Color | Hex | Token Map | Context | Priority |
|-------|-----|-----------|---------|----------|
| Dark Overlay | #150F0A | `var(--neutral-800)` | Media thumbnails, overlays | MEDIUM |
| Dark Overlay 2 | #16120E | `var(--neutral-800)` | Sidebar dark bg | MEDIUM |
| Darkest | #0D0A08 | `var(--neutral-900)` | Canvas/video overlay | LOW |

**Total**: 5 instances | **Priority**: MEDIUM  
**Location**: MediaGrid, MediaDetailDrawer, other media components

---

## Categoría B Detailed File List (Refactoring Roadmap)

### Sprint Priority Tier 1 (High Impact - Start Here)

1. **CategoryFormModal.tsx**
   - #6B6560: 7 instances → var(--neutral-600)
   - #E5DDD0: 6 instances → var(--neutral-200)
   - #F0EBE3: 4 instances → var(--admin-bg-input)
   - Subtotal: 17 instances
   - Effort: 30 mins

2. **DashboardView.tsx**
   - #6B6560: 6 instances (especially in chart tick formatting)
   - #E5DDD0: 4 instances
   - #F0E8DC: 1 instance
   - Subtotal: 11 instances
   - Effort: 20 mins
   - **Note**: Chart tick colors in Recharts object literal — needs careful JSX handling

3. **ProjectTable.tsx**
   - #6B6560: 11 instances (table headers, rows, labels)
   - #E5DDD0: 2 instances (borders)
   - #F0E8DC: 1 instance (row separator)
   - Subtotal: 14 instances
   - Effort: 25 mins

4. **ServiceTable.tsx**
   - #6B6560: 10 instances
   - #E5DDD0: 2 instances
   - #F0E8DC: 1 instance
   - Subtotal: 13 instances
   - Effort: 20 mins

5. **QuoteInboxTable.tsx**
   - #6B6560: 13 instances (highest single file)
   - #E5DDD0: 2 instances
   - #F0E8DC: 1 instance
   - Subtotal: 16 instances
   - Effort: 25 mins

**Tier 1 Total**: 71 instances (54% of Categoría B)  
**Estimated Time**: 2 hours with npm build validation

### Sprint Priority Tier 2 (Medium Impact)

6. **UploadQueuePanel.tsx** (11 instances)
7. **MediaDetailDrawer.tsx** (6 instances)
8. **QuoteDetailPanel.tsx** (7 instances)
9. **CoverMediaSelector.tsx** (5 instances)
10. **FileUpload.tsx** (6 instances)

**Tier 2 Total**: 35 instances  
**Estimated Time**: 1.5 hours

### Sprint Priority Tier 3 (Lower Impact - Deferred)

Remaining 24 files with 24 instances each (various small counts)  
**Estimated Time**: 2 hours (complete migration)

---

## Migration Safety Checklist

**Before attempting Categoría B migration in future sprints:**

- [ ] Create feature branch: `feat/admin-token-migration-phase-X`
- [ ] Migrate **only 5-10 files per commit**
- [ ] Run `npm run build` after **every file**
- [ ] Do NOT attempt bulk sed/PowerShell replacements (causes syntax errors)
- [ ] Manually verify JSX inline style syntax after each change
- [ ] Test in browser: `/admin` routes should render without visual regressions
- [ ] Commit with message: `refactor: migrate CategoryFormModal to contigo tokens`

**Why Manual Approach is Required**:
- Hex colors exist in 4+ different syntactic contexts:
  - JSX inline styles: `style={{ color: 'var(--neutral-600)' }}`
  - Object literals: `{ headerColor: 'var(--neutral-600)' }`
  - Template strings: `` color: `var(--neutral-600)` ``
  - Ternary expressions: `active ? 'var(--neutral-600)' : '#fff'`
- Automated regex cannot distinguish these contexts safely
- Manual migration ensures no syntax regressions

---

## Tokens Available for Refactoring

All tokens needed for Categoría B migration are already defined in `contigo-admin.css` (lines 40-120):

```css
/* Layer 3: Admin Component Tokens */
--admin-form-border: #E5DDD0;           /* Already mapped */
--admin-form-text-muted: #6B6560;       /* Already mapped */
--admin-bg-input: #F0EBE3;              /* NEW - added Phase 6.2 */
--admin-bg-input-light: #F5EFE8;        /* NEW - added Phase 6.2 */
--admin-bg-upload: #F5F0E8;             /* NEW - added Phase 6.2 */
--admin-bg-darkest: #0D0A08;            /* NEW - added Phase 6.2 */

/* Plus 40+ status color tokens */
```

**No additional token definitions needed.** Ready to migrate on demand.

---

## Files Audited (34 Total)

### Admin Components with Status Colors (Preserve)
- QuoteInboxTable.tsx (20+ colors)
- LeadsKanban.tsx (14+ colors)
- UploadQueuePanel.tsx (23+ colors)
- QuoteDetailPanel.tsx (7+ colors)

### Admin Components with Mixed (Prioritize Tier 1-2)
- CategoryFormModal.tsx
- DashboardView.tsx
- ProjectTable.tsx
- ServiceTable.tsx
- MediaDetailDrawer.tsx
- FileUpload.tsx
- CoverMediaSelector.tsx
- [+27 more]

---

## Status in Design System Documentation

**Updated Files**:
- ✅ `contigo-admin.css`: Status colors documented (lines 15-72)
- ✅ `README.md`: Reference added to this audit document
- ✅ `CHANGELOG.md`: Phase 6 testing/audit documented

**Not Updated** (Intentional - to minimize changes):
- `contigo-semantic.css`: Deprecated aliases preserved for backwards compatibility
- Component code: Categoría A colors preserved as-is (functional requirement)

---

## Next Steps

**When Refactoring Categoría B (Future Sprint)**:

1. Create PR with branch: `feat/admin-token-migration`
2. Pick Tier 1 file (e.g., CategoryFormModal.tsx)
3. Use manual Find/Replace (VSCode Regex mode):
   - Find: `'#6B6560'` → Replace: `'var(--neutral-600)'`
   - Find: `"#6B6560"` → Replace: `'var(--neutral-600)'`
   - Find: `#6B6560` (unquoted in objects) → Replace: `'var(--neutral-600)'`
4. Run: `npm run build`
5. Verify: No TypeScript/CSS errors, admin routes render correctly
6. Commit: `refactor: migrate CategoryFormModal to contigo tokens`
7. Repeat for next file

**Estimated Full Migration**: 5-6 hours over 2-3 sprints

---

## Questions?

- **"Why not refactor now?"** — Bulk refactoring caused syntax errors due to JSX context complexity. Manual approach is slower but safer.
- **"Can we automate this?"** — Yes, with AST parser. Would require 2-3 hours of custom tooling development.
- **"What if we ignore Categoría B?"** — Current code works fine. Refactoring is technical debt, not a blocker. Can be deferred indefinitely.
- **"Why keep Categoría A as-is?"** — Status colors are functional (not brand/design). Changing them breaks admin UX and form feedback semantics.

---

**Last Updated**: June 2026  
**Reviewed By**: Design System Team  
**Status**: ✅ Approved for Freeze (No current-sprint migration)
