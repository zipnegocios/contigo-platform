# Category status CRUD + admin UI polish

## Problem

`/admin/categories` only supports editing a category's name/parent/description/icon and
toggling a single `isActive` boolean. There is no way to delete a category from the UI
(the API already blocks deleting `isSystem` categories but the button doesn't exist), and
there's no "draft" state to prepare a category before it goes live.

## Scope

In scope:
- Replace the `isActive` boolean with a real 3-state `status` column (`draft` | `active` |
  `inactive`) on `categories`.
- Add Delete / Activate / Deactivate / Draft actions to the `/admin/categories` page.
- Visual/UX polish of that page's list (status badge, status menu, delete button).

Out of scope (separate follow-on project, explicitly deferred by the user):
- Removing hardcoded `SERVICE_ROOT_SLUGS`, root taglines, and the static fallback
  catalogue in `serviceCategoryMeta.ts`, and making public `/services/[category]` routing
  fully DB-driven. `isSystem` and the slug-freeze behavior in `Category.withUpdates()`
  are untouched by this project.

## Data model

New enum:

```ts
export const categoryStatusEnum = pgEnum('category_status', ['draft', 'active', 'inactive'])
```

New column on `categories`: `status: categoryStatusEnum('status').notNull().default('active')`.

Migration in two steps (matches this repo's existing pattern for column swaps, e.g.
`leads.stage_id` — add + backfill first, drop the old column only once everything reads
from the new one):

1. `drizzle-kit generate` migration: add `category_status` enum + `status` column
   (default `'active'`), then backfill `UPDATE categories SET status = 'inactive' WHERE
   is_active = false`. `is_active` column stays for now.
2. After the app code no longer reads/writes `is_active` anywhere, a second migration
   drops the `is_active` column.

Both migrations are applied to production via `npm run db:migrate` in this session
(user has authorized direct production DB changes for this task).

## Backend changes

- `Category` entity (`src/core/entities/Category.ts`): `isActive: boolean` → `status:
  CategoryStatus`. `Category.create()` defaults to `status: 'active'`. `withUpdates()`
  accepts `status` instead of `isActive`.
- `src/types/category.ts`: `FlatCategory.isActive` → `FlatCategory.status:
  CategoryStatus`. `UpdateCategoryInput.isActive` → `UpdateCategoryInput.status`.
- `ICategoryRepository` / `DrizzleCategoryRepository`: `activeOnly` filter changes from
  `eq(categories.isActive, true)` to `eq(categories.status, 'active')`. All row
  mappers map `row.status` instead of `row.isActive`.
- `PATCH /api/admin/categories/[id]`: body accepts `status: 'draft' | 'active' |
  'inactive'` (zod enum) instead of `isActive: boolean`.
- `DELETE /api/admin/categories/[id]`: unchanged — still blocks `isSystem` categories.
- Read-only consumers currently checking `.isActive` switch to `status === 'active'`:
  - `app/(portfolio)/projects/page.tsx`
  - `app/(portfolio)/services/[category]/page.tsx`
  - `app/api/categories/tree/route.ts`
  - `src/presentation/components/admin/HierarchicalCategorySelect.tsx`
  - `app/api/admin/categories/route.ts` (serializeCategory)
  - `scripts/seed-categories.ts` (insert `status: 'active'` instead of `isActive: true`)
- `CategoryTreeView`/`CategoryTreeNode` are dead code (not routed anywhere) — left as-is,
  not in scope.

## Frontend changes (`CategoryManagerClient.tsx`)

Per row:
- **Status badge**: 3 visual states — Active (green), Draft (amber, dashed border),
  Inactive (grey). Replaces today's binary Active/Inactive pill.
- **Status menu**: dropdown (shadcn `dropdown-menu`, already in the project) with 3
  options (Activate / Deactivate / Set as draft). Optimistic update with rollback on
  failure and a `sonner` toast, mirroring `ServiceGroupedView.handleTogglePublished`.
- **Delete button**: trash icon next to the existing edit (pencil) button. Native
  `confirm()` before calling `DELETE`, matching `ServiceGroupedView.handleDelete`.
  Disabled (with a tooltip) for `isSystem` categories, matching the existing API guard.

Visual polish: consistent spacing/hover states for the row's action cluster, disabled
state styling for the delete button on system categories. No new color tokens — reuses
the existing palette (`--contigo-primary`, `#E5DDD0`, `#6B6560`, etc.) and fluid-text
classes already used on this page.

## Rollout

1. Edit schema, generate + apply migration 1 (add `status` + backfill) against
   production via `npm run db:migrate`.
2. Update all backend/frontend code to the new `status` field.
3. Generate + apply migration 2 (drop `is_active`) via `npm run db:migrate`.
4. Run `npm run lint` and `npm run build` to verify. No test suite exists in this repo
   (see project memory `feedback_no_test_infra`) — verification is lint + build +
   manual review, not automated tests.
5. No `git commit`. No manual browser testing via the Chrome DevTools MCP tool (per
   user's explicit instruction this session).
