# Service & Project status CRUD (mirrors Category status CRUD)

## Problem

`services` and `projects` each have a single `published: boolean` column. The admin UI
exposes it as a binary Active/Draft toggle (Services) or a read-only pill with no way to
change it without opening the edit form (Projects). Following the Category status work
(see `2026-07-03-category-status-crud-design.md`), we want the same 3-state model
(`draft` | `active` | `inactive`) and matching UI for both entities.

## Scope

In scope:
- Replace `services.published` and `projects.published` with a 3-state `status` column
  each (`draft` | `active` | `inactive`).
- Add a status-change control (not just view) to every admin list/form/builder that
  touches these fields.
- Extract the status badge + dropdown into a shared component (`StatusMenu`) and a
  shared `ContentStatus` type, since this is now the 3rd entity (after Category) using
  the identical pattern — copy-pasting a 3rd time would be a real duplication smell.
- Retrofit `CategoryManagerClient.tsx` to use the shared `StatusMenu` instead of its
  inline dropdown (behavior-identical, just deduplicated).

Out of scope:
- No new public-facing behavior. `status === 'active'` is a drop-in replacement for
  `published === true` everywhere — draft and inactive both behave exactly like
  `published === false` does today (hidden from `findPublished()`/`findFeatured()`,
  hard 404 on direct detail pages). This is a rename, not a behavior change.
- The de-hardcoding of `SERVICE_ROOT_SLUGS` (deferred from the Category project) is
  still deferred and untouched here.

## Data model

Two new Postgres enums (kept separate from `category_status`, which is already live in
production — no reason to migrate that one to a shared type):

```ts
export const serviceStatusEnum = pgEnum('service_status', ['draft', 'active', 'inactive'])
export const projectStatusEnum = pgEnum('project_status', ['draft', 'active', 'inactive'])
```

`projectStatusEnum` already exists in `schema.ts` today with values `['draft',
'published', 'archived']` but is never referenced by any column — it's dead code left
over from an earlier plan. This work replaces its values and actually wires it to
`projects.status`, rather than leaving two competing definitions around.

New columns: `services.status` (default `'active'`, matching today's `published`
default of `true`), `projects.status` (default `'draft'`, matching today's `published`
default of `false`).

Migration, same two-phase shape as the Category work (add + backfill first, drop the
old column only once all code reads the new one):

1. One migration: add both enums, add both `status` columns, backfill
   `UPDATE services SET status = 'inactive' WHERE published = false` and
   `UPDATE projects SET status = 'inactive' WHERE published = false`. Both `published`
   columns stay for now.
2. After all code is migrated off `published`, a second migration drops
   `services.published` and `projects.published`.

Also remove the now-fully-replaced `ProjectStatus` type export from
`src/core/entities/Project.ts` (dead, never used outside that file).

## Shared status type + component

- `src/types/status.ts` (new): `export type ContentStatus = 'draft' | 'active' | 'inactive'`.
  `CategoryStatus` in `src/types/category.ts` becomes `export type CategoryStatus =
  ContentStatus` (re-export, so existing imports of `CategoryStatus` keep working
  unchanged).
- `src/presentation/components/admin/StatusMenu.tsx` (new): the badge + dropdown-menu
  control, extracted from `CategoryManagerClient.tsx`. Props: `status: ContentStatus`,
  `onChange: (status: ContentStatus) => void`, `disabled?: boolean`, and `theme?:
  'light' | 'dark'` (default `'light'`) — the Service Page Builder toolbar uses a dark
  background and its own existing dark palette, so the dark variant reuses those exact
  colors instead of the light-admin rgba greens/golds used everywhere else.
- `CategoryManagerClient.tsx` is updated to render `<StatusMenu>` instead of its inline
  `DropdownMenu`/`STATUS_LABEL`/`STATUS_STYLE` block. No behavior change.

## Backend changes

- `Service` entity: `published: boolean` → `status: ContentStatus`, default `'active'`
  in `Service.create()`.
- `Project` entity: `published: boolean` → `status: ContentStatus`, default `'draft'`
  in `Project.create()` (matches today's `published: false` default exactly).
- `DrizzleServiceRepository` / `DrizzleProjectRepository`: method names are unchanged
  (`findPublished()`, `findFeatured()`, `save()`, `update()`, mappers) — only their
  internal filter/field changes from `published`/`eq(..., true)` to
  `status`/`eq(..., 'active')`.
- `PATCH /api/admin/services/[id]` and `PATCH /api/admin/projects/[id]`: body accepts
  `status: 'draft' | 'active' | 'inactive'` instead of `published: boolean`.
- Public pages that hard-404 on `!x.published` (`app/(portfolio)/services/[category]/[item]/page.tsx`,
  `app/(portfolio)/projects/[slug]/page.tsx`) switch to `x.status !== 'active'`.
- `app/(portfolio)/services/[category]/page.tsx` passes a `published` field into
  `ServiceCategoryCarouselItem` that is declared but never read anywhere in
  `ServiceCategoryCarousel.tsx` (confirmed by search — dead prop). Since we're touching
  this exact line anyway, it's removed entirely rather than renamed to `status`.

## Admin UI changes

- **Services** (`app/admin/(protected)/services/page.tsx` → `ServiceGroupedView.tsx`):
  the binary status pill/button becomes `<StatusMenu>` with optimistic update + toast,
  same pattern as `handleTogglePublished` today.
- **`ServiceForm.tsx`** (create/edit): the "Published" `Checkbox` becomes a labeled
  `<select>` with the 3 status options (a full-form field, not a quick-action — matches
  how the rest of the form's fields are plain inputs/selects, not menu buttons).
- **`ServicePageBuilder.tsx`** (page builder toolbar): the `togglePublished`
  Published/Draft pill becomes `<StatusMenu theme="dark">` — same 3 options, dark
  variant to match the toolbar's existing dark background.
- **Projects** (`app/admin/(protected)/projects/page.tsx` → `ProjectTable.tsx`): today
  this pill is read-only (no way to change status without opening the edit page) — it
  gains the same `<StatusMenu>` treatment as Services.
- **`ProjectForm.tsx`**: same Checkbox → `<select>` change as `ServiceForm.tsx`.

## Rollout

Same as the Category project: apply migration 1 (add + backfill) to production via
`npm run db:migrate`, update all code, apply migration 2 (drop `published` columns),
verify with `npx tsc --noEmit && npm run lint && npm run build`. No `git commit`. No
Chrome DevTools MCP browser testing. Historical one-off scripts that write
`published: true/false` directly to these tables (`scripts/seed-portfolio.ts`,
`scripts/seed-services-taxonomy-2026-06.ts`) get the same mechanical
`published` → `status` rename as the Category project's historical scripts did, purely
to keep them compiling — they are not re-run.
