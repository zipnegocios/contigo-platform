# Service & Project Status CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `services.published`/`projects.published` booleans with a 3-state `status` column (`draft` | `active` | `inactive`) each, add status-change controls to every admin surface that touches them, and extract a shared `StatusMenu` component + `ContentStatus` type (this is the 3rd entity using this exact pattern, after Category).

**Architecture:** Same additive-then-drop migration shape used for Category (`docs/superpowers/plans/2026-07-03-category-status-crud.md`). A new shared `ContentStatus` type and `StatusMenu` component are extracted first, then `CategoryManagerClient` is retrofitted onto them, then Service and Project get the same treatment end-to-end (entity → repository → API → admin UI → public pages).

**Tech Stack:** Next.js 15 App Router, Drizzle ORM (Postgres), sonner, Radix `dropdown-menu` (already vendored).

## Global Constraints

- No `git commit` — user explicitly asked not to create commits this session.
- No Chrome DevTools MCP browser testing — verify via `npx tsc --noEmit` + `npm run lint` + `npm run build` only (no automated test suite in this repo).
- DB changes go straight to production via `npm run db:migrate` (user has explicitly authorized this).
- `status === 'active'` is a drop-in replacement for `published === true` everywhere — no new public-facing behavior. Draft and inactive both behave exactly like `published === false` does today.
- Do not touch `SERVICE_ROOT_SLUGS`/`serviceCategoryMeta.ts`/public route hardcoding — still deferred, separate project.

---

### Task 1: Schema — add `status` columns

**Files:**
- Modify: `src/infrastructure/db/schema.ts`

**Interfaces:**
- Produces: `serviceStatusEnum`, `services.status` (NOT NULL, default `'active'`); `projectStatusEnum` (values changed from `['draft','published','archived']` to `['draft','active','inactive']`), `projects.status` (NOT NULL, default `'draft'`).

- [ ] **Step 1: Update `projectStatusEnum`'s values**

Find (near line 28):
```ts
export const projectStatusEnum = pgEnum('project_status', [
  'draft',
  'published',
  'archived',
])
```
Replace with:
```ts
export const projectStatusEnum = pgEnum('project_status', [
  'draft',
  'active',
  'inactive',
])
```

- [ ] **Step 2: Add `serviceStatusEnum`**

Right after the `projectStatusEnum` block from Step 1, add:
```ts

export const serviceStatusEnum = pgEnum('service_status', ['draft', 'active', 'inactive'])
```

- [ ] **Step 3: Add `services.status` column**

In the `services` table definition, find:
```ts
    orderIndex: integer('order_index').notNull().default(0),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    published: boolean('published').notNull().default(true),
```
Replace with:
```ts
    orderIndex: integer('order_index').notNull().default(0),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    published: boolean('published').notNull().default(true),
    status: serviceStatusEnum('status').notNull().default('active'),
```

- [ ] **Step 4: Add `projects.status` column**

In the `projects` table definition, find:
```ts
    featured: boolean('featured').notNull().default(false),
    published: boolean('published').notNull().default(false),
    coverImageUrl: text('cover_image_url').notNull(),
```
Replace with:
```ts
    featured: boolean('featured').notNull().default(false),
    published: boolean('published').notNull().default(false),
    status: projectStatusEnum('status').notNull().default('draft'),
    coverImageUrl: text('cover_image_url').notNull(),
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors (both `published` and `status` columns coexist; no code reads `status` yet).

---

### Task 2: Generate and apply migration 1 (add columns + backfill)

**Files:**
- Create: a new file under `src/infrastructure/db/migrations/` (drizzle-kit-chosen name)

**Interfaces:**
- Consumes: schema from Task 1.
- Produces: production `services` and `projects` tables have a `status` column, backfilled from `published`.

- [ ] **Step 1: Generate the migration**

Run: `npx drizzle-kit generate --name add-service-project-status`
Expected: new migration file with `CREATE TYPE "public"."service_status"`, `ALTER TABLE "services" ADD COLUMN "status"`, and (since `project_status`'s values changed) a `DROP TYPE`/`CREATE TYPE` or `ALTER TYPE ... RENAME VALUE` sequence for `project_status` plus `ALTER TABLE "projects" ADD COLUMN "status"`.

- [ ] **Step 2: Inspect the generated file before running it**

Read the generated SQL file. If drizzle-kit generated anything unrelated to `services`/`projects`/the two enums (mirroring the `hero_config` surprise from the Category migration), remove that unrelated block before applying. Confirm the file only touches `service_status`, `project_status`, `services.status`, `projects.status`.

- [ ] **Step 3: Append the backfill statements**

At the end of the generated file, after a `--> statement-breakpoint` line, add:
```sql
--> statement-breakpoint
UPDATE services SET status = 'inactive' WHERE published = false;
--> statement-breakpoint
UPDATE projects SET status = 'active' WHERE published = true;
```
(Projects default to `'draft'` on the new column, matching the `published` default of `false` — only rows where `published = true` need to move to `'active'`. Services default to `'active'`, matching `published` default of `true` — only rows where `published = false` need to move to `'inactive'`.)

- [ ] **Step 4: Apply the migration to production**

Run: `npm run db:migrate`
Expected: exit code 0, migration listed as applied.

- [ ] **Step 5: Spot-check the backfill**

Run a script equivalent to:
```sql
SELECT status, published, count(*) FROM services GROUP BY status, published;
SELECT status, published, count(*) FROM projects GROUP BY status, published;
```
Expected: `services` rows with `published=false` all show `status='inactive'`; `projects` rows with `published=true` all show `status='active'`; everything else keeps its default.

---

### Task 3: Shared `ContentStatus` type + `StatusMenu` component

**Files:**
- Create: `src/types/status.ts`
- Modify: `src/types/category.ts:2` (make `CategoryStatus` a re-export)
- Create: `src/presentation/components/admin/StatusMenu.tsx`

**Interfaces:**
- Produces: `ContentStatus = 'draft' | 'active' | 'inactive'` (exported from `@/types/status`). `StatusMenu` component: props `{ status: ContentStatus; onChange: (status: ContentStatus) => void; disabled?: boolean; theme?: 'light' | 'dark' }`.

- [ ] **Step 1: Create the shared type**

```ts
// src/types/status.ts
export type ContentStatus = 'draft' | 'active' | 'inactive'

export const CONTENT_STATUS_OPTIONS: ContentStatus[] = ['active', 'draft', 'inactive']

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  inactive: 'Inactive',
}
```

- [ ] **Step 2: Re-export `CategoryStatus` from the shared type**

In `src/types/category.ts`, replace line 2:
```ts
export type CategoryStatus = 'draft' | 'active' | 'inactive'
```
with:
```ts
import type { ContentStatus } from '@/types/status'

export type CategoryStatus = ContentStatus
```

- [ ] **Step 3: Create the shared `StatusMenu` component**

```tsx
// src/presentation/components/admin/StatusMenu.tsx
'use client'

import type { CSSProperties } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu'
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_OPTIONS } from '@/types/status'
import type { ContentStatus } from '@/types/status'

const LIGHT_STYLE: Record<ContentStatus, CSSProperties> = {
  active: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d' },
  draft: { backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A', border: '1px dashed #E2C063' },
  inactive: { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' },
}

const DARK_STYLE: Record<ContentStatus, CSSProperties> = {
  active: { backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  draft: { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' },
  inactive: { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' },
}

interface StatusMenuProps {
  status: ContentStatus
  onChange: (status: ContentStatus) => void
  disabled?: boolean
  theme?: 'light' | 'dark'
}

export function StatusMenu({ status, onChange, disabled, theme = 'light' }: StatusMenuProps) {
  const styleMap = theme === 'dark' ? DARK_STYLE : LIGHT_STYLE

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide flex-shrink-0 transition-opacity duration-150 hover:opacity-75 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={styleMap[status]}
        >
          {CONTENT_STATUS_LABEL[status]}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {CONTENT_STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option}
            disabled={option === status}
            onSelect={() => onChange(option)}
          >
            {CONTENT_STATUS_LABEL[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors (new files are self-contained; `CategoryStatus` re-export is structurally identical to before).

---

### Task 4: Retrofit `CategoryManagerClient.tsx` onto `StatusMenu`

**Files:**
- Modify: `src/presentation/components/admin/CategoryManagerClient.tsx`

**Interfaces:**
- Consumes: `StatusMenu` from `@/presentation/components/admin/StatusMenu` (Task 3).

- [ ] **Step 1: Replace the inline dropdown with `StatusMenu`**

Remove these now-redundant pieces (duplicated by `StatusMenu`):
```ts
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
```
→
```ts
import { Pencil, Plus, Trash2 } from 'lucide-react'
```

Remove:
```ts
import type { CSSProperties } from 'react'
```
and remove the `STATUS_LABEL`, `STATUS_STYLE`, `STATUS_OPTIONS` constants, and the `DropdownMenu*` import block entirely. Add:
```ts
import { StatusMenu } from './StatusMenu'
```

Replace the inline dropdown JSX:
```tsx
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide flex-shrink-0 transition-opacity duration-150 hover:opacity-75 cursor-pointer"
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
```
with:
```tsx
                  <StatusMenu
                    status={cat.status}
                    onChange={(status) => handleStatusChange(cat, status)}
                  />
```

Also update the `handleStatusChange` signature to use the shared type:
```ts
import type { CategoryStatus, FlatCategory } from '@/types/category'
```
stays as-is (still valid — `CategoryStatus` is now a re-export of `ContentStatus`, so `handleStatusChange(cat: FlatCategory, status: CategoryStatus)` still type-checks against `StatusMenu`'s `onChange: (status: ContentStatus) => void`).

- [ ] **Step 2: Verify TypeScript compiles and the page still works**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: `Compiled successfully`.

---

### Task 5: Service entity + repository

**Files:**
- Modify: `src/core/entities/Service.ts` (full file)
- Modify: `src/infrastructure/repositories/DrizzleServiceRepository.ts` (full file)

**Interfaces:**
- Produces: `Service.status: ContentStatus` (replaces `Service.published`). `DrizzleServiceRepository.findPublished()` now filters `status = 'active'` (name unchanged).

- [ ] **Step 1: Rewrite `Service.ts`**

```ts
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import type { GalleryItem } from '@/types/media'
import type { PageBlock } from '@/types/pageBlocks'
import type { ContentStatus } from '@/types/status'

export interface CreateServiceInput {
  name: string
  shortDescription: string
  fullDescription: string
  imageUrl: string
  posterUrl?: string | null
  galleryItems?: GalleryItem[]
  orderIndex?: number
  categoryId?: string | null
  pageBlocks?: PageBlock[] | null
}

export class Service {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly shortDescription: string
  readonly fullDescription: string
  readonly imageUrl: string
  readonly posterUrl: string | null
  readonly galleryItems: GalleryItem[]
  readonly orderIndex: number
  readonly categoryId: string | null
  readonly status: ContentStatus
  readonly pageBlocks: PageBlock[] | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    slug: string
    name: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
    posterUrl: string | null
    galleryItems: GalleryItem[]
    orderIndex: number
    categoryId: string | null
    status: ContentStatus
    pageBlocks: PageBlock[] | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.slug = props.slug
    this.name = props.name
    this.shortDescription = props.shortDescription
    this.fullDescription = props.fullDescription
    this.imageUrl = props.imageUrl
    this.posterUrl = props.posterUrl
    this.galleryItems = props.galleryItems
    this.orderIndex = props.orderIndex
    this.categoryId = props.categoryId
    this.status = props.status
    this.pageBlocks = props.pageBlocks
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateServiceInput): Service {
    const id = crypto.randomUUID()
    const slug = generateSlug(input.name)
    const now = new Date()

    return new Service({
      id,
      slug,
      name: input.name.trim(),
      shortDescription: input.shortDescription.trim(),
      fullDescription: input.fullDescription.trim(),
      imageUrl: input.imageUrl.trim(),
      posterUrl: input.posterUrl ?? null,
      galleryItems: input.galleryItems || [],
      orderIndex: input.orderIndex || 0,
      categoryId: input.categoryId ?? null,
      status: 'active',
      pageBlocks: input.pageBlocks ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  withOrder(orderIndex: number): Service {
    return new Service({
      id: this.id,
      slug: this.slug,
      name: this.name,
      shortDescription: this.shortDescription,
      fullDescription: this.fullDescription,
      imageUrl: this.imageUrl,
      posterUrl: this.posterUrl,
      galleryItems: this.galleryItems,
      orderIndex,
      categoryId: this.categoryId,
      status: this.status,
      pageBlocks: this.pageBlocks,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    slug: string
    name: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
    posterUrl: string | null
    galleryItems: GalleryItem[]
    orderIndex: number
    categoryId?: string | null
    status: ContentStatus
    pageBlocks: PageBlock[] | null
    createdAt: Date
    updatedAt: Date
  }): Service {
    return new Service({ ...props, categoryId: props.categoryId ?? null })
  }
}
```

- [ ] **Step 2: Rewrite `DrizzleServiceRepository.ts`**

```ts
import { eq, asc } from 'drizzle-orm'
import { db } from '../db/client'
import { services } from '../db/schema'
import { Service } from '@/core/entities/Service'
import type { GalleryItem } from '@/types/media'
import type { PageBlock } from '@/types/pageBlocks'

function normaliseGalleryRow(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item, idx) => {
    if (typeof item === 'string') return { url: item, order: idx }
    if (item && typeof item === 'object' && 'url' in item) return item as GalleryItem
    return { url: String(item), order: idx }
  })
}

export class DrizzleServiceRepository {
  async save(service: Service): Promise<void> {
    await db
      .insert(services)
      .values({
        id: service.id,
        slug: service.slug,
        name: service.name,
        shortDescription: service.shortDescription,
        fullDescription: service.fullDescription,
        imageUrl: service.imageUrl,
        posterUrl: service.posterUrl,
        galleryItems: service.galleryItems,
        orderIndex: service.orderIndex,
        categoryId: service.categoryId,
        status: service.status,
        pageBlocks: service.pageBlocks,
      })
      .onConflictDoNothing()
  }

  async findById(id: string): Promise<Service | null> {
    const rows = await db.select().from(services).where(eq(services.id, id)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToService(rows[0])
  }

  async findBySlug(slug: string): Promise<Service | null> {
    const rows = await db.select().from(services).where(eq(services.slug, slug)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToService(rows[0])
  }

  async findAll(limit = 100, offset = 0): Promise<Service[]> {
    const rows = await db
      .select()
      .from(services)
      .orderBy(asc(services.orderIndex))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToService(row))
  }

  async findPublished(): Promise<Service[]> {
    const rows = await db
      .select()
      .from(services)
      .where(eq(services.status, 'active'))
      .orderBy(asc(services.orderIndex))

    return rows.map((row) => this.mapRowToService(row))
  }

  async update(service: Service): Promise<void> {
    await db
      .update(services)
      .set({
        name: service.name,
        shortDescription: service.shortDescription,
        fullDescription: service.fullDescription,
        imageUrl: service.imageUrl,
        posterUrl: service.posterUrl,
        galleryItems: service.galleryItems,
        orderIndex: service.orderIndex,
        categoryId: service.categoryId,
        status: service.status,
        pageBlocks: service.pageBlocks,
        updatedAt: new Date(),
      })
      .where(eq(services.id, service.id))
  }

  async updateOrder(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    for (const { id, orderIndex } of updates) {
      await db
        .update(services)
        .set({ orderIndex, updatedAt: new Date() })
        .where(eq(services.id, id))
    }
  }

  async delete(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id))
  }

  private mapRowToService(row: Record<string, unknown>): Service {
    return Service.reconstruct({
      id: row.id as string,
      slug: row.slug as string,
      name: row.name as string,
      shortDescription: row.shortDescription as string,
      fullDescription: row.fullDescription as string,
      imageUrl: row.imageUrl as string,
      posterUrl: (row.posterUrl as string | null) ?? null,
      galleryItems: normaliseGalleryRow(row.galleryItems),
      orderIndex: row.orderIndex as number,
      categoryId: (row.categoryId as string | null) ?? null,
      status: row.status as Service['status'],
      pageBlocks: (row.pageBlocks as PageBlock[] | null) ?? null,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
    })
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: errors now surface in every remaining file that reads `.published`/`published:` on a `Service` — that's expected, fixed in Tasks 6-8.

---

### Task 6: Service API routes

**Files:**
- Modify: `app/api/admin/services/[id]/route.ts:83-98` (the `Service.reconstruct` call in `PATCH`)

**Interfaces:**
- Consumes: `Service.status` (Task 5).

- [ ] **Step 1: Update the PATCH handler**

Replace:
```ts
    const updated = Service.reconstruct({
      id: service.id,
      slug: newSlug,
      name: newName,
      shortDescription: body.shortDescription ?? service.shortDescription,
      fullDescription: body.fullDescription ?? service.fullDescription,
      imageUrl: newImageUrl,
      posterUrl: newPosterUrl,
      galleryItems: newGalleryItems,
      orderIndex: service.orderIndex,
      categoryId: body.categoryId !== undefined ? body.categoryId : service.categoryId,
      published: body.published !== undefined ? Boolean(body.published) : service.published,
      pageBlocks: body.pageBlocks !== undefined ? (body.pageBlocks as PageBlock[] | null) : service.pageBlocks,
      createdAt: service.createdAt,
      updatedAt: new Date(),
    })
```
with:
```ts
    const updated = Service.reconstruct({
      id: service.id,
      slug: newSlug,
      name: newName,
      shortDescription: body.shortDescription ?? service.shortDescription,
      fullDescription: body.fullDescription ?? service.fullDescription,
      imageUrl: newImageUrl,
      posterUrl: newPosterUrl,
      galleryItems: newGalleryItems,
      orderIndex: service.orderIndex,
      categoryId: body.categoryId !== undefined ? body.categoryId : service.categoryId,
      status: body.status !== undefined ? body.status : service.status,
      pageBlocks: body.pageBlocks !== undefined ? (body.pageBlocks as PageBlock[] | null) : service.pageBlocks,
      createdAt: service.createdAt,
      updatedAt: new Date(),
    })
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors remaining in this file.

---

### Task 7: Service admin UI

**Files:**
- Modify: `app/admin/(protected)/services/page.tsx` (mapping)
- Modify: `app/admin/(protected)/services/[id]/edit/page.tsx` (prop passed to `ServiceForm`)
- Modify: `app/admin/(protected)/services/[id]/builder/page.tsx` (prop passed to `ServicePageBuilder`)
- Modify: `src/presentation/components/admin/ServiceGroupedView.tsx` (full file)
- Modify: `src/presentation/components/admin/ServiceForm.tsx`
- Modify: `src/presentation/components/admin/page-builder/ServicePageBuilder.tsx`

**Interfaces:**
- Consumes: `StatusMenu` (Task 3), `Service.status` (Task 5).

- [ ] **Step 1: `app/admin/(protected)/services/page.tsx`**

Replace:
```ts
        .map((s) => ({
          id: s.id,
          name: s.name,
          shortDescription: s.shortDescription,
          orderIndex: s.orderIndex,
          published: s.published,
          imageUrl: s.imageUrl,
          categoryId: s.categoryId,
        })),
```
with:
```ts
        .map((s) => ({
          id: s.id,
          name: s.name,
          shortDescription: s.shortDescription,
          orderIndex: s.orderIndex,
          status: s.status,
          imageUrl: s.imageUrl,
          categoryId: s.categoryId,
        })),
```

- [ ] **Step 2: `app/admin/(protected)/services/[id]/edit/page.tsx`**

Replace:
```ts
          published: service.published,
```
with:
```ts
          status: service.status,
```

- [ ] **Step 3: `app/admin/(protected)/services/[id]/builder/page.tsx`**

Replace:
```ts
        published: service.published,
```
with:
```ts
        status: service.status,
```

- [ ] **Step 4: Rewrite `ServiceGroupedView.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Trash2, GripVertical, Pencil, Settings2 } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { StatusMenu } from './StatusMenu'
import type { ContentStatus } from '@/types/status'

export interface ServiceGroupItem {
  id: string
  name: string
  shortDescription: string
  orderIndex: number
  status: ContentStatus
  imageUrl: string
  categoryId: string | null
}

export interface ServiceGroup {
  categoryId: string
  categoryName: string
  categorySlug: string
  services: ServiceGroupItem[]
}

interface ServiceGroupedViewProps {
  groups: ServiceGroup[]
}

function CategorySection({ group }: { group: ServiceGroup }) {
  const router = useRouter()
  const [items, setItems] = useState(group.services)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const initialOrder = group.services.map((s) => s.id)
  const hasChanges = items.some((s, i) => s.id !== initialOrder[i])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer!.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const from = items.findIndex((s) => s.id === draggedId)
    const to = items.findIndex((s) => s.id === targetId)
    const next = [...items]
    next.splice(to, 0, next.splice(from, 1)[0])
    next.forEach((s, i) => { s.orderIndex = i })
    setItems(next)
    setDraggedId(null)
  }

  const handleSaveOrder = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: items.map((s) => ({ id: s.id, orderIndex: s.orderIndex })) }),
      })
      if (!res.ok) throw new Error('Failed to save order')
      toast.success('Order saved')
      router.refresh()
    } catch {
      toast.error('Failed to save order')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setItems((prev) => prev.filter((s) => s.id !== id))
      toast.success('Service deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    const previous = items
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success(`Set to ${status}`)
    } catch {
      setItems(previous)
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-3">
      {/* Category header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-fluid-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
            {group.categoryName}
          </h2>
          <span
            className="px-2 py-0.5 rounded-full text-fluid-xs font-medium"
            style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A' }}
          >
            {items.length}
          </span>
        </div>
        <Link
          href={`/admin/services/new?categoryId=${group.categoryId}`}
          className="px-4 py-2 rounded-lg text-fluid-xs font-semibold inline-flex items-center gap-1 transition-all duration-150"
          style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
        >
          + Add service
        </Link>
      </div>

      {/* Service rows */}
      <div
        className="rounded-lg overflow-hidden bg-white"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 1px 4px rgba(45,41,36,0.05)' }}
      >
        {items.length === 0 ? (
          <div className="py-10 text-center text-fluid-sm" style={{ color: '#9C8F83' }}>
            No services in this category yet.
          </div>
        ) : (
          <ul>
            {items.map((svc, idx) => (
              <li
                key={svc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, svc.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, svc.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-move"
                style={{
                  borderBottom: idx < items.length - 1 ? '1px solid #F5EFE8' : 'none',
                  opacity: draggedId === svc.id ? 0.4 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFAF8' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {/* Drag handle */}
                <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: '#C5BDB5' }} />

                {/* Thumbnail */}
                {svc.imageUrl ? (
                  <img
                    src={svc.imageUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                    style={{ border: '1px solid #E5DDD0' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: '#E2C063', fontSize: '1rem', fontWeight: 700 }}
                  >
                    {svc.name.charAt(0)}
                  </div>
                )}

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <p className="text-fluid-sm font-medium truncate" style={{ color: '#2D2924' }}>{svc.name}</p>
                  <p className="text-fluid-xs truncate" style={{ color: '#9C8F83' }}>{svc.shortDescription}</p>
                </div>

                {/* Status */}
                <StatusMenu status={svc.status} onChange={(status) => handleStatusChange(svc.id, status)} />

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                  >
                    <Link href={`/admin/services/${svc.id}/edit`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                  >
                    <Link href={`/admin/services/${svc.id}/builder`}>
                      <Settings2 className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                    onClick={() => handleDelete(svc.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#dc2626'
                      e.currentTarget.style.color = '#dc2626'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5DDD0'
                      e.currentTarget.style.color = '#6B6560'
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasChanges && (
        <button
          onClick={handleSaveOrder}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-fluid-xs font-semibold transition-all min-h-[36px]"
          style={{
            backgroundColor: saving ? '#C8A55C' : '#E2C063',
            color: '#1E1A16',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save Order'}
        </button>
      )}
    </div>
  )
}

export function ServiceGroupedView({ groups }: ServiceGroupedViewProps) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <CategorySection key={group.categoryId} group={group} />
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Update `ServiceForm.tsx`**

Replace the `service` prop's `published` field (in the `ServiceFormProps` interface):
```ts
    categoryId?: string | null
    published: boolean
```
with:
```ts
    categoryId?: string | null
    status: ContentStatus
```
and add the import at the top of the file:
```ts
import type { ContentStatus } from '@/types/status'
```

Replace the `formData` initial state:
```ts
    categoryId: service?.categoryId || null as string | null,
    published: service?.published ?? true,
  })
```
with:
```ts
    categoryId: service?.categoryId || null as string | null,
    status: service?.status ?? 'active' as ContentStatus,
  })
```

Replace the submit body:
```ts
          categoryId: formData.categoryId,
          published: formData.published,
        }),
```
with:
```ts
          categoryId: formData.categoryId,
          status: formData.status,
        }),
```

Replace the "Published" checkbox:
```tsx
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, published: checked as boolean })
                    }
                  />
                  <span className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Published</span>
                </label>
```
with:
```tsx
                <div>
                  <label className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                    className="mt-2 w-full px-3 py-2 rounded-lg text-fluid-sm outline-none"
                    style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
```

Remove the now-unused `Checkbox` import:
```ts
import { Checkbox } from '@/presentation/components/ui/checkbox'
```
(delete this line — nothing else in the file uses `Checkbox`).

- [ ] **Step 6: Update `ServicePageBuilder.tsx`**

Replace the props interface field:
```ts
    imageUrl: string
    published: boolean
    pageBlocks: PageBlock[] | null
```
with:
```ts
    imageUrl: string
    status: ContentStatus
    pageBlocks: PageBlock[] | null
```
and add the import:
```ts
import type { ContentStatus } from '@/types/status'
import { StatusMenu } from '@/presentation/components/admin/StatusMenu'
```

Replace the state declaration:
```ts
  const [published, setPublished] = useState(service.published)
```
with:
```ts
  const [status, setStatus] = useState<ContentStatus>(service.status)
```

Replace the save handler's body:
```ts
        body: JSON.stringify({ pageBlocks: blocks, published }),
```
with:
```ts
        body: JSON.stringify({ pageBlocks: blocks, status }),
```

Replace `togglePublished` entirely:
```ts
  const togglePublished = async () => {
    const next = !published
    setPublished(next)
    try {
      await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      })
      toast.success(next ? 'Published' : 'Set to Draft')
    } catch {
      setPublished(!next)
      toast.error('Failed to update status')
    }
  }
```
with:
```ts
  const handleStatusChange = async (next: ContentStatus) => {
    const previous = status
    setStatus(next)
    try {
      await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      toast.success(`Set to ${next}`)
    } catch {
      setStatus(previous)
      toast.error('Failed to update status')
    }
  }
```

Replace the toolbar's Published/Draft button:
```tsx
          <button
            onClick={togglePublished}
            style={{
              padding: '5px 11px', borderRadius: 7,
              fontSize: '0.72rem', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 140ms',
              ...(published
                ? { backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ade80' }
                : { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }),
            }}
          >
            {published ? '● Published' : '○ Draft'}
          </button>
```
with:
```tsx
          <StatusMenu status={status} onChange={handleStatusChange} theme="dark" />
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors remaining in any of the 6 files touched by this task.

---

### Task 8: Service public pages

**Files:**
- Modify: `app/(portfolio)/services/[category]/[item]/page.tsx:38`
- Modify: `app/(portfolio)/services/[category]/page.tsx:97` and its dead-prop removal
- Modify: `src/presentation/sections/ServiceCategoryCarousel.tsx:17`

**Interfaces:**
- Consumes: `Service.status` (Task 5).

- [ ] **Step 1: `[category]/[item]/page.tsx`**

Replace:
```ts
  if (!service || !service.published) return null
```
with:
```ts
  if (!service || service.status !== 'active') return null
```

- [ ] **Step 2: Remove the dead `published` prop in `[category]/page.tsx`**

Replace the fallback-item construction:
```ts
    shortDescription: f.shortDescription,
    iconKey: f.iconKey,
    imageUrl: null,
    published: false,
  }))
```
with:
```ts
    shortDescription: f.shortDescription,
    iconKey: f.iconKey,
    imageUrl: null,
  }))
```

Replace the real-data-matched construction:
```ts
        items = matched.map((s) => ({
          slug: s.slug,
          name: s.name,
          shortDescription: s.shortDescription,
          iconKey:
            fallback.find((f) => f.slug === s.slug)?.iconKey ?? 'new-home',
          imageUrl: s.imageUrl,
          published: s.published,
        }))
```
with:
```ts
        items = matched.map((s) => ({
          slug: s.slug,
          name: s.name,
          shortDescription: s.shortDescription,
          iconKey:
            fallback.find((f) => f.slug === s.slug)?.iconKey ?? 'new-home',
          imageUrl: s.imageUrl,
        }))
```

- [ ] **Step 3: Remove the dead `published` field from `ServiceCategoryCarousel.tsx`**

Replace:
```ts
  iconKey: string
  imageUrl: string | null
  published: boolean
}
```
with:
```ts
  iconKey: string
  imageUrl: string | null
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors remaining in any of the 3 files touched by this task.

---

### Task 9: Project entity + repository

**Files:**
- Modify: `src/core/entities/Project.ts` (full file)
- Modify: `src/infrastructure/repositories/DrizzleProjectRepository.ts` (full file)

**Interfaces:**
- Produces: `Project.status: ContentStatus` (replaces `Project.published`, and the dead `ProjectStatus` export is removed). `DrizzleProjectRepository.findPublished()`/`findFeatured()` filter on `status = 'active'` (names unchanged).

- [ ] **Step 1: Rewrite `Project.ts`**

```ts
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import type { GalleryItem } from '@/types/media'
import type { ContentStatus } from '@/types/status'

export interface CreateProjectInput {
  title: string
  category: string
  categoryId?: string | null
  description: string
  location: string
  completedDate: Date
  coverImageUrl: string
  coverPosterUrl?: string | null
  galleryItems?: GalleryItem[]
}

export class Project {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly category: string
  readonly categoryId: string | null
  readonly description: string
  readonly location: string
  readonly completedDate: Date
  readonly featured: boolean
  readonly status: ContentStatus
  readonly coverImageUrl: string
  readonly coverPosterUrl: string | null
  readonly galleryItems: GalleryItem[]
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    slug: string
    title: string
    category: string
    categoryId: string | null
    description: string
    location: string
    completedDate: Date
    featured: boolean
    status: ContentStatus
    coverImageUrl: string
    coverPosterUrl: string | null
    galleryItems: GalleryItem[]
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.slug = props.slug
    this.title = props.title
    this.category = props.category
    this.categoryId = props.categoryId
    this.description = props.description
    this.location = props.location
    this.completedDate = props.completedDate
    this.featured = props.featured
    this.status = props.status
    this.coverImageUrl = props.coverImageUrl
    this.coverPosterUrl = props.coverPosterUrl
    this.galleryItems = props.galleryItems
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateProjectInput): Project {
    const id = crypto.randomUUID()
    const slug = generateSlug(input.title)
    const now = new Date()

    return new Project({
      id,
      slug,
      title: input.title.trim(),
      category: input.category.trim(),
      categoryId: input.categoryId ?? null,
      description: input.description.trim(),
      location: input.location.trim(),
      completedDate: input.completedDate,
      featured: false,
      status: 'draft',
      coverImageUrl: input.coverImageUrl.trim(),
      coverPosterUrl: input.coverPosterUrl ?? null,
      galleryItems: input.galleryItems || [],
      createdAt: now,
      updatedAt: now,
    })
  }

  withPublishedStatus(status: ContentStatus): Project {
    return new Project({
      id: this.id,
      slug: this.slug,
      title: this.title,
      category: this.category,
      categoryId: this.categoryId,
      description: this.description,
      location: this.location,
      completedDate: this.completedDate,
      featured: this.featured,
      status,
      coverImageUrl: this.coverImageUrl,
      coverPosterUrl: this.coverPosterUrl,
      galleryItems: this.galleryItems,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  withFeaturedStatus(featured: boolean): Project {
    return new Project({
      id: this.id,
      slug: this.slug,
      title: this.title,
      category: this.category,
      categoryId: this.categoryId,
      description: this.description,
      location: this.location,
      completedDate: this.completedDate,
      featured,
      status: this.status,
      coverImageUrl: this.coverImageUrl,
      coverPosterUrl: this.coverPosterUrl,
      galleryItems: this.galleryItems,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    slug: string
    title: string
    category: string
    categoryId?: string | null
    description: string
    location: string
    completedDate: Date
    featured: boolean
    status: ContentStatus
    coverImageUrl: string
    coverPosterUrl: string | null
    galleryItems: GalleryItem[]
    createdAt: Date
    updatedAt: Date
  }): Project {
    return new Project({ ...props, categoryId: props.categoryId ?? null })
  }
}
```

Note: `withPublishedStatus`'s parameter type changes from `boolean` to `ContentStatus`. Confirmed via `grep -rn "withPublishedStatus" app src scripts` that it has zero call sites anywhere in the app (the PATCH route in Task 10 builds a new `Project` via `Project.reconstruct` directly, not via this method) — no call sites to update.

- [ ] **Step 2: Rewrite `DrizzleProjectRepository.ts`**

```ts
import { eq, desc, and } from 'drizzle-orm'
import { db } from '../db/client'
import { projects } from '../db/schema'
import { Project } from '@/core/entities/Project'
import type { GalleryItem } from '@/types/media'

function normaliseGalleryRow(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item, idx) => {
    if (typeof item === 'string') return { url: item, order: idx }
    if (item && typeof item === 'object' && 'url' in item) return item as GalleryItem
    return { url: String(item), order: idx }
  })
}

export class DrizzleProjectRepository {
  async save(project: Project): Promise<void> {
    await db
      .insert(projects)
      .values({
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: project.category,
        categoryId: project.categoryId,
        description: project.description,
        location: project.location,
        completedDate: project.completedDate,
        featured: project.featured,
        status: project.status,
        coverImageUrl: project.coverImageUrl,
        coverPosterUrl: project.coverPosterUrl,
        galleryUrls: project.galleryItems,
      })
      .onConflictDoNothing()
  }

  async findById(id: string): Promise<Project | null> {
    const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToProject(rows[0])
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1)

    if (!rows || rows.length === 0) return null

    return this.mapRowToProject(rows[0])
  }

  async findAll(limit = 100, offset = 0): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findPublished(limit = 100, offset = 0): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.status, 'active'))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findFeatured(): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.status, 'active'), eq(projects.featured, true)))
      .orderBy(desc(projects.createdAt))

    return rows.map((row) => this.mapRowToProject(row))
  }

  async update(project: Project): Promise<void> {
    await db
      .update(projects)
      .set({
        title: project.title,
        category: project.category,
        categoryId: project.categoryId,
        description: project.description,
        location: project.location,
        completedDate: project.completedDate,
        featured: project.featured,
        status: project.status,
        coverImageUrl: project.coverImageUrl,
        coverPosterUrl: project.coverPosterUrl,
        galleryUrls: project.galleryItems,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))
  }

  async delete(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id))
  }

  async exists(slug: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1)

    return rows.length > 0
  }

  private mapRowToProject(row: Record<string, unknown>): Project {
    return Project.reconstruct({
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      category: row.category as string,
      categoryId: (row.categoryId as string | null) ?? null,
      description: row.description as string,
      location: row.location as string,
      completedDate: row.completedDate as Date,
      featured: row.featured as boolean,
      status: row.status as Project['status'],
      coverImageUrl: row.coverImageUrl as string,
      coverPosterUrl: (row.coverPosterUrl as string | null) ?? null,
      galleryItems: normaliseGalleryRow(row.galleryUrls),
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
    })
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: errors surface in every remaining file reading `.published`/`published:` on a `Project` — fixed in Tasks 10-11.

---

### Task 10: Project API routes

**Files:**
- Modify: `app/api/admin/projects/[id]/route.ts:102-118` (the `Project.reconstruct` call in `PATCH`)

**Interfaces:**
- Consumes: `Project.status` (Task 9).

- [ ] **Step 1: Update the PATCH handler**

Replace:
```ts
    const updatedProject = Project.reconstruct({
      id: project.id,
      slug: newSlug,
      title: newTitle,
      category: newCategoryName,
      categoryId: newCategoryId,
      description: body.description || project.description,
      location: body.location || project.location,
      completedDate: body.completedDate ? new Date(body.completedDate) : project.completedDate,
      featured: body.featured !== undefined ? body.featured : project.featured,
      published: body.published !== undefined ? body.published : project.published,
      coverImageUrl: newCoverImageUrl,
      coverPosterUrl: newCoverPosterUrl,
      galleryItems: newGalleryItems,
      createdAt: project.createdAt,
      updatedAt: new Date(),
    })
```
with:
```ts
    const updatedProject = Project.reconstruct({
      id: project.id,
      slug: newSlug,
      title: newTitle,
      category: newCategoryName,
      categoryId: newCategoryId,
      description: body.description || project.description,
      location: body.location || project.location,
      completedDate: body.completedDate ? new Date(body.completedDate) : project.completedDate,
      featured: body.featured !== undefined ? body.featured : project.featured,
      status: body.status !== undefined ? body.status : project.status,
      coverImageUrl: newCoverImageUrl,
      coverPosterUrl: newCoverPosterUrl,
      galleryItems: newGalleryItems,
      createdAt: project.createdAt,
      updatedAt: new Date(),
    })
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors remaining in this file.

---

### Task 11: Project admin UI

**Files:**
- Modify: `app/admin/(protected)/projects/page.tsx` (mapping)
- Modify: `app/admin/(protected)/projects/[id]/edit/page.tsx` (prop passed to `ProjectForm`)
- Modify: `src/presentation/components/admin/ProjectTable.tsx` (full file)
- Modify: `src/presentation/components/admin/ProjectForm.tsx`

**Interfaces:**
- Consumes: `StatusMenu` (Task 3), `Project.status` (Task 9).

- [ ] **Step 1: `app/admin/(protected)/projects/page.tsx`**

Replace:
```ts
        category: p.categoryId ? (catMap.get(p.categoryId) ?? p.category) : p.category,
        featured: p.featured,
        published: p.published,
      }))} />
```
with:
```ts
        category: p.categoryId ? (catMap.get(p.categoryId) ?? p.category) : p.category,
        featured: p.featured,
        status: p.status,
      }))} />
```

- [ ] **Step 2: `app/admin/(protected)/projects/[id]/edit/page.tsx`**

Replace:
```ts
          published: project.published,
```
with:
```ts
          status: project.status,
```

- [ ] **Step 3: Rewrite `ProjectTable.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { Trash2, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { StatusMenu } from './StatusMenu'
import type { ContentStatus } from '@/types/status'

interface Project {
  id: string
  title: string
  slug: string
  category: string
  featured: boolean
  status: ContentStatus
}

interface ProjectTableProps {
  projects: Project[]
}

export function ProjectTable({ projects: initialProjects }: ProjectTableProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success('Project deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete project')
      console.error(error)
    } finally {
      setDeleting(null)
    }
  }

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    const previous = projects
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update status')
      toast.success(`Set to ${status}`)
      router.refresh()
    } catch {
      setProjects(previous)
      toast.error('Failed to update status')
    }
  }

  return (
    <div
      className="rounded-lg overflow-hidden bg-white"
      style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
    >
      <Table>
        <TableHeader>
          <TableRow style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid #E5DDD0' }}>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Title</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Category</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Status</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Featured</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                No projects yet.{' '}
                <Link href="/admin/projects/new" style={{ color: 'var(--contigo-primary)', textDecoration: 'underline' }}>
                  Create one
                </Link>
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow
                key={project.id}
                style={{ borderBottom: '1px solid #F0E8DC' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--neutral-50)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>
                  {project.title}
                </TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>
                  {project.category}
                </TableCell>
                <TableCell className="py-3.5">
                  <StatusMenu status={project.status} onChange={(status) => handleStatusChange(project.id, status)} />
                </TableCell>
                <TableCell className="py-3.5">
                  {project.featured ? (
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium"
                      style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A08040' }}
                    >
                      Featured
                    </span>
                  ) : (
                    <span style={{ color: 'var(--neutral-200)' }}>—</span>
                  )}
                </TableCell>
                <TableCell className="py-3.5">
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="text-fluid-xs min-h-[44px] transition-all duration-150"
                      style={{ borderColor: 'var(--neutral-200)', color: '#6B6560' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--contigo-primary)'
                        e.currentTarget.style.color = 'var(--contigo-primary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--neutral-200)'
                        e.currentTarget.style.color = '#6B6560'
                      }}
                    >
                      <Link href={`/admin/projects/${project.id}/edit`}>
                        <Pencil className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)] mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] min-w-[44px] p-0 transition-all duration-150"
                      style={{ borderColor: 'var(--neutral-200)', color: '#6B6560' }}
                      onClick={() => handleDelete(project.id)}
                      disabled={deleting === project.id}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#dc2626'
                        e.currentTarget.style.color = '#dc2626'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--neutral-200)'
                        e.currentTarget.style.color = '#6B6560'
                      }}
                    >
                      <Trash2 className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

Note: `ProjectTable` previously took `projects` directly as a prop and rendered it (no local state, since there was no in-place mutation). It now keeps its own `projects` state (initialized from the `projects` prop) so the `StatusMenu` optimistic update has something to mutate, mirroring `CategoryManagerClient`'s `items`/`categories` pattern. Confirm the caller (`app/admin/(protected)/projects/page.tsx`) passes its `projects` array to the `projects` prop unchanged — no caller-side change needed since the prop name is the same.

- [ ] **Step 4: Update `ProjectForm.tsx`**

Replace the `project` prop's `published` field:
```ts
    completedDate: string
    featured: boolean
    published: boolean
```
with:
```ts
    completedDate: string
    featured: boolean
    status: ContentStatus
```
and add the import:
```ts
import type { ContentStatus } from '@/types/status'
```

Replace the `formData` initial state:
```ts
    featured: project?.featured || false,
    published: project?.published || false,
```
with:
```ts
    featured: project?.featured || false,
    status: project?.status ?? 'draft' as ContentStatus,
```

Replace the submit body:
```ts
          featured: formData.featured,
          published: formData.published,
```
with:
```ts
          featured: formData.featured,
          status: formData.status,
```

Replace the whole `<div className="flex gap-4">...</div>` block that holds both the "Featured Project" and "Published" checkboxes:
```tsx
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, featured: checked as boolean })
                      }
                    />
                    <span className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Featured Project</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.published}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, published: checked as boolean })
                      }
                    />
                    <span className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Published</span>
                  </label>
                </div>
```
with:
```tsx
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.featured}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, featured: checked as boolean })
                    }
                  />
                  <span className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Featured Project</span>
                </label>

                <div>
                  <label className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                    className="mt-2 w-full px-3 py-2 rounded-lg text-fluid-sm outline-none"
                    style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
```
(The `Checkbox` import stays — it's still used by the "Featured Project" field.)

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors remaining in any of the 4 files touched by this task.

---

### Task 12: Project public page

**Files:**
- Modify: `app/(portfolio)/projects/[slug]/page.tsx:30,55`

**Interfaces:**
- Consumes: `Project.status` (Task 9).

- [ ] **Step 1: Update both `published` checks**

Replace:
```ts
  if (!project || !project.published) return { title: 'Project not found' }
```
with:
```ts
  if (!project || project.status !== 'active') return { title: 'Project not found' }
```

Replace:
```ts
  if (!project || !project.published) notFound()
```
with:
```ts
  if (!project || project.status !== 'active') notFound()
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors remaining in this file.

---

### Task 13: Historical one-off scripts (keep compiling, not re-run)

**Files:**
- Modify: `scripts/seed-portfolio.ts`
- Modify: `scripts/seed-services-taxonomy-2026-06.ts`

**Interfaces:**
- Consumes: `services.status`/`projects.status` columns (Task 1) — these scripts write directly via Drizzle's schema types, not through the entities.

- [ ] **Step 1: `scripts/seed-portfolio.ts`**

Find the project insert (around the `featured: true, published: true,` pair identified during exploration) and replace:
```ts
      featured: true,
      published: true,
```
with:
```ts
      featured: true,
      status: 'active',
```

- [ ] **Step 2: `scripts/seed-services-taxonomy-2026-06.ts`**

Find the service insert inside `upsertService()` and replace:
```ts
    published: false,
```
with:
```ts
    status: 'draft',
```
(Matches the historical intent — newly-seeded services started unpublished/draft until manually reviewed.)

- [ ] **Step 3: Verify TypeScript compiles project-wide**

Run: `npx tsc --noEmit`
Expected: exit code 0, no output.

---

### Task 14: Drop the legacy `published` columns

**Files:**
- Modify: `src/infrastructure/db/schema.ts` (remove both `published` fields)
- Create: a new file under `src/infrastructure/db/migrations/`

**Interfaces:**
- Consumes: confirmation that no code references `.published`/`published:` on `Service`/`Project` anymore.

- [ ] **Step 1: Confirm no remaining references**

Run: `grep -rn "published" --include="*.ts" --include="*.tsx" app src scripts`

Every hit must be either: (a) unrelated to Service/Project (e.g. `isPublished` on some other entity, if any), or (b) inside `src/infrastructure/db/schema.ts` on the column definitions being removed in Step 2. If any hit is a genuine leftover reference to `Service.published`/`Project.published`, fix it before continuing.

- [ ] **Step 2: Remove the `published` columns from the schema**

In `src/infrastructure/db/schema.ts`, delete `published: boolean('published').notNull().default(true),` from the `services` table, and delete `published: boolean('published').notNull().default(false),` from the `projects` table.

- [ ] **Step 3: Generate the drop migration**

Run: `npx drizzle-kit generate --name drop-service-project-published`
Expected: a migration with `ALTER TABLE "services" DROP COLUMN "published";` and `ALTER TABLE "projects" DROP COLUMN "published";`.

- [ ] **Step 4: Apply it to production**

Run: `npm run db:migrate`
Expected: exit code 0, migration listed as applied.

- [ ] **Step 5: Final full verification**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three succeed with no errors (`npm run build` should say `Compiled successfully`).

---

## Explicitly not done in this plan

- No `npm run seed` / `npm run seed:portfolio` execution — same reasoning as the Category plan: `seed:portfolio` would insert fake demo content into production.
- No `git commit` at any step.
- No Chrome DevTools MCP browser testing — verification is `tsc`/`lint`/`build` only.
- `SERVICE_ROOT_SLUGS` de-hardcoding stays deferred.
