# Repository Cleanup (Fase 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the confirmed-dead code, dead npm dependencies, stray local artifacts, and documentation drift identified in `AUDIT_REPORT_2026-06-24.md`, without touching anything that requires architectural decisions (no DB schema changes, no use-case refactors, no Navigation/SimpleHeader consolidation — those are separate, higher-risk plans).

**Architecture:** This is a deletion/hygiene pass, not a feature build. Every target was independently re-verified by grep immediately before writing this plan (not just taken from the earlier audit sub-agent reports) to confirm zero remaining references. There is no test suite in this repo (`AUDIT_REPORT_2026-06-24.md` §16: 0 test files), so the verification step for every task is `npm run lint` (fast, per-task) plus a single full `npm run build` at the end (slow, integration-level — run once, not per task).

**Tech Stack:** Next.js 15 / React 19 / TypeScript, npm.

## Global Constraints

- The working tree has pre-existing, unrelated uncommitted changes (marketing/about pages, IconLogo, Navigation, VoiceSearchNav, HeritageSection→BrandPromiseSection rename). **Never use `git add -A` or `git add .`** in any step of this plan — always `git add` exact paths, so those unrelated in-flight edits are not swept into a cleanup commit.
- Every deletion task must re-run its "confirm zero references" grep immediately before deleting (not trust this plan blindly) — the codebase may have changed since this plan was written.
- Commit after every task. Small, reviewable, revertable commits.
- Do not run `npm audit fix` or upgrade any package version as part of this plan — only remove packages, never bump them (that's separate, higher-risk work per the audit's Fase 3/5 roadmap).

---

### Task 1: Remove dead marketing-section components (ParticleScene, ServicesIndex, serviceMeta)

**Files:**
- Delete: `src/presentation/components/ParticleScene.tsx` (480 lines — dead Three.js/R3F hero; `HeroSection` actually renders a static image + GSAP Ken Burns effect)
- Delete: `src/presentation/sections/ServicesIndex.tsx` (226 lines — superseded by `src/presentation/components/ServicesGrid.tsx`, which is what `app/(portfolio)/services/page.tsx` actually renders)
- Delete: `src/presentation/data/serviceMeta.ts` (152 lines — sole consumer was `ServicesIndex.tsx`)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: after this task, `three`, `@react-three/fiber`, `@types/three` have zero remaining importers anywhere in `app/` or `src/` — Task 4 relies on this being true before uninstalling those packages.

- [ ] **Step 1: Re-confirm zero references before deleting**

Run:
```bash
grep -rln "ParticleScene" app src --include="*.tsx" --include="*.ts" | grep -v "ParticleScene.tsx"
grep -rln "ServicesIndex" app src --include="*.tsx" --include="*.ts" | grep -v "ServicesIndex.tsx"
grep -rln "serviceMeta" app src --include="*.tsx" --include="*.ts" | grep -v "ServicesIndex.tsx\|serviceMeta.ts"
```
Expected: all three commands produce empty output. If any produces a path, STOP — that file gained a consumer since the audit and must not be deleted.

- [ ] **Step 2: Delete the three files**

```bash
git rm src/presentation/components/ParticleScene.tsx
git rm src/presentation/sections/ServicesIndex.tsx
git rm src/presentation/data/serviceMeta.ts
```

- [ ] **Step 3: Verify lint and typecheck still pass**

Run: `npm run lint`
Expected: exits 0, no new errors referencing the deleted files (e.g. no "Cannot find module" anywhere).

- [ ] **Step 4: Commit**

```bash
git add -u src/presentation/components/ParticleScene.tsx src/presentation/sections/ServicesIndex.tsx src/presentation/data/serviceMeta.ts
git commit -m "chore: remove dead ParticleScene/ServicesIndex/serviceMeta (zero importers)"
```

---

### Task 2: Remove dead admin media/category components

**Files:**
- Delete: `src/presentation/components/admin/MediaDetailsModal.tsx` (265 lines — superseded by `MediaDetailDrawer.tsx`)
- Delete: `src/presentation/components/admin/GalleryUpload.tsx` (174 lines — superseded by `GalleryManagerModal.tsx`)
- Delete: `src/presentation/components/admin/CategoryTable.tsx` (189 lines — superseded by `CategoryTreeView.tsx`)
- Delete: `src/presentation/components/admin/NewCategoryForm.tsx` (84 lines — superseded by `CategoryFormModal.tsx`)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Re-confirm zero references before deleting**

Run:
```bash
grep -rln "MediaDetailsModal" app src --include="*.tsx" --include="*.ts" | grep -v "MediaDetailsModal.tsx"
grep -rln "GalleryUpload" app src --include="*.tsx" --include="*.ts" | grep -v "GalleryUpload.tsx"
grep -rln "CategoryTable" app src --include="*.tsx" --include="*.ts" | grep -v "CategoryTable.tsx"
grep -rln "NewCategoryForm" app src --include="*.tsx" --include="*.ts" | grep -v "NewCategoryForm.tsx"
```
Expected: all four commands produce empty output.

- [ ] **Step 2: Delete the four files**

```bash
git rm src/presentation/components/admin/MediaDetailsModal.tsx
git rm src/presentation/components/admin/GalleryUpload.tsx
git rm src/presentation/components/admin/CategoryTable.tsx
git rm src/presentation/components/admin/NewCategoryForm.tsx
```

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add -u src/presentation/components/admin/MediaDetailsModal.tsx src/presentation/components/admin/GalleryUpload.tsx src/presentation/components/admin/CategoryTable.tsx src/presentation/components/admin/NewCategoryForm.tsx
git commit -m "chore: remove dead admin Media/Category components superseded by Drawer/Modal/TreeView versions"
```

---

### Task 3: Remove dead hook duplicates (keep the live copy of each)

**Files:**
- Delete: `src/hooks/useScrollReveal.ts` (59 lines — zero importers; the live version with 4 importers is `src/presentation/hooks/useScrollReveal.ts`, confirmed imported by `src/presentation/sections/AboutClosingCTA.tsx`, `CoreValuesSection.tsx`, `MissionVisionSection.tsx`, `ValuePropositionBand.tsx` via `'@/presentation/hooks/useScrollReveal'`)
- Delete: `src/presentation/hooks/use-mobile.ts` (19 lines — zero importers; byte-identical to `src/hooks/use-mobile.ts`, which IS imported by `src/presentation/components/ui/sidebar.tsx:8` via `'@/hooks/use-mobile'`)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing later tasks depend on. Note this is the inverse of what CLAUDE.md currently implies (it frames `src/hooks/` as the legacy one to avoid) — Task 7 corrects that text.

- [ ] **Step 1: Re-confirm zero references before deleting**

Run:
```bash
grep -rn "from ['\"]@/hooks/useScrollReveal['\"]" app src --include="*.tsx" --include="*.ts"
grep -rn "from ['\"]@/presentation/hooks/use-mobile['\"]" app src --include="*.tsx" --include="*.ts"
```
Expected: both commands produce empty output.

- [ ] **Step 2: Delete the two files**

```bash
git rm src/hooks/useScrollReveal.ts
git rm src/presentation/hooks/use-mobile.ts
```

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add -u src/hooks/useScrollReveal.ts src/presentation/hooks/use-mobile.ts
git commit -m "chore: remove dead duplicate hooks (keep the actually-imported copy of each)"
```

---

### Task 4: Remove unused npm dependencies

**Files:**
- Modify: `package.json` (via `npm uninstall`, not manual edit)
- Modify: `package-lock.json` (regenerated automatically by `npm uninstall`)

**Interfaces:**
- Consumes: Task 1 must be complete first — `three`, `@react-three/fiber`, `@types/three` are only safe to uninstall once `ParticleScene.tsx` (their sole consumer) is deleted.
- Produces: nothing later tasks depend on.

Packages being removed and why (each independently re-verified zero-import in this planning session, not just from the earlier audit pass):
| Package | Why dead |
|---|---|
| `@auth/core` | Zero imports anywhere; not a required peer of `next-auth@5.0.0-beta.31` |
| `@react-three/drei` | Zero imports anywhere (project used raw `@react-three/fiber` + `three` only, and that usage is now deleted) |
| `@react-three/fiber` | Sole consumer was `ParticleScene.tsx`, deleted in Task 1 |
| `three` | Same as above |
| `@types/three` | Same as above |
| `current-device` | Zero imports anywhere |
| `date-fns` | Zero imports anywhere |
| `pgvector` | Zero imports anywhere (this is the npm package; the Postgres *extension* of the same name is a separate, unrelated concept handled in `scripts/setup-pgvector.ts`, not touched by this task) |
| `tw-animate-css` (devDependency) | Zero references in any CSS/JS/TS file; `tailwind.config.js` wires up `tailwindcss-animate` instead, which stays |
| `eslint-plugin-react-refresh` (devDependency) | Zero references in `eslint.config.js`'s plugin list; Vite/CRA Fast-Refresh lint plugin, meaningless in Next.js |

- [ ] **Step 1: Re-confirm zero references before uninstalling**

Run:
```bash
grep -rln "from ['\"]@auth/core['\"]\|from ['\"]@react-three/drei['\"]\|from ['\"]@react-three/fiber['\"]\|from ['\"]three['\"]\|from ['\"]current-device['\"]\|from ['\"]date-fns['\"]\|from ['\"]pgvector['\"]" app src
```
Expected: empty output.

- [ ] **Step 2: Uninstall the packages**

```bash
npm uninstall @auth/core @react-three/drei @react-three/fiber three @types/three current-device date-fns pgvector tw-animate-css eslint-plugin-react-refresh
```
Expected: npm reports 10 packages removed, exits 0.

- [ ] **Step 3: Full build verification**

Run: `npm run build`
Expected: build completes successfully with no module-resolution errors (this is the comprehensive check for this whole plan — if anything in Tasks 1-4 broke a real reference, it surfaces here).

- [ ] **Step 4: Commit**

```bash
git add -u package.json package-lock.json
git commit -m "chore: remove 10 unused npm dependencies (dead Three.js stack + 6 unrelated unused packages)"
```

---

### Task 5: Clean local-only disk artifacts (no git impact)

**Files:**
- Delete (disk only, not tracked by git): `dist/` (root) — leftover Vite production build from the pre-Next.js prototype; confirmed gitignored and `git ls-files dist` returns 0 tracked files.
- Delete (disk only, not tracked by git): `src/pages/` — empty stray directory; confirmed `git ls-files src/pages/` returns 0 tracked files.

**Interfaces:**
- Consumes: nothing. Independent of all other tasks.
- Produces: nothing. No commit needed — these paths are not in git.

- [ ] **Step 1: Confirm neither path is tracked before deleting**

Run:
```bash
git ls-files dist
git ls-files src/pages
```
Expected: both commands produce empty output (confirming `rm -rf` here cannot delete anything git-tracked).

- [ ] **Step 2: Remove the local artifacts**

```bash
rm -rf dist
rm -rf src/pages
```

- [ ] **Step 3: Confirm git status is unaffected**

Run: `git status --porcelain -- dist src/pages`
Expected: empty output (nothing for git to report, since neither was tracked).

No commit for this task — nothing changed in git's eyes.

---

### Task 6: Redact the real R2 Account ID from `.env.example`

**Files:**
- Modify: `.env.example:32`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Confirm the current value**

Run: `grep -n "R2_ACCOUNT_ID" .env.example`
Expected: `32:R2_ACCOUNT_ID=b279f9d11db642059360260eb7630822`

- [ ] **Step 2: Replace with a placeholder, consistent with the other R2 vars in the same file**

Change line 32 from:
```
R2_ACCOUNT_ID=b279f9d11db642059360260eb7630822
```
to:
```
R2_ACCOUNT_ID=your-r2-account-id
```

- [ ] **Step 3: Verify no other real-looking values remain in the file**

Run: `cat .env.example`
Expected: every value is an obvious placeholder (`your-*`, `re_xxx`, etc.) — visually confirm, no automated check exists for this.

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "fix: redact real R2 account ID from .env.example template"
```

---

### Task 7: Correct CLAUDE.md's legacy-folder claim

**Files:**
- Modify: `CLAUDE.md:66`

**Interfaces:**
- Consumes: Task 3 (this correction describes the post-cleanup state of `src/hooks/`).
- Produces: nothing.

- [ ] **Step 1: Confirm the current text**

Run: `grep -n "legacy remnants" CLAUDE.md`
Expected: `66:The old \`src/sections/\`, \`src/components/\`, \`src/hooks/\` (non-presentation paths) are legacy remnants from the Vite prototype — prefer the \`src/presentation/\` versions.`

- [ ] **Step 2: Replace the line**

Change line 66 from:
```
The old `src/sections/`, `src/components/`, `src/hooks/` (non-presentation paths) are legacy remnants from the Vite prototype — prefer the `src/presentation/` versions.
```
to:
```
`src/sections/` and `src/components/` (Vite-era paths) have already been removed. `src/hooks/use-mobile.ts` is the live, actively-imported hook (used by `components/ui/sidebar.tsx`) despite living outside `src/presentation/` — do not treat it as legacy. `src/lib/` and `src/types/` are core domain utilities/types used throughout `src/core`, `src/infrastructure`, `app/api`, and `src/presentation` — they are not legacy remnants either.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: correct CLAUDE.md legacy-folder claim (src/lib, src/types, src/hooks/use-mobile.ts are live, not legacy)"
```

---

### Task 8: Commit the already-staged corrupted-filename artifact removal

**Context:** During plan verification, the tracked file with the corrupted name `c\357\200\272devcontigo-platformmiddleware.ts` (a mangled, garbage-byte version of the Windows path `c:\dev\contigo-platform\middleware.ts`, introduced by a past tool mishap in commit `e088514`) was confirmed already deleted from the working tree (pre-existing, visible in `git status` since before this plan started) and has now been staged for deletion using a NUL-safe match (its name contains an unprintable Unicode Private Use Area byte that cannot be typed literally in a shell command):

```bash
git ls-files -z | grep -z -i platformmiddleware | xargs -0 git add
```

This produced `D  "c\357\200\272devcontigo-platformmiddleware.ts"` in `git status --porcelain` (staged for deletion, confirmed harmless — the real `middleware.ts` at the repo root is untouched and still protects `/admin/:path*`).

**Files:**
- Delete (already staged): the corrupted-filename tracked file.

- [ ] **Step 1: Confirm only this one deletion is staged**

Run: `git status --porcelain | grep "^D "`
Expected: exactly one line, the corrupted filename, staged for deletion.

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove corrupted tracked file with mangled Windows-path filename"
```

---

## Self-Review

**Spec coverage:** Every "ELIMINAR" item from `AUDIT_REPORT_2026-06-24.md` §11 that does not require an architectural decision (Project/Service repository interfaces, Navigation/SimpleHeader consolidation, raw-`db` route refactors, DB schema/migration changes) is covered: Tasks 1-3 (dead components/hooks), Task 4 (dead deps), Task 5 (local artifacts), Task 6 (config redaction), Task 7 (docs correction), Task 8 (corrupted file). Items intentionally excluded (consolidation, refactors, DB migrations, rate limiting, credential rotation) belong to later phases of the audit's roadmap (§19 Fase 1/3) or are already being handled directly by the user.

**Placeholder scan:** No TBD/TODO/"add appropriate"/"similar to Task N" patterns — every step has the literal command or literal text to write.

**Type consistency:** N/A — no new functions/interfaces introduced, this plan only deletes and edits text.
