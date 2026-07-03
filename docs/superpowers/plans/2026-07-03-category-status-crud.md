# Category Status CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `categories.isActive` boolean with a 3-state `status` column (`draft` | `active` | `inactive`), expose Delete / Activate / Deactivate / Draft actions on `/admin/categories`, and polish that page's visual design.

**Architecture:** Additive-then-drop DB migration (matches this repo's existing pattern for column swaps — see `20260622045449_backfill_and_finalize_leads_stage_id.sql`). Domain/repository/API/UI all swap `isActive: boolean` for `status: CategoryStatus` in lockstep. No new abstractions — the CRUD page already exists (`CategoryManagerClient.tsx`), this only adds actions and a proper status control to it.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM (Postgres), sonner (toasts), Radix `dropdown-menu` (already vendored in `src/presentation/components/ui/`).

## Global Constraints

- No `git commit` — user explicitly asked not to create commits this session.
- No manual browser testing via the Chrome DevTools MCP tool — user explicitly asked not to use it this session. Verify via `npm run lint` + `npx tsc --noEmit` instead (this repo has no automated test suite — see project memory `feedback_no_test_infra`).
- DB changes go straight to production via `npm run db:migrate` (user has explicitly authorized this for this task).
- Do NOT touch `isSystem` slug-freeze behavior in `Category.withUpdates()`, `SERVICE_ROOT_SLUGS`, or anything in `serviceCategoryMeta.ts` — that's the deferred, separate de-hardcoding project.
- `CategoryTreeView.tsx` / `CategoryTreeNode.tsx` are dead code (not imported by any route) — do not modify them as part of this plan.

---

### Task 1: Add `status` column to the schema

**Files:**
- Modify: `src/infrastructure/db/schema.ts:92` (insert enum after `taskStatusEnum`)
- Modify: `src/infrastructure/db/schema.ts:123-146` (categories table)

**Interfaces:**
- Produces: `categoryStatusEnum` (Drizzle pgEnum, values `'draft' | 'active' | 'inactive'`), `categories.status` column (Drizzle inferred type `'draft' | 'active' | 'inactive'`, NOT NULL, default `'active'`). Later tasks import `categoryStatusEnum` from `@/infrastructure/db/schema` only if needed for type references (not required — the inferred row type is enough).

- [ ] **Step 1: Insert the new enum**

In `src/infrastructure/db/schema.ts`, right after line 92 (`export const taskStatusEnum = pgEnum('task_status', ['open', 'in_progress', 'done'])`), add:

```ts

export const categoryStatusEnum = pgEnum('category_status', ['draft', 'active', 'inactive'])
```

- [ ] **Step 2: Add the `status` column and index to the `categories` table**

Replace the `categories` table definition (`src/infrastructure/db/schema.ts:123-146`) with:

```ts
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
    type: varchar('type', { length: 20 }).notNull().default('project'),
    description: text('description'),
    icon: varchar('icon', { length: 100 }),
    orderIndex: integer('order_index').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    status: categoryStatusEnum('status').notNull().default('active'),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_categories_slug').on(table.slug),
    index('idx_categories_is_system').on(table.isSystem),
    index('idx_categories_parent_id').on(table.parentId),
    index('idx_categories_type').on(table.type),
    index('idx_categories_order').on(table.orderIndex),
    index('idx_categories_status').on(table.status),
  ],
)
```

Note: `isActive`/`is_active` stays for now — it is dropped in Task 9, once every code path reads `status` instead.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors introduced by the schema change (existing code still reads `.isActive`, which still exists on the row type at this point).

---

### Task 2: Generate and apply migration 1 (add column + backfill)

**Files:**
- Create: a new file under `src/infrastructure/db/migrations/` (name chosen by drizzle-kit, timestamp-prefixed)

**Interfaces:**
- Consumes: schema from Task 1.
- Produces: production DB has `category_status` enum type and `categories.status` column, backfilled from `is_active`.

- [ ] **Step 1: Generate the migration**

Run: `npx drizzle-kit generate --name add-category-status`
Expected: a new file `src/infrastructure/db/migrations/<timestamp>_add-category-status.sql` containing `CREATE TYPE "public"."category_status" AS ENUM('draft', 'active', 'inactive');` and `ALTER TABLE "categories" ADD COLUMN "status" ... DEFAULT 'active' NOT NULL;` plus the new index.

- [ ] **Step 2: Append the backfill statement**

Open the generated file and add at the end (after a `--> statement-breakpoint` line):

```sql
--> statement-breakpoint
UPDATE categories SET status = 'inactive' WHERE is_active = false;
```

- [ ] **Step 3: Apply the migration to production**

Run: `npm run db:migrate`
Expected: command exits 0, output lists the new migration as applied.

- [ ] **Step 4: Spot-check the backfill**

Run (via `npm run db:studio` or a one-off script) a query equivalent to:
```sql
SELECT status, is_active, count(*) FROM categories GROUP BY status, is_active;
```
Expected: every row where `is_active = false` has `status = 'inactive'`; every row where `is_active = true` has `status = 'active'`.

---

### Task 3: Update shared types

**Files:**
- Modify: `src/types/category.ts` (full file)

**Interfaces:**
- Produces: `CategoryStatus = 'draft' | 'active' | 'inactive'`, `FlatCategory.status: CategoryStatus` (replaces `isActive`), `UpdateCategoryInput.status?: CategoryStatus` (replaces `isActive`).

- [ ] **Step 1: Rewrite the file**

```ts
export type CategoryType = 'shared'
export type CategoryStatus = 'draft' | 'active' | 'inactive'

export interface FlatCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  type: CategoryType
  description: string | null
  icon: string | null
  orderIndex: number
  status: CategoryStatus
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface CategoryNode extends FlatCategory {
  children: CategoryNode[]
}

export interface CreateCategoryInput {
  name: string
  parentId?: string | null
  description?: string | null
  icon?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  parentId?: string | null
  description?: string | null
  icon?: string | null
  status?: CategoryStatus
}

export interface ReorderItem {
  id: string
  orderIndex: number
  parentId: string | null
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: errors now appear in every file that still references `.isActive` on `FlatCategory`/`UpdateCategoryInput` — that's expected; Tasks 4-8 fix each one. Confirm the error list matches: `src/core/entities/Category.ts`, `src/infrastructure/repositories/DrizzleCategoryRepository.ts`, `app/api/admin/categories/route.ts`, `app/api/admin/categories/[id]/route.ts`, `app/admin/(protected)/categories/page.tsx`, `app/(portfolio)/projects/page.tsx`, `app/(portfolio)/services/[category]/page.tsx`, `app/api/categories/tree/route.ts`, `src/presentation/components/admin/HierarchicalCategorySelect.tsx`, `src/presentation/components/admin/CategoryManagerClient.tsx`, `scripts/seed-categories.ts`.

---

### Task 4: Update the `Category` domain entity

**Files:**
- Modify: `src/core/entities/Category.ts` (full file)

**Interfaces:**
- Consumes: `CategoryStatus` from `@/types/category` (Task 3).
- Produces: `Category.status: CategoryStatus` (replaces `isActive`). `Category.create()` defaults `status: 'active'`. `Category.withUpdates({ status })` replaces `withUpdates({ isActive })`. `Category.reconstruct()` takes `status` in its props.

- [ ] **Step 1: Rewrite the file**

```ts
import type { CategoryType, CategoryStatus, CreateCategoryInput, UpdateCategoryInput } from '@/types/category'

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export class Category {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly parentId: string | null
  readonly type: CategoryType
  readonly description: string | null
  readonly icon: string | null
  readonly orderIndex: number
  readonly status: CategoryStatus
  readonly isSystem: boolean
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    name: string
    slug: string
    parentId: string | null
    type: CategoryType
    description: string | null
    icon: string | null
    orderIndex: number
    status: CategoryStatus
    isSystem: boolean
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.name = props.name
    this.slug = props.slug
    this.parentId = props.parentId
    this.type = props.type
    this.description = props.description
    this.icon = props.icon
    this.orderIndex = props.orderIndex
    this.status = props.status
    this.isSystem = props.isSystem
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateCategoryInput): Category {
    const now = new Date()
    return new Category({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      slug: makeSlug(input.name),
      parentId: input.parentId ?? null,
      type: 'shared',
      description: input.description ?? null,
      icon: input.icon ?? null,
      orderIndex: 0,
      status: 'active',
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    })
  }

  withUpdates(partial: UpdateCategoryInput): Category {
    const newName = partial.name !== undefined ? partial.name.trim() : this.name
    // System categories (the 4 fixed service/project roots) keep their slug
    // frozen even when the display name changes — the slug is hardcoded
    // across public route matching, the sitemap, and the fallback catalogue
    // (see serviceCategoryMeta.ts's SERVICE_ROOT_SLUGS), so regenerating it
    // here would silently 404 every page under that category.
    const shouldRegenerateSlug = partial.name !== undefined && !this.isSystem
    return new Category({
      id: this.id,
      name: newName,
      slug: shouldRegenerateSlug ? makeSlug(partial.name!) : this.slug,
      parentId: partial.parentId !== undefined ? partial.parentId : this.parentId,
      type: this.type,
      description: partial.description !== undefined ? partial.description : this.description,
      icon: partial.icon !== undefined ? partial.icon : this.icon,
      orderIndex: this.orderIndex,
      status: partial.status !== undefined ? partial.status : this.status,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    name: string
    slug: string
    parentId: string | null
    type: CategoryType
    description: string | null
    icon: string | null
    orderIndex: number
    status: CategoryStatus
    isSystem: boolean
    createdAt: Date
    updatedAt: Date
  }): Category {
    return new Category(props)
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: errors remaining only in the files not yet updated (repository, API routes, admin page, portfolio pages, `HierarchicalCategorySelect`, `CategoryManagerClient`, `seed-categories.ts`).

---

### Task 5: Update the repository layer

**Files:**
- Modify: `src/infrastructure/repositories/DrizzleCategoryRepository.ts` (full file)

**Interfaces:**
- Consumes: `Category.status`/`Category.reconstruct()` (Task 4), `FlatCategory.status` (Task 3).
- Produces: `findAll(type?, activeOnly?)` and `findFlat(type, activeOnly?)` now filter on `status = 'active'` instead of `isActive = true`. `save()`/`update()` write `status` instead of `isActive`.

- [ ] **Step 1: Rewrite the file**

```ts
import { eq, asc, and, or } from 'drizzle-orm'
import { db } from '../db/client'
import { categories } from '../db/schema'
import { Category } from '@/core/entities/Category'
import type { ICategoryRepository } from '@/core/repositories/ICategoryRepository'
import type { FlatCategory, CategoryType, ReorderItem } from '@/types/category'

type CategoryRow = typeof categories.$inferSelect

function mapToFlat(row: CategoryRow): FlatCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId ?? null,
    type: (row.type as CategoryType) ?? 'project',
    description: row.description ?? null,
    icon: row.icon ?? null,
    orderIndex: row.orderIndex,
    status: row.status,
    isSystem: row.isSystem,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapToEntity(row: CategoryRow): Category {
  return Category.reconstruct({
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId ?? null,
    type: (row.type as CategoryType) ?? 'project',
    description: row.description ?? null,
    icon: row.icon ?? null,
    orderIndex: row.orderIndex,
    status: row.status,
    isSystem: row.isSystem,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class DrizzleCategoryRepository implements ICategoryRepository {
  async findAll(type?: CategoryType, activeOnly: boolean = true): Promise<Category[]> {
    // When filtering by 'project' or 'service', also include 'shared' categories.
    const typeCondition = type
      ? type === 'shared'
        ? eq(categories.type, 'shared')
        : or(eq(categories.type, type), eq(categories.type, 'shared'))
      : undefined
    const conditions = [
      typeCondition,
      activeOnly ? eq(categories.status, 'active') : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined)

    const rows = await db
      .select()
      .from(categories)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(categories.orderIndex), asc(categories.name))
    return rows.map(mapToEntity)
  }

  async findFlat(type: CategoryType, activeOnly: boolean = true): Promise<FlatCategory[]> {
    // When filtering by 'project' or 'service', also include 'shared' categories.
    const typeCondition = type === 'shared'
      ? eq(categories.type, 'shared')
      : or(eq(categories.type, type), eq(categories.type, 'shared'))
    const conditions = [
      typeCondition,
      activeOnly ? eq(categories.status, 'active') : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined)

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.orderIndex), asc(categories.name))
    return rows.map(mapToFlat)
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async findBySlug(slug: string, type?: CategoryType): Promise<Category | null> {
    // When filtering by a specific type, also accept 'shared' categories.
    const condition = type
      ? and(eq(categories.slug, slug), or(eq(categories.type, type), eq(categories.type, 'shared')))
      : eq(categories.slug, slug)
    const rows = await db.select().from(categories).where(condition).limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async save(category: Category): Promise<void> {
    await db
      .insert(categories)
      .values({
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        type: category.type,
        description: category.description,
        icon: category.icon,
        orderIndex: category.orderIndex,
        status: category.status,
        isSystem: category.isSystem,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })
      .onConflictDoNothing()
  }

  async update(category: Category): Promise<void> {
    await db
      .update(categories)
      .set({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        description: category.description,
        icon: category.icon,
        orderIndex: category.orderIndex,
        status: category.status,
        updatedAt: category.updatedAt,
      })
      .where(eq(categories.id, category.id))
  }

  async reorder(updates: ReorderItem[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const item of updates) {
        await tx
          .update(categories)
          .set({
            orderIndex: item.orderIndex,
            parentId: item.parentId,
            updatedAt: new Date(),
          })
          .where(eq(categories.id, item.id))
      }
    })
  }

  async delete(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id))
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors remaining in this file. Errors remain in API routes, admin page, portfolio pages, `HierarchicalCategorySelect`, `CategoryManagerClient`, `seed-categories.ts`.

---

### Task 6: Update the admin API routes

**Files:**
- Modify: `app/api/admin/categories/route.ts:14-28` (`serializeCategory`)
- Modify: `app/api/admin/categories/[id]/route.ts:6-12` (`UpdateSchema`)

**Interfaces:**
- Consumes: `Category.status` (Task 4), `CategoryStatus` type (Task 3).

- [ ] **Step 1: Update `serializeCategory` in `app/api/admin/categories/route.ts`**

Replace lines 14-29:

```ts
function serializeCategory(c: Category) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    type: c.type,
    description: c.description,
    icon: c.icon,
    orderIndex: c.orderIndex,
    status: c.status,
    isSystem: c.isSystem,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}
```

- [ ] **Step 2: Update `UpdateSchema` in `app/api/admin/categories/[id]/route.ts`**

Replace lines 6-12:

```ts
const UpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
})
```

No other changes needed in that file — `category.withUpdates(input)` (line 51) already forwards whatever is in `input`, and `input.status` now flows through correctly since `UpdateCategoryInput.status` exists (Task 3).

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors remaining in either route file.

---

### Task 7: Update the admin categories page and remaining `isActive` readers

**Files:**
- Modify: `app/admin/(protected)/categories/page.tsx:8-21`
- Modify: `app/(portfolio)/projects/page.tsx:60-62`
- Modify: `app/(portfolio)/services/[category]/page.tsx:77`
- Modify: `app/api/categories/tree/route.ts:8`
- Modify: `src/presentation/components/admin/HierarchicalCategorySelect.tsx:25`
- Modify: `scripts/seed-categories.ts:70`

**Interfaces:**
- Consumes: `FlatCategory.status` (Task 3), `Category.status` (Task 4).

- [ ] **Step 1: `app/admin/(protected)/categories/page.tsx`**

Replace the `flat` mapping (lines 8-21):

```ts
  const flat = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    type: c.type,
    description: c.description,
    icon: c.icon,
    orderIndex: c.orderIndex,
    status: c.status,
    isSystem: c.isSystem,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))
```

- [ ] **Step 2: `app/(portfolio)/projects/page.tsx`**

Replace line 61:

```ts
      allCategories = flatCats
        .filter((c) => c.status === 'active' && c.parentId === null)
        .map((c) => ({ name: c.name, slug: c.slug }))
```

- [ ] **Step 3: `app/(portfolio)/services/[category]/page.tsx`**

Replace line 77:

```ts
      if (!root || root.status !== 'active') {
```

- [ ] **Step 4: `app/api/categories/tree/route.ts`**

Replace line 8:

```ts
    const activeFlat = flat.filter((c) => c.status === 'active')
```

- [ ] **Step 5: `src/presentation/components/admin/HierarchicalCategorySelect.tsx`**

Replace line 25:

```ts
      .filter((c) => c.parentId === parentId && c.status === 'active')
```

- [ ] **Step 6: `scripts/seed-categories.ts`**

Replace line 70 (inside `upsertCategory`'s `db.insert(...).values({...})` call):

```ts
    status: 'active',
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors remaining anywhere except `CategoryManagerClient.tsx` (Task 8).

---

### Task 8: Redesign `CategoryManagerClient.tsx` — status menu, delete button, visual polish

**Files:**
- Modify: `src/presentation/components/admin/CategoryManagerClient.tsx` (full file)

**Interfaces:**
- Consumes: `FlatCategory.status: CategoryStatus` (Task 3), `DropdownMenu`/`DropdownMenuTrigger`/`DropdownMenuContent`/`DropdownMenuItem` from `@/presentation/components/ui/dropdown-menu` (already vendored, no install needed), `PATCH`/`DELETE /api/admin/categories/[id]` (Task 6).
- Produces: nothing consumed elsewhere — this is the leaf UI component for `/admin/categories`.

- [ ] **Step 1: Rewrite the file**

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu'
import type { CategoryStatus, FlatCategory } from '@/types/category'
import { CategoryFormModal } from './CategoryFormModal'

interface CategoryManagerClientProps {
  categories: FlatCategory[]
}

const STATUS_LABEL: Record<CategoryStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  inactive: 'Inactive',
}

const STATUS_STYLE: Record<CategoryStatus, CSSProperties> = {
  active: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d' },
  draft: { backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A', border: '1px dashed #E2C063' },
  inactive: { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' },
}

const STATUS_OPTIONS: CategoryStatus[] = ['active', 'draft', 'inactive']

export function CategoryManagerClient({ categories }: CategoryManagerClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(categories)
  const [editTarget, setEditTarget] = useState<FlatCategory | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Re-sync whenever the server provides fresh data (after router.refresh()
  // following a status change, edit, or delete) — mirrors the pattern used
  // by CategoryTreeView for the same reason.
  useEffect(() => {
    setItems(categories)
  }, [categories])

  async function handleStatusChange(cat: FlatCategory, status: CategoryStatus) {
    if (status === cat.status) return
    const previous = items
    setItems((prev) => prev.map((c) => (c.id === cat.id ? { ...c, status } : c)))
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success(`"${cat.name}" set to ${STATUS_LABEL[status]}`)
      router.refresh()
    } catch {
      setItems(previous)
      toast.error('Failed to update status')
    }
  }

  async function handleDelete(cat: FlatCategory) {
    if (cat.isSystem) return
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
    setDeletingId(cat.id)
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to delete category')
      }
      setItems((prev) => prev.filter((c) => c.id !== cat.id))
      toast.success('Category deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg text-fluid-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-150 min-h-[44px]"
          style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
        >
          <Plus className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
          Add category
        </button>
      </div>

      <div
        className="rounded-lg overflow-hidden bg-white"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
      >
        {items.length === 0 ? (
          <div className="py-16 text-center text-fluid-sm" style={{ color: '#6B6560' }}>
            No categories found. Run the migration script first.
          </div>
        ) : (
          <ul>
            {items.map((cat, idx) => (
              <li
                key={cat.id}
                className="flex items-center justify-between px-6 py-4 gap-4"
                style={{
                  borderBottom: idx < items.length - 1 ? '1px solid #F0E8DC' : 'none',
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(226,192,99,0.12)' }}>
                    <span className="text-fluid-xs font-bold uppercase" style={{ color: '#E2C063' }}>
                      {cat.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-fluid-sm font-semibold truncate" style={{ color: '#2D2924' }}>{cat.name}</p>
                    <p className="text-fluid-xs truncate" style={{ color: '#9C8F83' }}>{cat.slug}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide flex-shrink-0 transition-opacity duration-150 hover:opacity-75"
                        style={STATUS_STYLE[cat.status]}
                      >
                        {STATUS_LABEL[cat.status]}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {STATUS_OPTIONS.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          disabled={status === cat.status}
                          onSelect={() => handleStatusChange(cat, status)}
                        >
                          {STATUS_LABEL[status]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] min-w-[44px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                    onClick={() => setEditTarget(cat)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--contigo-primary)'
                      e.currentTarget.style.color = 'var(--contigo-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5DDD0'
                      e.currentTarget.style.color = '#6B6560'
                    }}
                  >
                    <Pencil className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={cat.isSystem || deletingId === cat.id}
                    title={cat.isSystem ? 'System categories cannot be deleted' : 'Delete category'}
                    className="min-h-[44px] min-w-[44px] p-0 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: '#E5DDD0', color: cat.isSystem ? '#6B6560' : '#e87070' }}
                    onClick={() => handleDelete(cat)}
                    onMouseEnter={(e) => {
                      if (cat.isSystem) return
                      e.currentTarget.style.borderColor = '#e87070'
                      e.currentTarget.style.backgroundColor = 'rgba(232,112,112,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      if (cat.isSystem) return
                      e.currentTarget.style.borderColor = '#E5DDD0'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Trash2 className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <CategoryFormModal
          mode="create"
          type="shared"
          allFlat={items}
          onClose={() => {
            setCreating(false)
            router.refresh()
          }}
        />
      )}

      {editTarget && (
        <CategoryFormModal
          mode="edit"
          type="shared"
          allFlat={items}
          editTarget={editTarget}
          onClose={() => {
            setEditTarget(null)
            router.refresh()
            toast.success('Category updated')
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles with zero errors project-wide**

Run: `npx tsc --noEmit`
Expected: exit code 0, no output.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: exit code 0, no new warnings/errors in the files touched by this plan.

---

### Task 9: Drop the legacy `is_active` column

**Files:**
- Modify: `src/infrastructure/db/schema.ts` (remove `isActive` field from `categories` table)
- Create: a new file under `src/infrastructure/db/migrations/`

**Interfaces:**
- Consumes: confirmation from Task 8 that no code references `.isActive` on categories anymore.

- [ ] **Step 1: Confirm no remaining references**

Run: `grep -rn "isActive" --include="*.ts" --include="*.tsx" app src scripts | grep -iv "isactive.*slug ===" `

(This is a sanity grep — expected to return zero matches related to `categories`/`Category`; any `isActive` hits should belong to unrelated entities like `AdminUser`, `leadContactRoles`, sidebar nav state, etc. — confirm each hit before proceeding.)

- [ ] **Step 2: Remove the `isActive` column from the schema**

In `src/infrastructure/db/schema.ts`, delete the line `isActive: boolean('is_active').notNull().default(true),` from the `categories` table (it sits directly above the `status` column added in Task 1).

- [ ] **Step 3: Generate the drop migration**

Run: `npx drizzle-kit generate --name drop-category-is-active`
Expected: a new file containing `ALTER TABLE "categories" DROP COLUMN "is_active";`

- [ ] **Step 4: Apply it to production**

Run: `npm run db:migrate`
Expected: exit code 0, migration listed as applied.

- [ ] **Step 5: Final full verification**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three succeed with no errors.

---

## Explicitly not done in this plan

- No `npm run seed` / `npm run seed:portfolio` execution: neither seed script is relevant to this change. `seed-categories.ts` only inserts categories if they don't already exist (idempotent, and only touched for its one `isActive` → `status` line in Task 7); `seed-portfolio.ts` inserts 5 *example* projects and demo categories into whatever `DATABASE_URL` it's pointed at — running it against production would create fake content on the live site, so it is intentionally skipped. Flag this to the user in the final report.
- No `git commit` at any step (Global Constraints).
- No Chrome DevTools MCP browser testing (Global Constraints) — verification is `tsc`/`lint`/`build` only.
