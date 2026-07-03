# Project Grouping + Trash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/admin/projects` to match `/admin/services`'s grouped-by-category layout with thumbnails and drag-and-drop reordering (new `projects.orderIndex`), and add recoverable soft-delete (`trashedAt`, mirroring `leads.trashedAt`) with a Trash view to Categories, Services, and Projects.

**Architecture:** Single additive migration (no backfill needed). Every repository's listing methods gain an unconditional `trashedAt IS NULL` filter; a new `findTrashed()`/`trash()`/`restore()` trio is added to each. `DELETE` API routes switch from hard delete to `trash()`. `ProjectGroupedView.tsx` is built by copying `ServiceGroupedView.tsx`'s structure. Each entity gets its own small Trash view component (not one generic component — columns differ per entity).

**Tech Stack:** Next.js 15 App Router, Drizzle ORM (Postgres), sonner, native HTML5 drag-and-drop (already used by `ServiceGroupedView`).

## Global Constraints

- No `git commit` — user explicitly asked not to create commits this session.
- No Chrome DevTools MCP browser testing — verify via `npx tsc --noEmit` + `npm run lint` + `npm run build` only.
- DB changes go straight to production via `npm run db:migrate` (user has explicitly authorized this).
- Trashed items never appear in any normal listing (admin or public) — only in the dedicated Trash view.
- `findById`/`findBySlug` (single-item lookups) stay unfiltered by `trashedAt`; public detail pages add an explicit `|| x.trashedAt` check themselves.
- No "empty trash"/permanent-delete UI, no bulk restore — out of scope.
- `ProjectTable.tsx` is deleted, not kept as a fallback.

---

### Task 1: Schema — `trashedAt` (3 tables) + `projects.orderIndex`

**Files:**
- Modify: `src/infrastructure/db/schema.ts`

**Interfaces:**
- Produces: `categories.trashedAt`, `services.trashedAt`, `projects.trashedAt` (all `timestamp with timezone`, nullable, no default). `projects.orderIndex` (`integer`, NOT NULL, default `0`).

- [ ] **Step 1: Add `trashedAt` to `categories`**

Find (in the `categories` table definition):
```ts
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
Replace with:
```ts
    status: categoryStatusEnum('status').notNull().default('active'),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    trashedAt: timestamp('trashed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_categories_slug').on(table.slug),
    index('idx_categories_is_system').on(table.isSystem),
    index('idx_categories_parent_id').on(table.parentId),
    index('idx_categories_type').on(table.type),
    index('idx_categories_order').on(table.orderIndex),
    index('idx_categories_status').on(table.status),
    index('idx_categories_trashed_at').on(table.trashedAt),
  ],
)
```

- [ ] **Step 2: Add `trashedAt` + `orderIndex` to `projects`**

Find:
```ts
    coverPosterUrl: text('cover_poster_url'),
    galleryUrls: jsonb('gallery_urls').$type<GalleryItem[]>().notNull().default(sql`'[]'::jsonb`),
    descriptionVector: jsonb('description_vector').$type<number[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_projects_slug').on(table.slug),
    index('idx_projects_status').on(table.status),
    index('idx_projects_featured').on(table.featured),
    index('idx_projects_created_at').on(table.createdAt),
    index('idx_projects_category_id').on(table.categoryId),
  ],
)
```
Replace with:
```ts
    coverPosterUrl: text('cover_poster_url'),
    galleryUrls: jsonb('gallery_urls').$type<GalleryItem[]>().notNull().default(sql`'[]'::jsonb`),
    descriptionVector: jsonb('description_vector').$type<number[]>(),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    trashedAt: timestamp('trashed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_projects_slug').on(table.slug),
    index('idx_projects_status').on(table.status),
    index('idx_projects_featured').on(table.featured),
    index('idx_projects_created_at').on(table.createdAt),
    index('idx_projects_category_id').on(table.categoryId),
    index('idx_projects_order').on(table.orderIndex),
    index('idx_projects_trashed_at').on(table.trashedAt),
  ],
)
```

- [ ] **Step 3: Add `trashedAt` to `services`**

Find:
```ts
    status: serviceStatusEnum('status').notNull().default('active'),
    // Form Builder hook (Fase 6 - work order CRM en curso); se conecta cuando ese módulo esté listo, sin lógica todavía.
    requestFormId: uuid('request_form_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_services_order').on(table.orderIndex),
    index('idx_services_category_id').on(table.categoryId),
  ],
)
```
Replace with:
```ts
    status: serviceStatusEnum('status').notNull().default('active'),
    // Form Builder hook (Fase 6 - work order CRM en curso); se conecta cuando ese módulo esté listo, sin lógica todavía.
    requestFormId: uuid('request_form_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    trashedAt: timestamp('trashed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_services_order').on(table.orderIndex),
    index('idx_services_category_id').on(table.categoryId),
    index('idx_services_trashed_at').on(table.trashedAt),
  ],
)
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors (nothing reads the new columns yet).

---

### Task 2: Generate and apply the migration

**Files:**
- Create: a new file under `src/infrastructure/db/migrations/`

**Interfaces:**
- Consumes: schema from Task 1.
- Produces: production `categories`/`services`/`projects` tables have the new columns.

- [ ] **Step 1: Generate**

Run: `npx drizzle-kit generate --name add-trash-and-project-order`
Expected: a migration with 3x `ALTER TABLE ... ADD COLUMN "trashed_at" timestamp with time zone`, one `ALTER TABLE "projects" ADD COLUMN "order_index" integer DEFAULT 0 NOT NULL`, and 5 `CREATE INDEX` statements.

- [ ] **Step 2: Inspect before applying**

Read the generated file. Confirm it contains ONLY the statements described in Step 1 — no unrelated tables (mirroring the earlier `hero_config` surprise). If anything unrelated appears, remove it.

- [ ] **Step 3: Apply to production**

Run: `npm run db:migrate`
Expected: exit code 0, migration listed as applied.

- [ ] **Step 4: Spot-check**

Run a query equivalent to:
```sql
SELECT count(*) FILTER (WHERE trashed_at IS NOT NULL) AS trashed, count(*) AS total FROM categories;
SELECT count(*) FILTER (WHERE trashed_at IS NOT NULL) AS trashed, count(*) AS total FROM services;
SELECT count(*) FILTER (WHERE trashed_at IS NOT NULL) AS trashed, count(*) AS total FROM projects;
SELECT order_index FROM projects LIMIT 5;
```
Expected: `trashed = 0` everywhere (new column, nothing trashed yet), `order_index = 0` for all existing projects.

---

### Task 3: Entities — add `trashedAt` (+ `orderIndex` on Project)

**Files:**
- Modify: `src/core/entities/Category.ts`
- Modify: `src/core/entities/Service.ts`
- Modify: `src/core/entities/Project.ts`

**Interfaces:**
- Produces: `Category.trashedAt: Date | null`, `Service.trashedAt: Date | null`, `Project.trashedAt: Date | null`, `Project.orderIndex: number`.

- [ ] **Step 1: `Category.ts`**

Add `trashedAt: Date | null` as a `readonly` field (after `updatedAt`), to the constructor prop type, and to `reconstruct()`'s prop type. In `create()`, add `trashedAt: null,`. In `withUpdates()`, add `trashedAt: this.trashedAt,` (trashing/restoring never goes through `withUpdates` — it's a dedicated repository method — so this just carries the current value forward unchanged).

Concretely, in the private constructor's prop object type and the class body, add:
```ts
  readonly trashedAt: Date | null
```
right after `readonly updatedAt: Date`. In the constructor body add `this.trashedAt = props.trashedAt` right after `this.updatedAt = props.updatedAt`. In `create()`'s returned object add `trashedAt: null,` right after `updatedAt: now,`. In `withUpdates()`'s returned object add `trashedAt: this.trashedAt,` right after `updatedAt: new Date(),`. In `reconstruct()`'s prop type and pass-through, add `trashedAt: Date | null` — since `reconstruct` just forwards `props` to the constructor via `new Category(props)`, and the constructor prop type will already require `trashedAt`, no other change is needed in `reconstruct()` beyond widening its parameter type to include `trashedAt: Date | null`.

- [ ] **Step 2: `Service.ts`**

Same shape as Step 1: add `readonly trashedAt: Date | null` field, constructor prop, `create()` sets `trashedAt: null`, `reconstruct()`'s prop type gains `trashedAt: Date | null`. `Service` has no `withUpdates()` (updates go through `Service.reconstruct()` directly in the API route), so nothing else changes there — just make sure `withOrder()`'s returned object also carries `trashedAt: this.trashedAt,` forward.

- [ ] **Step 3: `Project.ts`**

Same shape, plus `orderIndex`. Add `readonly trashedAt: Date | null` and `readonly orderIndex: number` fields, constructor props, and to `reconstruct()`'s prop type. In `create()`, add `orderIndex: 0,` and `trashedAt: null,`. In `withPublishedStatus()` and `withFeaturedStatus()`, carry both forward: add `orderIndex: this.orderIndex,` and `trashedAt: this.trashedAt,` to each returned object.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: errors appear at every repository/route that constructs these entities without the new fields — fixed in Tasks 4-6.

---

### Task 4: Repositories — trash/restore/findTrashed + Project ordering

**Files:**
- Modify: `src/core/repositories/ICategoryRepository.ts`
- Modify: `src/infrastructure/repositories/DrizzleCategoryRepository.ts` (full file)
- Modify: `src/infrastructure/repositories/DrizzleServiceRepository.ts` (full file)
- Modify: `src/infrastructure/repositories/DrizzleProjectRepository.ts` (full file)

**Interfaces:**
- Produces: `findTrashed()`, `trash(id)`, `restore(id)` on all three repositories (Category's variant takes an optional `type` like `findFlat` does). `DrizzleProjectRepository.updateOrder(updates: Array<{ id: string; orderIndex: number }>)`. `DrizzleProjectRepository.findPublished()` now orders by `asc(orderIndex)` instead of `desc(createdAt)`.

- [ ] **Step 1: `ICategoryRepository.ts`**

```ts
import { Category } from '../entities/Category'
import type { FlatCategory, CategoryType, ReorderItem } from '@/types/category'

export interface ICategoryRepository {
  findAll(type?: CategoryType, activeOnly?: boolean): Promise<Category[]>
  findFlat(type: CategoryType, activeOnly?: boolean): Promise<FlatCategory[]>
  findTrashed(type?: CategoryType): Promise<Category[]>
  findById(id: string): Promise<Category | null>
  findBySlug(slug: string, type?: CategoryType): Promise<Category | null>
  save(category: Category): Promise<void>
  update(category: Category): Promise<void>
  reorder(updates: ReorderItem[]): Promise<void>
  trash(id: string): Promise<void>
  restore(id: string): Promise<void>
  delete(id: string): Promise<void>
}
```

- [ ] **Step 2: Rewrite `DrizzleCategoryRepository.ts`**

```ts
import { eq, asc, and, or, isNull, isNotNull } from 'drizzle-orm'
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
    trashedAt: row.trashedAt,
  })
}

export class DrizzleCategoryRepository implements ICategoryRepository {
  async findAll(type?: CategoryType, activeOnly: boolean = true): Promise<Category[]> {
    const typeCondition = type
      ? type === 'shared'
        ? eq(categories.type, 'shared')
        : or(eq(categories.type, type), eq(categories.type, 'shared'))
      : undefined
    const conditions = [
      typeCondition,
      isNull(categories.trashedAt),
      activeOnly ? eq(categories.status, 'active') : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined)

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.orderIndex), asc(categories.name))
    return rows.map(mapToEntity)
  }

  async findFlat(type: CategoryType, activeOnly: boolean = true): Promise<FlatCategory[]> {
    const typeCondition = type === 'shared'
      ? eq(categories.type, 'shared')
      : or(eq(categories.type, type), eq(categories.type, 'shared'))
    const conditions = [
      typeCondition,
      isNull(categories.trashedAt),
      activeOnly ? eq(categories.status, 'active') : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined)

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.orderIndex), asc(categories.name))
    return rows.map(mapToFlat)
  }

  async findTrashed(type?: CategoryType): Promise<Category[]> {
    const typeCondition = type
      ? type === 'shared'
        ? eq(categories.type, 'shared')
        : or(eq(categories.type, type), eq(categories.type, 'shared'))
      : undefined
    const conditions = [typeCondition, isNotNull(categories.trashedAt)]
      .filter((c): c is NonNullable<typeof c> => c !== undefined)

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.name))
    return rows.map(mapToEntity)
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async findBySlug(slug: string, type?: CategoryType): Promise<Category | null> {
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

  async trash(id: string): Promise<void> {
    await db.update(categories).set({ trashedAt: new Date() }).where(eq(categories.id, id))
  }

  async restore(id: string): Promise<void> {
    await db.update(categories).set({ trashedAt: null }).where(eq(categories.id, id))
  }

  async delete(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id))
  }
}
```

- [ ] **Step 3: Rewrite `DrizzleServiceRepository.ts`**

```ts
import { eq, asc, and, isNull, isNotNull } from 'drizzle-orm'
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
      .where(isNull(services.trashedAt))
      .orderBy(asc(services.orderIndex))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToService(row))
  }

  async findPublished(): Promise<Service[]> {
    const rows = await db
      .select()
      .from(services)
      .where(and(eq(services.status, 'active'), isNull(services.trashedAt)))
      .orderBy(asc(services.orderIndex))

    return rows.map((row) => this.mapRowToService(row))
  }

  async findTrashed(): Promise<Service[]> {
    const rows = await db
      .select()
      .from(services)
      .where(isNotNull(services.trashedAt))
      .orderBy(asc(services.name))

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

  async trash(id: string): Promise<void> {
    await db.update(services).set({ trashedAt: new Date() }).where(eq(services.id, id))
  }

  async restore(id: string): Promise<void> {
    await db.update(services).set({ trashedAt: null }).where(eq(services.id, id))
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
      trashedAt: (row.trashedAt as Date | null) ?? null,
    })
  }
}
```

- [ ] **Step 4: Rewrite `DrizzleProjectRepository.ts`**

```ts
import { eq, asc, and, isNull, isNotNull } from 'drizzle-orm'
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
        orderIndex: project.orderIndex,
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
      .where(isNull(projects.trashedAt))
      .orderBy(asc(projects.orderIndex))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findPublished(limit = 100, offset = 0): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.status, 'active'), isNull(projects.trashedAt)))
      .orderBy(asc(projects.orderIndex))
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findFeatured(): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.status, 'active'), eq(projects.featured, true), isNull(projects.trashedAt)))
      .orderBy(asc(projects.orderIndex))

    return rows.map((row) => this.mapRowToProject(row))
  }

  async findTrashed(): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(isNotNull(projects.trashedAt))
      .orderBy(asc(projects.title))

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

  async updateOrder(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    for (const { id, orderIndex } of updates) {
      await db
        .update(projects)
        .set({ orderIndex, updatedAt: new Date() })
        .where(eq(projects.id, id))
    }
  }

  async trash(id: string): Promise<void> {
    await db.update(projects).set({ trashedAt: new Date() }).where(eq(projects.id, id))
  }

  async restore(id: string): Promise<void> {
    await db.update(projects).set({ trashedAt: null }).where(eq(projects.id, id))
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
      orderIndex: row.orderIndex as number,
      coverImageUrl: row.coverImageUrl as string,
      coverPosterUrl: (row.coverPosterUrl as string | null) ?? null,
      galleryItems: normaliseGalleryRow(row.galleryUrls),
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      trashedAt: (row.trashedAt as Date | null) ?? null,
    })
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: errors remain only in the `Project.create()`/API-route call sites not yet updated for `orderIndex` (none — `Project.create()` sets it internally) and in the API routes/pages that still call `.delete()` expecting hard-delete behavior (those are updated in Task 5, not a compile error — `.delete()` still exists). No compile errors should remain from this task alone.

---

### Task 5: API routes — trash instead of delete, new restore + reorder endpoints

**Files:**
- Modify: `app/api/admin/categories/[id]/route.ts` (DELETE handler)
- Create: `app/api/admin/categories/[id]/restore/route.ts`
- Modify: `app/api/admin/services/[id]/route.ts` (DELETE handler)
- Create: `app/api/admin/services/[id]/restore/route.ts`
- Modify: `app/api/admin/projects/[id]/route.ts` (DELETE handler)
- Create: `app/api/admin/projects/[id]/restore/route.ts`
- Modify: `app/api/admin/projects/route.ts` (add `PATCH`)

**Interfaces:**
- Consumes: `repo.trash(id)`, `repo.restore(id)`, `repo.updateOrder(updates)` (Task 4).

- [ ] **Step 1: `app/api/admin/categories/[id]/route.ts` — DELETE**

Replace:
```ts
    if (category.isSystem) {
      return Response.json({ error: 'Cannot delete system category' }, { status: 403 })
    }

    await repo.delete(id)
    return Response.json({ success: true })
```
with:
```ts
    if (category.isSystem) {
      return Response.json({ error: 'Cannot delete system category' }, { status: 403 })
    }

    await repo.trash(id)
    return Response.json({ success: true })
```

- [ ] **Step 2: Create `app/api/admin/categories/[id]/restore/route.ts`**

```ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const repo = new DrizzleCategoryRepository()
    await repo.restore(id)
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: `app/api/admin/services/[id]/route.ts` — DELETE**

Replace:
```ts
    const { id } = await params
    const serviceRepo = new DrizzleServiceRepository()
    await serviceRepo.delete(id)

    return Response.json({ success: true })
```
with:
```ts
    const { id } = await params
    const serviceRepo = new DrizzleServiceRepository()
    await serviceRepo.trash(id)

    return Response.json({ success: true })
```

- [ ] **Step 4: Create `app/api/admin/services/[id]/restore/route.ts`**

```ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const serviceRepo = new DrizzleServiceRepository()
    await serviceRepo.restore(id)
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: `app/api/admin/projects/[id]/route.ts` — DELETE**

Replace:
```ts
    const { id } = await params
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    await projectRepo.delete(id)

    return Response.json({ success: true })
```
with:
```ts
    const { id } = await params
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    await projectRepo.trash(id)

    return Response.json({ success: true })
```

- [ ] **Step 6: Create `app/api/admin/projects/[id]/restore/route.ts`**

```ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectRepo = new DrizzleProjectRepository()
    await projectRepo.restore(id)
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 7: Add `PATCH` (bulk reorder) to `app/api/admin/projects/route.ts`**

Add this function to the file (after the existing `GET`, before `POST` — order doesn't matter functionally, but keep the file's existing `GET`/`POST` untouched):
```ts
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body

    const projectRepo = new DrizzleProjectRepository()
    await projectRepo.updateOrder(updates)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors in any of the 7 files touched by this task.

---

### Task 6: Public pages — 404 on trashed items

**Files:**
- Modify: `app/(portfolio)/services/[category]/[item]/page.tsx`
- Modify: `app/(portfolio)/services/[category]/page.tsx`
- Modify: `app/(portfolio)/projects/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Service.trashedAt`, `Project.trashedAt`, `Category.trashedAt` (Task 3).

- [ ] **Step 1: `[category]/[item]/page.tsx`**

Replace:
```ts
  if (!root || root.status !== 'active') return null
```
with:
```ts
  if (!root || root.status !== 'active' || root.trashedAt) return null
```
Replace:
```ts
  if (!service || service.status !== 'active') return null
```
with:
```ts
  if (!service || service.status !== 'active' || service.trashedAt) return null
```

- [ ] **Step 2: `[category]/page.tsx`**

Replace:
```ts
      if (!root || root.status !== 'active') {
```
with:
```ts
      if (!root || root.status !== 'active' || root.trashedAt) {
```

- [ ] **Step 3: `projects/[slug]/page.tsx`**

Replace:
```ts
  if (!project || project.status !== 'active') return { title: 'Project not found' }
```
with:
```ts
  if (!project || project.status !== 'active' || project.trashedAt) return { title: 'Project not found' }
```
Replace:
```ts
  if (!project || project.status !== 'active') notFound()
```
with:
```ts
  if (!project || project.status !== 'active' || project.trashedAt) notFound()
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors in any of the 3 files.

---

### Task 7: `ProjectGroupedView.tsx` + rewire `/admin/projects` + delete `ProjectTable.tsx`

**Files:**
- Create: `src/presentation/components/admin/ProjectGroupedView.tsx`
- Modify: `app/admin/(protected)/projects/page.tsx` (full file)
- Delete: `src/presentation/components/admin/ProjectTable.tsx`

**Interfaces:**
- Consumes: `StatusMenu` (existing, `@/presentation/components/admin/StatusMenu`), `ContentStatus` (`@/types/status`), `PATCH /api/admin/projects` bulk reorder (Task 5), `DELETE /api/admin/projects/[id]` (now trashes, Task 5).
- Produces: `ProjectGroup`/`ProjectGroupItem` types, consumed only by `app/admin/(protected)/projects/page.tsx`.

- [ ] **Step 1: Create `ProjectGroupedView.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Trash2, GripVertical, Pencil } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { StatusMenu } from './StatusMenu'
import type { ContentStatus } from '@/types/status'

export interface ProjectGroupItem {
  id: string
  title: string
  slug: string
  orderIndex: number
  status: ContentStatus
  featured: boolean
  coverImageUrl: string
  categoryId: string | null
}

export interface ProjectGroup {
  categoryId: string | null
  categoryName: string
  projects: ProjectGroupItem[]
}

interface ProjectGroupedViewProps {
  groups: ProjectGroup[]
}

function CategorySection({ group }: { group: ProjectGroup }) {
  const router = useRouter()
  const [items, setItems] = useState(group.projects)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const initialOrder = group.projects.map((p) => p.id)
  const hasChanges = items.some((p, i) => p.id !== initialOrder[i])

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

    const from = items.findIndex((p) => p.id === draggedId)
    const to = items.findIndex((p) => p.id === targetId)
    const next = [...items]
    next.splice(to, 0, next.splice(from, 1)[0])
    next.forEach((p, i) => { p.orderIndex = i })
    setItems(next)
    setDraggedId(null)
  }

  const handleSaveOrder = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: items.map((p) => ({ id: p.id, orderIndex: p.orderIndex })) }),
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
    if (!confirm('Move this project to trash?')) return
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setItems((prev) => prev.filter((p) => p.id !== id))
      toast.success('Project moved to trash')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    const previous = items
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
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
          href={group.categoryId ? `/admin/projects/new?categoryId=${group.categoryId}` : '/admin/projects/new'}
          className="px-4 py-2 rounded-lg text-fluid-xs font-semibold inline-flex items-center gap-1 transition-all duration-150"
          style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
        >
          + Add project
        </Link>
      </div>

      <div
        className="rounded-lg overflow-hidden bg-white"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 1px 4px rgba(45,41,36,0.05)' }}
      >
        {items.length === 0 ? (
          <div className="py-10 text-center text-fluid-sm" style={{ color: '#9C8F83' }}>
            No projects in this category yet.
          </div>
        ) : (
          <ul>
            {items.map((proj, idx) => (
              <li
                key={proj.id}
                draggable
                onDragStart={(e) => handleDragStart(e, proj.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, proj.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-move"
                style={{
                  borderBottom: idx < items.length - 1 ? '1px solid #F5EFE8' : 'none',
                  opacity: draggedId === proj.id ? 0.4 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFAF8' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: '#C5BDB5' }} />

                {proj.coverImageUrl ? (
                  <img
                    src={proj.coverImageUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                    style={{ border: '1px solid #E5DDD0' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: '#E2C063', fontSize: '1rem', fontWeight: 700 }}
                  >
                    {proj.title.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-fluid-sm font-medium truncate" style={{ color: '#2D2924' }}>{proj.title}</p>
                </div>

                {proj.featured && (
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A08040' }}
                  >
                    Featured
                  </span>
                )}

                <StatusMenu status={proj.status} onChange={(status) => handleStatusChange(proj.id, status)} />

                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                  >
                    <Link href={`/admin/projects/${proj.id}/edit`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
                    style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                    onClick={() => handleDelete(proj.id)}
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

export function ProjectGroupedView({ groups }: ProjectGroupedViewProps) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <CategorySection key={group.categoryId ?? 'uncategorized'} group={group} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `app/admin/(protected)/projects/page.tsx`**

```tsx
import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { ProjectGroupedView } from '@/presentation/components/admin/ProjectGroupedView'
import type { ProjectGroup } from '@/presentation/components/admin/ProjectGroupedView'
import { ProjectsTrashView } from '@/presentation/components/admin/ProjectsTrashView'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string }>
}) {
  const { trash } = await searchParams
  const isTrash = trash === '1'

  const projectRepo = new DrizzleProjectRepository()
  const categoryRepo = new DrizzleCategoryRepository()

  const [allProjects, flatCats] = await Promise.all([
    isTrash ? projectRepo.findTrashed() : projectRepo.findAll(200),
    // Include inactive categories so projects linked to a category the
    // taxonomy migration deactivates still resolve a label here.
    categoryRepo.findFlat('shared', false),
  ])

  const catMap = new Map(flatCats.map((c) => [c.id, c.name]))

  if (isTrash) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-fluid-3xl font-bold">Projects Trash</h1>
            <p className="text-muted-foreground">Trashed projects — restore them to bring them back.</p>
          </div>
          <Link href="/admin/projects" className="text-fluid-sm underline" style={{ color: 'var(--contigo-primary)' }}>
            Back to list
          </Link>
        </div>
        <ProjectsTrashView
          projects={allProjects.map((p) => ({
            id: p.id,
            title: p.title,
            coverImageUrl: p.coverImageUrl,
            category: p.categoryId ? (catMap.get(p.categoryId) ?? p.category) : p.category,
          }))}
        />
      </div>
    )
  }

  const byCategory = new Map<string | null, typeof allProjects>()
  for (const p of allProjects) {
    const key = p.categoryId
    byCategory.set(key, [...(byCategory.get(key) ?? []), p])
  }

  const groups: ProjectGroup[] = flatCats
    .filter((c) => byCategory.has(c.id))
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      projects: (byCategory.get(cat.id) ?? [])
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          orderIndex: p.orderIndex,
          status: p.status,
          featured: p.featured,
          coverImageUrl: p.coverImageUrl,
          categoryId: p.categoryId,
        })),
    }))

  const uncategorized = byCategory.get(null) ?? []
  if (uncategorized.length > 0) {
    groups.push({
      categoryId: null,
      categoryName: 'Uncategorized',
      projects: uncategorized
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          orderIndex: p.orderIndex,
          status: p.status,
          featured: p.featured,
          coverImageUrl: p.coverImageUrl,
          categoryId: p.categoryId,
        })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-fluid-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your portfolio projects · drag rows to reorder</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/projects?trash=1" className="text-fluid-sm underline" style={{ color: '#6B6560' }}>
            View Trash
          </Link>
          <Button asChild>
            <Link href="/admin/projects/new">New Project</Link>
          </Button>
        </div>
      </div>

      <ProjectGroupedView groups={groups} />
    </div>
  )
}
```

- [ ] **Step 3: Delete `ProjectTable.tsx`**

Run: `rm src/presentation/components/admin/ProjectTable.tsx`

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: errors only for the missing `ProjectsTrashView` import (created in Task 9) — everything else in this task's files must be clean. If any other error appears, fix it before moving on.

---

### Task 8: "Uncategorized" bucket fix for Services

**Files:**
- Modify: `app/admin/(protected)/services/page.tsx` (full file)
- Modify: `src/presentation/components/admin/ServiceGroupedView.tsx:25-27` (the `ServiceGroup` interface + the "+ Add service" link)

**Interfaces:**
- Consumes: nothing new. Produces: `ServiceGroup.categoryId: string | null` (widened from `string`).

- [ ] **Step 1: Widen `ServiceGroup.categoryId` and the "+ Add service" link**

In `ServiceGroupedView.tsx`, replace:
```ts
export interface ServiceGroup {
  categoryId: string
  categoryName: string
  categorySlug: string
  services: ServiceGroupItem[]
}
```
with:
```ts
export interface ServiceGroup {
  categoryId: string | null
  categoryName: string
  categorySlug: string
  services: ServiceGroupItem[]
}
```

Replace:
```tsx
        <Link
          href={`/admin/services/new?categoryId=${group.categoryId}`}
          className="px-4 py-2 rounded-lg text-fluid-xs font-semibold inline-flex items-center gap-1 transition-all duration-150"
          style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
        >
          + Add service
        </Link>
```
with:
```tsx
        <Link
          href={group.categoryId ? `/admin/services/new?categoryId=${group.categoryId}` : '/admin/services/new'}
          className="px-4 py-2 rounded-lg text-fluid-xs font-semibold inline-flex items-center gap-1 transition-all duration-150"
          style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
        >
          + Add service
        </Link>
```

Also update `CategorySection`'s `key` prop in `ServiceGroupedView`'s default export (the outer `.map`) from `key={group.categoryId}` to `key={group.categoryId ?? 'uncategorized'}` — find:
```tsx
      {groups.map((group) => (
        <CategorySection key={group.categoryId} group={group} />
      ))}
```
replace with:
```tsx
      {groups.map((group) => (
        <CategorySection key={group.categoryId ?? 'uncategorized'} group={group} />
      ))}
```

- [ ] **Step 2: Rewrite `app/admin/(protected)/services/page.tsx`**

```tsx
import Link from 'next/link'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { ServiceGroupedView } from '@/presentation/components/admin/ServiceGroupedView'
import type { ServiceGroup } from '@/presentation/components/admin/ServiceGroupedView'
import { ServicesTrashView } from '@/presentation/components/admin/ServicesTrashView'

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string }>
}) {
  const { trash } = await searchParams
  const isTrash = trash === '1'

  const serviceRepo = new DrizzleServiceRepository()
  const categoryRepo = new DrizzleCategoryRepository()

  const [categories, services] = await Promise.all([
    categoryRepo.findAll('shared', true),
    isTrash ? serviceRepo.findTrashed() : serviceRepo.findAll(200),
  ])

  if (isTrash) {
    const catMap = new Map(categories.map((c) => [c.id, c.name]))
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Services Trash
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Trashed services — restore them to bring them back.{' '}
            <Link href="/admin/services" className="underline" style={{ color: 'var(--contigo-primary)' }}>
              Back to list
            </Link>
          </p>
        </div>
        <ServicesTrashView
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            imageUrl: s.imageUrl,
            category: s.categoryId ? (catMap.get(s.categoryId) ?? '—') : '—',
          }))}
        />
      </div>
    )
  }

  const groups: ServiceGroup[] = categories
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      categorySlug: cat.slug,
      services: services
        .filter((s) => s.categoryId === cat.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s) => ({
          id: s.id,
          name: s.name,
          shortDescription: s.shortDescription,
          orderIndex: s.orderIndex,
          status: s.status,
          imageUrl: s.imageUrl,
          categoryId: s.categoryId,
        })),
    }))

  const uncategorized = services.filter((s) => s.categoryId === null)
  if (uncategorized.length > 0) {
    groups.push({
      categoryId: null,
      categoryName: 'Uncategorized',
      categorySlug: 'uncategorized',
      services: uncategorized
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s) => ({
          id: s.id,
          name: s.name,
          shortDescription: s.shortDescription,
          orderIndex: s.orderIndex,
          status: s.status,
          imageUrl: s.imageUrl,
          categoryId: s.categoryId,
        })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Services
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Manage services grouped by category · drag rows to reorder
          </p>
        </div>
        <Link href="/admin/services?trash=1" className="text-fluid-sm underline" style={{ color: '#6B6560' }}>
          View Trash
        </Link>
      </div>

      <ServiceGroupedView groups={groups} />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: errors only for the missing `ServicesTrashView` import (created in Task 9).

---

### Task 9: Trash view components + wire Categories trash

**Files:**
- Create: `src/presentation/components/admin/CategoriesTrashView.tsx`
- Create: `src/presentation/components/admin/ServicesTrashView.tsx`
- Create: `src/presentation/components/admin/ProjectsTrashView.tsx`
- Modify: `app/admin/(protected)/categories/page.tsx` (full file)

**Interfaces:**
- Consumes: `POST /api/admin/{categories,services,projects}/[id]/restore` (Task 5).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: `CategoriesTrashView.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'

interface CategoriesTrashViewProps {
  categories: Array<{ id: string; name: string; slug: string }>
}

export function CategoriesTrashView({ categories }: CategoriesTrashViewProps) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const restore = async (id: string) => {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/admin/categories/${id}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore')
      toast.success('Category restored')
      router.refresh()
    } catch {
      toast.error('Could not restore category')
    } finally {
      setRestoringId(null)
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
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Name</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Slug</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                Trash is empty
              </TableCell>
            </TableRow>
          ) : (
            categories.map((cat) => (
              <TableRow key={cat.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{cat.name}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm font-mono" style={{ color: '#6B6560' }}>{cat.slug}</TableCell>
                <TableCell className="py-3.5">
                  <Button size="sm" variant="outline" disabled={restoringId === cat.id} onClick={() => restore(cat.id)}>
                    Restore
                  </Button>
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

- [ ] **Step 2: `ServicesTrashView.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'

interface ServicesTrashViewProps {
  services: Array<{ id: string; name: string; imageUrl: string; category: string }>
}

export function ServicesTrashView({ services }: ServicesTrashViewProps) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const restore = async (id: string) => {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/admin/services/${id}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore')
      toast.success('Service restored')
      router.refresh()
    } catch {
      toast.error('Could not restore service')
    } finally {
      setRestoringId(null)
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
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Name</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Category</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                Trash is empty
              </TableCell>
            </TableRow>
          ) : (
            services.map((svc) => (
              <TableRow key={svc.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                <TableCell className="py-3.5">
                  {svc.imageUrl ? (
                    <img src={svc.imageUrl} alt="" className="w-10 h-10 rounded object-cover" style={{ border: '1px solid #E5DDD0' }} />
                  ) : (
                    <div className="w-10 h-10 rounded" style={{ backgroundColor: 'rgba(226,192,99,0.12)' }} />
                  )}
                </TableCell>
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{svc.name}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{svc.category}</TableCell>
                <TableCell className="py-3.5">
                  <Button size="sm" variant="outline" disabled={restoringId === svc.id} onClick={() => restore(svc.id)}>
                    Restore
                  </Button>
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

- [ ] **Step 3: `ProjectsTrashView.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'

interface ProjectsTrashViewProps {
  projects: Array<{ id: string; title: string; coverImageUrl: string; category: string }>
}

export function ProjectsTrashView({ projects }: ProjectsTrashViewProps) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const restore = async (id: string) => {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/admin/projects/${id}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore')
      toast.success('Project restored')
      router.refresh()
    } catch {
      toast.error('Could not restore project')
    } finally {
      setRestoringId(null)
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
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Title</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Category</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                Trash is empty
              </TableCell>
            </TableRow>
          ) : (
            projects.map((proj) => (
              <TableRow key={proj.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                <TableCell className="py-3.5">
                  {proj.coverImageUrl ? (
                    <img src={proj.coverImageUrl} alt="" className="w-10 h-10 rounded object-cover" style={{ border: '1px solid #E5DDD0' }} />
                  ) : (
                    <div className="w-10 h-10 rounded" style={{ backgroundColor: 'rgba(226,192,99,0.12)' }} />
                  )}
                </TableCell>
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{proj.title}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{proj.category}</TableCell>
                <TableCell className="py-3.5">
                  <Button size="sm" variant="outline" disabled={restoringId === proj.id} onClick={() => restore(proj.id)}>
                    Restore
                  </Button>
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

- [ ] **Step 4: Wire Categories trash into `app/admin/(protected)/categories/page.tsx`**

```tsx
import Link from 'next/link'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { CategoryManagerClient } from '@/presentation/components/admin/CategoryManagerClient'
import { CategoriesTrashView } from '@/presentation/components/admin/CategoriesTrashView'

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string }>
}) {
  const { trash } = await searchParams
  const isTrash = trash === '1'

  const repo = new DrizzleCategoryRepository()

  if (isTrash) {
    const trashed = await repo.findTrashed('shared')
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Categories Trash
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Trashed categories — restore them to bring them back.{' '}
            <Link href="/admin/categories" className="underline" style={{ color: 'var(--contigo-primary)' }}>
              Back to list
            </Link>
          </p>
        </div>
        <CategoriesTrashView
          categories={trashed.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        />
      </div>
    )
  }

  const categories = await repo.findAll('shared', false)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Categories
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Main categories shared across services and projects
          </p>
        </div>
        <Link href="/admin/categories?trash=1" className="text-fluid-sm underline" style={{ color: '#6B6560' }}>
          View Trash
        </Link>
      </div>

      <CategoryManagerClient categories={flat} />
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles project-wide**

Run: `npx tsc --noEmit`
Expected: exit code 0, no output.

---

### Task 10: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm no stale references to the deleted `ProjectTable`**

Run: `grep -rn "ProjectTable" app src`
Expected: zero matches (component and all its usages were removed in Task 7).

- [ ] **Step 2: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three succeed; `npm run build` prints `Compiled successfully` and statically regenerates `/services/[category]`, `/services/[category]/[item]`, and `/projects/[slug]` against production data (same as previous sessions' builds).

---

## Explicitly not done in this plan

- No `npm run seed` / `npm run seed:portfolio` execution (same reasoning as prior plans this session).
- No `git commit`.
- No Chrome DevTools MCP browser testing.
- No "empty trash" / permanent delete, no bulk restore, no trash retention policy.
- `SERVICE_ROOT_SLUGS` de-hardcoding stays deferred (unrelated, separate project from earlier today).
