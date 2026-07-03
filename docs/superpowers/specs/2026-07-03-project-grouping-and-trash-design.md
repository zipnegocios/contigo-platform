# Project grouped UI + recoverable Trash (Categories/Services/Projects)

## Problem

Two related gaps in the admin CRUDs built earlier today:

1. `/admin/projects` is a flat table (`ProjectTable.tsx`) with no cover thumbnail and no
   manual ordering — unlike `/admin/services`, which groups items by category, shows a
   thumbnail, and supports drag-and-drop reordering.
2. Deleting a category/service/project is permanent (hard `DELETE FROM`). There's no way
   to recover an accidental delete. The `leads` feature already solved this with a
   `trashedAt` timestamp column + restore flow — we reuse that exact pattern here.

## Scope

In scope:
- Rebuild `/admin/projects` to match `/admin/services`'s grouped-by-category layout,
  with cover thumbnails and drag-and-drop reordering (requires a new `orderIndex` column
  on `projects`, which doesn't have one today).
- The new `orderIndex` also becomes the sort order for the public `/projects` page
  (replacing today's `desc(createdAt)`).
- Soft-delete (`trashedAt` timestamp) + restore for `categories`, `services`, and
  `projects`, mirroring `leads.trashedAt`. A "View Trash" link on each admin list page
  leads to a `?trash=1` view (same query-param convention as `/admin/leads`) with a
  dedicated, minimal trash table per entity (name/thumbnail + Restore button).
- Small adjacent fix: services (and now projects) with `categoryId = null` are currently
  silently dropped from the grouped view (confirmed: 5 of 30 services in production
  have `categoryId = null` today). Both grouped views gain an "Uncategorized" bucket.

Out of scope:
- No "empty trash" / permanent-delete-forever UI. Trash is recoverable-only for now.
- No bulk restore, no trash retention/auto-purge policy.
- `ProjectTable.tsx` is deleted (fully superseded by the new grouped view), not kept
  around as a fallback.

## Data model

Additive-only migration (no backfill needed — new columns default to `NULL`/`0`, no
existing column changes, no 2-phase add/drop required this time):

```ts
// categories, services, projects — all gain:
trashedAt: timestamp('trashed_at', { withTimezone: true }), // nullable, no default

// projects only:
orderIndex: integer('order_index').notNull().default(0),
```

Indexes: `idx_categories_trashed_at`, `idx_services_trashed_at`,
`idx_projects_trashed_at` (mirrors `idx_leads_trashed_at`), `idx_projects_order`
(mirrors `idx_services_order`).

## Backend

- Every listing method (`findAll`, `findFlat`, `findPublished`, `findFeatured`) on all
  three repositories adds an unconditional `trashedAt IS NULL` filter — trashed rows
  never appear in any normal listing, admin or public.
- New `findTrashed()` on each repository — returns only `trashedAt IS NOT NULL` rows,
  for the trash view.
- New `trash(id)` / `restore(id)` methods on each repository — set/clear `trashedAt`.
- `DELETE /api/admin/{categories,services,projects}/[id]` switch from `repo.delete(id)`
  to `repo.trash(id)`. The existing `isSystem` guard on categories is unchanged (system
  categories still can't be trashed, same as they can't be deleted today).
- New `POST /api/admin/{categories,services,projects}/[id]/restore`.
- New `PATCH /api/admin/projects` (bulk `{ updates: [{ id, orderIndex }] }`), mirroring
  the existing `PATCH /api/admin/services`.
- `findById`/`findBySlug` (single-item lookups) stay unfiltered by `trashedAt` — public
  detail pages (`services/[category]/[item]`, `services/[category]`,
  `projects/[slug]`) add an explicit `|| x.trashedAt` check alongside their existing
  `status !== 'active'` check, so a trashed item 404s even if its `status` was left as
  `'active'` at the moment it was trashed.

## Projects: grouped UI (mirrors Services)

- New `ProjectGroupedView.tsx`, structurally identical to `ServiceGroupedView.tsx`:
  sections per category (+ "Uncategorized" bucket), native HTML5 drag-and-drop reorder
  within a section, cover thumbnail (`coverImageUrl`), `StatusMenu`, "Featured" badge,
  Edit link, trash button. No "builder" button (projects have no page builder).
- `/admin/projects/page.tsx` changes from building a flat array for `ProjectTable` to
  building `ProjectGroup[]` (mirrors how `/admin/services/page.tsx` builds
  `ServiceGroup[]`), including the "Uncategorized" bucket for `categoryId === null`.
- `/admin/services/page.tsx` gets the same "Uncategorized" bucket fix.
- `ProjectTable.tsx` is deleted.

## Trash views + navigation

- Each of the three admin list pages gets a "View Trash" link in its header, linking to
  the same route with `?trash=1` (e.g. `/admin/projects?trash=1`) — same convention as
  `/admin/leads`.
- Three new small, dedicated components (not one generic component — the relevant
  columns differ per entity): `CategoriesTrashView.tsx`, `ServicesTrashView.tsx`,
  `ProjectsTrashView.tsx`. Each is a simple table (mirrors `LeadsTrashView.tsx`):
  name/title (+ thumbnail for services/projects) + a "Restore" button that calls the
  new restore endpoint and does `router.refresh()`.

## Rollout

Single additive migration applied to production via `npm run db:migrate`. Update all
code. Verify with `npx tsc --noEmit && npm run lint && npm run build`. No `git commit`.
No Chrome DevTools MCP browser testing.
