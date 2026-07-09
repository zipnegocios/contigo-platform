# Flexible Legal Document Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin fully control a legal document's version number, effective date, and status (draft/in_review/published/archived) by hand, edit any document in place regardless of status (with a confirmation when it's currently published), duplicate a document into a fresh draft version, and move documents to a trash before permanent deletion — plus collapse the footer's legal links into a single discreet dropdown.

**Architecture:** Removes the immutability guards from the existing Compliance & Legal module (`docs/09-Compliance-y-Legal.md`) built in the prior session. `version`/`effectiveDate`/`status` become plain editable fields; the only remaining automatic behavior is what happens when a document's status becomes `published` (anchor-requirement check, content hash, auto-archive of sibling published rows, `security_events` log) — everything else is a direct, unguarded update. Trash follows the exact pattern already used by `categories`/`leads` in this repo (`trashedAt` column, restore, permanent delete with a type-to-confirm dialog).

**Tech Stack:** Next.js 15 App Router, Drizzle ORM/Postgres, Zod, shadcn/ui (`Select`, `Dialog`, `AlertDialog`, `DropdownMenu`, `Table`), sonner toasts. No test runner in this repo — verification is `npm run build` after each task plus one end-to-end manual script (mirroring the approach already used for this module) run once at the end.

## Global Constraints

- No automated test runner exists in this repo (vitest/jest) — do not add one. Verify with `npm run build` (0 TypeScript errors) after every task, and the manual verification script in Task 8.
- Follow the existing trash pattern exactly: `trashedAt: timestamp('trashed_at', { withTimezone: true })`, `trash()`/`restore()` set/clear it, permanent delete is a real `DELETE`, gated on the row already being trashed.
- `legal.manage` remains the only permission gating every legal-document action (list/create/edit/trash/restore/permanent-delete). Setting status to `published` additionally requires the caller's role to be `owner` (unchanged from before — this repo has no separate `admin` role, only `owner`/`staff`).
- The unique index `idx_legal_slug_version` on `(slug, version)` stays as-is — a manual version-number collision for the same slug must surface as a clear error, not corrupt data.
- All UI copy in English (this is the app's language); commit messages and code comments in English; you may narrate your work to the user in Spanish per this project's convention, but that has no bearing on any file this plan touches.

---

### Task 1: Schema — `trashedAt` column and migration

**Files:**
- Modify: `src/infrastructure/db/schema.ts:779-802` (the `legalDocuments` table definition)
- Create: a new timestamped migration under `src/infrastructure/db/migrations/` (generated, not hand-written)

**Interfaces:**
- Produces: `legalDocuments.trashedAt` column (nullable timestamp), consumed by every later task's repository/query changes.

- [ ] **Step 1: Add the column and index**

In `src/infrastructure/db/schema.ts`, find the `legalDocuments` table (starts at the `export const legalDocuments = pgTable(` line). Change:

```typescript
    reviewNote: text('review_note'), // e.g. "Approved by [consultant] 2026-07-20"
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_legal_slug_version').on(table.slug, table.version),
    index('idx_legal_slug_status').on(table.slug, table.status),
  ],
)
```

to:

```typescript
    reviewNote: text('review_note'), // e.g. "Approved by [consultant] 2026-07-20"
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    trashedAt: timestamp('trashed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('idx_legal_slug_version').on(table.slug, table.version),
    index('idx_legal_slug_status').on(table.slug, table.status),
    index('idx_legal_trashed_at').on(table.trashedAt),
  ],
)
```

- [ ] **Step 2: Generate the migration**

Run: `npx drizzle-kit generate`
Expected: a new file `src/infrastructure/db/migrations/<timestamp>_<name>.sql` containing `ALTER TABLE "legal_documents" ADD COLUMN "trashed_at" timestamp with time zone;` and `CREATE INDEX "idx_legal_trashed_at" ...`.

- [ ] **Step 3: Apply the migration**

Run: `npm run db:migrate`
Expected: `migrations applied successfully!` with no errors.

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: compiles with 0 TypeScript errors (schema-only change, nothing consumes `trashedAt` yet).

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/db/schema.ts src/infrastructure/db/migrations/
git commit -m "feat: add trashedAt column to legal_documents"
```

---

### Task 2: Entity — remove immutability guards, add trash/restore

**Files:**
- Modify: `src/core/entities/LegalDocument.ts` (full rewrite)

**Interfaces:**
- Consumes: nothing new.
- Produces: `LegalDocument.withEdits(partial)` now accepts `version`, `effectiveDate`, `status`, `reviewNote` in addition to `title`/`content`, with **no thrown errors regardless of current status**. `LegalDocument.publish(params)` keeps computing `contentHash`/`publishedAt` but is callable from any status. New `document.trash()` / `document.restore()` returning a new `LegalDocument` with `trashedAt` set/cleared. New `trashedAt: Date | null` field on every instance. `LegalDocumentNotEditableError` and `LegalDocumentNotPublishableError` are **removed** — later tasks must stop importing them.

- [ ] **Step 1: Replace the file**

Replace the full contents of `src/core/entities/LegalDocument.ts` with:

```typescript
export type LegalDocumentStatus = 'draft' | 'in_review' | 'published' | 'archived'
export type LegalDomain = 'website' | 'service' | 'general'

export interface CreateLegalDocumentDraftInput {
  slug: string
  domain: LegalDomain
  title: string
  content: string
  version: number
  effectiveDate?: Date | null
  createdBy: string | null
}

export interface LegalDocumentEdits {
  title?: string
  content?: string
  version?: number
  effectiveDate?: Date | null
  status?: LegalDocumentStatus
  reviewNote?: string | null
}

export class LegalDocument {
  readonly id: string
  readonly slug: string
  readonly domain: LegalDomain
  readonly title: string
  readonly content: string
  readonly contentHash: string | null
  readonly version: number
  readonly status: LegalDocumentStatus
  readonly effectiveDate: Date | null
  readonly publishedAt: Date | null
  readonly publishedBy: string | null
  readonly createdBy: string | null
  readonly reviewNote: string | null
  readonly trashedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    slug: string
    domain: LegalDomain
    title: string
    content: string
    contentHash: string | null
    version: number
    status: LegalDocumentStatus
    effectiveDate: Date | null
    publishedAt: Date | null
    publishedBy: string | null
    createdBy: string | null
    reviewNote: string | null
    trashedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.slug = props.slug
    this.domain = props.domain
    this.title = props.title
    this.content = props.content
    this.contentHash = props.contentHash
    this.version = props.version
    this.status = props.status
    this.effectiveDate = props.effectiveDate
    this.publishedAt = props.publishedAt
    this.publishedBy = props.publishedBy
    this.createdBy = props.createdBy
    this.reviewNote = props.reviewNote
    this.trashedAt = props.trashedAt
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static createDraft(input: CreateLegalDocumentDraftInput): LegalDocument {
    const now = new Date()
    return new LegalDocument({
      id: crypto.randomUUID(),
      slug: input.slug,
      domain: input.domain,
      title: input.title.trim(),
      content: input.content,
      contentHash: null,
      version: input.version,
      status: 'draft',
      effectiveDate: input.effectiveDate ?? null,
      publishedAt: null,
      publishedBy: null,
      createdBy: input.createdBy,
      reviewNote: null,
      trashedAt: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Every field is admin-controlled and editable regardless of the document's
  // current status — there is no pipeline guard left. The confirmation shown
  // when editing a currently-published document lives in the admin UI, not here.
  withEdits(partial: LegalDocumentEdits): LegalDocument {
    return new LegalDocument({
      ...this,
      title: partial.title !== undefined ? partial.title.trim() : this.title,
      content: partial.content !== undefined ? partial.content : this.content,
      version: partial.version !== undefined ? partial.version : this.version,
      effectiveDate: partial.effectiveDate !== undefined ? partial.effectiveDate : this.effectiveDate,
      status: partial.status !== undefined ? partial.status : this.status,
      reviewNote: partial.reviewNote !== undefined ? partial.reviewNote : this.reviewNote,
      updatedAt: new Date(),
    })
  }

  // The one transition that still carries automatic side effects: computes
  // the content hash and the publishedAt timestamp used for the
  // legal_document_published security-event audit trail. Callable from any
  // status — the anchor-requirement check and the "archive sibling published
  // rows" step live in the use case / repository, not here.
  publish(params: { contentHash: string; publishedBy: string; reviewNote?: string | null }): LegalDocument {
    const now = new Date()
    return new LegalDocument({
      ...this,
      status: 'published',
      contentHash: params.contentHash,
      publishedAt: now,
      publishedBy: params.publishedBy,
      reviewNote: params.reviewNote !== undefined ? params.reviewNote : this.reviewNote,
      updatedAt: now,
    })
  }

  trash(): LegalDocument {
    return new LegalDocument({ ...this, trashedAt: new Date(), updatedAt: new Date() })
  }

  restore(): LegalDocument {
    return new LegalDocument({ ...this, trashedAt: null, updatedAt: new Date() })
  }

  static reconstruct(props: {
    id: string
    slug: string
    domain: LegalDomain
    title: string
    content: string
    contentHash: string | null
    version: number
    status: LegalDocumentStatus
    effectiveDate: Date | null
    publishedAt: Date | null
    publishedBy: string | null
    createdBy: string | null
    reviewNote: string | null
    trashedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): LegalDocument {
    return new LegalDocument(props)
  }
}
```

- [ ] **Step 2: Build check (expect errors — this is fine)**

Run: `npm run build`
Expected: TypeScript errors in every file that still imports `LegalDocumentNotEditableError`/`LegalDocumentNotPublishableError` or calls the removed `submitForReview`/`archive` methods (`DrizzleLegalDocumentRepository.ts`, `SubmitForReviewUseCase.ts`, `PublishLegalDocumentUseCase.ts`, and the two now-deleted-in-Task-5 API routes). This is expected — Task 3 and Task 4 fix the repository and use cases; do not treat these as a blocker for this task, just confirm the entity file itself has no syntax errors by checking the error list only mentions the *other* files, not `LegalDocument.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/core/entities/LegalDocument.ts
git commit -m "feat: remove immutability guards from LegalDocument entity, add trash/restore"
```

---

### Task 3: Repository — drop the update guard, add trash queries

**Files:**
- Modify: `src/core/repositories/ILegalDocumentRepository.ts` (full rewrite)
- Modify: `src/infrastructure/repositories/DrizzleLegalDocumentRepository.ts` (full rewrite)

**Interfaces:**
- Consumes: `LegalDocument.reconstruct()`, `.trash()`, `.restore()` from Task 2.
- Produces: `ILegalDocumentRepository.trash(id)`, `.restore(id)`, `.delete(id)`, `.listTrashed()` — new methods later tasks' use cases call. `update()` no longer throws. `getPublished()`/`listPublished()`/`listCurrent()` exclude trashed rows; `findById()`, `listVersions()`, `getVersionEffectiveAt()`, `getMaxVersion()` do **not** filter trashed rows (a trashed document is still part of its own history/audit trail until permanently deleted).

- [ ] **Step 1: Replace the interface**

Replace the full contents of `src/core/repositories/ILegalDocumentRepository.ts` with:

```typescript
import { LegalDocument } from '../entities/LegalDocument'

export interface ILegalDocumentRepository {
  // Not filtered by trashedAt — used by trash/restore/permanent-delete flows
  // and the editor page, which must be able to open a trashed document too.
  findById(id: string): Promise<LegalDocument | null>
  // Currently live version for public rendering. Excludes trashed rows.
  getPublished(slug: string): Promise<LegalDocument | null>
  // Version that was in effect at a given point in time (temporal lookup —
  // e.g. "what did the Privacy Policy say on the date this quote was sent").
  // Not filtered by trashedAt: historical accuracy over current visibility.
  getVersionEffectiveAt(slug: string, date: Date): Promise<LegalDocument | null>
  // Latest version per slug, excluding trashed rows (admin listing).
  listCurrent(): Promise<LegalDocument[]>
  // Only slugs with a live published version, excluding trashed rows —
  // feeds the /legal index and the footer.
  listPublished(): Promise<LegalDocument[]>
  // Full version history for a slug. Not filtered by trashedAt.
  listVersions(slug: string): Promise<LegalDocument[]>
  // Every trashed document, most recently trashed first.
  listTrashed(): Promise<LegalDocument[]>
  // Highest version number recorded for a slug (including trashed rows, so a
  // new draft never collides with a trashed one), or 0 if none exists yet.
  getMaxVersion(slug: string): Promise<number>
  // Inserts a new draft row. Never used for existing rows.
  save(document: LegalDocument): Promise<void>
  // Plain UPDATE — no guard. Every editable column, including status.
  update(document: LegalDocument): Promise<void>
  // Transactional: sets this row to published, archives the slug's other
  // currently-published row (if any). Callable regardless of prior status.
  publish(document: LegalDocument): Promise<void>
  trash(id: string): Promise<void>
  restore(id: string): Promise<void>
  // Hard delete. Caller (use case) is responsible for only allowing this on
  // an already-trashed row.
  delete(id: string): Promise<void>
}
```

- [ ] **Step 2: Replace the Drizzle implementation**

Replace the full contents of `src/infrastructure/repositories/DrizzleLegalDocumentRepository.ts` with:

```typescript
import { eq, and, or, lte, desc, max, ne, isNull, isNotNull } from 'drizzle-orm'
import { db } from '../db/client'
import { legalDocuments } from '../db/schema'
import { LegalDocument } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

type LegalDocumentRow = typeof legalDocuments.$inferSelect

function mapToEntity(row: LegalDocumentRow): LegalDocument {
  return LegalDocument.reconstruct({
    id: row.id,
    slug: row.slug,
    domain: row.domain,
    title: row.title,
    content: row.content,
    contentHash: row.contentHash ?? null,
    version: row.version,
    status: row.status,
    effectiveDate: row.effectiveDate ?? null,
    publishedAt: row.publishedAt ?? null,
    publishedBy: row.publishedBy ?? null,
    createdBy: row.createdBy ?? null,
    reviewNote: row.reviewNote ?? null,
    trashedAt: row.trashedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class DrizzleLegalDocumentRepository implements ILegalDocumentRepository {
  async findById(id: string): Promise<LegalDocument | null> {
    const rows = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async getPublished(slug: string): Promise<LegalDocument | null> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .where(
        and(
          eq(legalDocuments.slug, slug),
          eq(legalDocuments.status, 'published'),
          isNull(legalDocuments.trashedAt),
        ),
      )
      .limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async getVersionEffectiveAt(slug: string, date: Date): Promise<LegalDocument | null> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .where(
        and(
          eq(legalDocuments.slug, slug),
          or(eq(legalDocuments.status, 'published'), eq(legalDocuments.status, 'archived')),
          lte(legalDocuments.effectiveDate, date),
        ),
      )
      .orderBy(desc(legalDocuments.effectiveDate))
      .limit(1)
    return rows.length ? mapToEntity(rows[0]) : null
  }

  async listCurrent(): Promise<LegalDocument[]> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .where(isNull(legalDocuments.trashedAt))
      .orderBy(desc(legalDocuments.version))
    // Highest version per slug, kept in a Map to preserve first-seen (highest) row.
    const bySlug = new Map<string, LegalDocumentRow>()
    for (const row of rows) {
      if (!bySlug.has(row.slug)) bySlug.set(row.slug, row)
    }
    return Array.from(bySlug.values()).map(mapToEntity)
  }

  async listPublished(): Promise<LegalDocument[]> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .where(and(eq(legalDocuments.status, 'published'), isNull(legalDocuments.trashedAt)))
      .orderBy(legalDocuments.slug)
    return rows.map(mapToEntity)
  }

  async listVersions(slug: string): Promise<LegalDocument[]> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .where(eq(legalDocuments.slug, slug))
      .orderBy(desc(legalDocuments.version))
    return rows.map(mapToEntity)
  }

  async listTrashed(): Promise<LegalDocument[]> {
    const rows = await db
      .select()
      .from(legalDocuments)
      .where(isNotNull(legalDocuments.trashedAt))
      .orderBy(desc(legalDocuments.updatedAt))
    return rows.map(mapToEntity)
  }

  async getMaxVersion(slug: string): Promise<number> {
    const rows = await db
      .select({ maxVersion: max(legalDocuments.version) })
      .from(legalDocuments)
      .where(eq(legalDocuments.slug, slug))
    return rows[0]?.maxVersion ?? 0
  }

  async save(document: LegalDocument): Promise<void> {
    await db.insert(legalDocuments).values({
      id: document.id,
      slug: document.slug,
      domain: document.domain,
      title: document.title,
      content: document.content,
      contentHash: document.contentHash,
      version: document.version,
      status: document.status,
      effectiveDate: document.effectiveDate,
      publishedAt: document.publishedAt,
      publishedBy: document.publishedBy,
      createdBy: document.createdBy,
      reviewNote: document.reviewNote,
      trashedAt: document.trashedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    })
  }

  async update(document: LegalDocument): Promise<void> {
    await db
      .update(legalDocuments)
      .set({
        title: document.title,
        content: document.content,
        version: document.version,
        status: document.status,
        effectiveDate: document.effectiveDate,
        reviewNote: document.reviewNote,
        updatedAt: document.updatedAt,
      })
      .where(eq(legalDocuments.id, document.id))
  }

  async publish(document: LegalDocument): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(legalDocuments)
        .set({
          status: 'published',
          contentHash: document.contentHash,
          publishedAt: document.publishedAt,
          publishedBy: document.publishedBy,
          effectiveDate: document.effectiveDate,
          reviewNote: document.reviewNote,
          updatedAt: document.updatedAt,
        })
        .where(eq(legalDocuments.id, document.id))

      await tx
        .update(legalDocuments)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(
          and(
            eq(legalDocuments.slug, document.slug),
            eq(legalDocuments.status, 'published'),
            ne(legalDocuments.id, document.id),
          ),
        )
    })
  }

  async trash(id: string): Promise<void> {
    await db.update(legalDocuments).set({ trashedAt: new Date(), updatedAt: new Date() }).where(eq(legalDocuments.id, id))
  }

  async restore(id: string): Promise<void> {
    await db.update(legalDocuments).set({ trashedAt: null, updatedAt: new Date() }).where(eq(legalDocuments.id, id))
  }

  async delete(id: string): Promise<void> {
    await db.delete(legalDocuments).where(eq(legalDocuments.id, id))
  }
}
```

- [ ] **Step 3: Build check (fewer errors than Task 2, but not zero yet)**

Run: `npm run build`
Expected: remaining errors only in `SubmitForReviewUseCase.ts`, `PublishLegalDocumentUseCase.ts`, and the two use cases/routes that reference the now-removed `getMaxVersion`-based auto-increment call signature (`SaveLegalDocumentDraftUseCase.ts` calling `LegalDocument.createDraft` without `version`) — all fixed in Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/core/repositories/ILegalDocumentRepository.ts src/infrastructure/repositories/DrizzleLegalDocumentRepository.ts
git commit -m "feat: drop update guard on legal documents, add trash/restore/delete queries"
```

---

### Task 4: Use cases — manual version/date, free status changes, duplicate, trash

**Files:**
- Modify: `src/application/use-cases/legal/SaveLegalDocumentDraftUseCase.ts`
- Modify: `src/application/use-cases/legal/ListLegalDocumentsUseCase.ts`
- Delete: `src/application/use-cases/legal/SubmitForReviewUseCase.ts`
- Delete: `src/application/use-cases/legal/PublishLegalDocumentUseCase.ts`
- Create: `src/application/use-cases/legal/SetLegalDocumentStatusUseCase.ts`
- Create: `src/application/use-cases/legal/DuplicateLegalDocumentUseCase.ts`
- Create: `src/application/use-cases/legal/TrashLegalDocumentUseCase.ts`
- Create: `src/application/use-cases/legal/RestoreLegalDocumentUseCase.ts`
- Create: `src/application/use-cases/legal/DeleteLegalDocumentPermanentlyUseCase.ts`

**Interfaces:**
- Consumes: `ILegalDocumentRepository` (Task 3), `LegalDocument.createDraft/withEdits/publish/trash/restore` (Task 2), `ISecurityEventLogger` (existing, unchanged), `extractHeadingIds`/`findMissingAnchors` (existing, unchanged).
- Produces: `SaveLegalDocumentDraftUseCase.execute(input)` now requires `input.version: number`. `SaveLegalDocumentDraftUseCase.suggestNextVersion(slug)` for the admin UI to pre-fill a default. `executeEdit(id, partial)` accepts `LegalDocumentEdits`. `SetLegalDocumentStatusUseCase.execute(id, targetStatus, actorId, reviewNote?)` returns `{ document, softWarnings }`, throws `MissingRequiredAnchorsError` only when `targetStatus === 'published'` and a required active anchor is missing. `ListLegalDocumentsUseCase.trashed()`. `DuplicateLegalDocumentUseCase.execute(sourceId, createdBy)`. `TrashLegalDocumentUseCase.execute(id)`, `RestoreLegalDocumentUseCase.execute(id)`, `DeleteLegalDocumentPermanentlyUseCase.execute(id)` (throws if the document isn't trashed).

- [ ] **Step 1: Rewrite `SaveLegalDocumentDraftUseCase.ts`**

Replace its full contents with:

```typescript
import { LegalDocument, type LegalDomain, type LegalDocumentEdits } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export interface SaveLegalDocumentDraftInput {
  slug: string
  domain: LegalDomain
  title: string
  content: string
  version: number
  effectiveDate?: Date | null
  createdBy: string | null
}

export class SaveLegalDocumentDraftUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  // Suggests the next version number for a slug so the admin UI can
  // pre-fill the "New document" / "Duplicate" form — the admin can still
  // override it before saving.
  async suggestNextVersion(slug: string): Promise<number> {
    return (await this.legalDocumentRepository.getMaxVersion(slug)) + 1
  }

  // Always creates a new row. Version and effective date are whatever the
  // caller passes — no longer auto-computed.
  async execute(input: SaveLegalDocumentDraftInput): Promise<LegalDocument> {
    const draft = LegalDocument.createDraft({
      slug: input.slug,
      domain: input.domain,
      title: input.title,
      content: input.content,
      version: input.version,
      effectiveDate: input.effectiveDate,
      createdBy: input.createdBy,
    })
    await this.legalDocumentRepository.save(draft)
    return draft
  }

  // Edits an existing row in place. No status/field restrictions — the
  // repository's update() is unguarded.
  async executeEdit(id: string, partial: LegalDocumentEdits): Promise<LegalDocument> {
    const existing = await this.legalDocumentRepository.findById(id)
    if (!existing) throw new Error(`Legal document ${id} not found`)
    const updated = existing.withEdits(partial)
    await this.legalDocumentRepository.update(updated)
    return updated
  }
}
```

- [ ] **Step 2: Add `trashed()` to `ListLegalDocumentsUseCase.ts`**

In `src/application/use-cases/legal/ListLegalDocumentsUseCase.ts`, change:

```typescript
  async versions(slug: string): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.versions(slug)
  }
}
```

Wait — check the actual method name first (`listVersions` on the repository, `versions` on the use case). The current file reads:

```typescript
  async versions(slug: string): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.listVersions(slug)
  }
}
```

Change it to:

```typescript
  async versions(slug: string): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.listVersions(slug)
  }

  async trashed(): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.listTrashed()
  }
}
```

- [ ] **Step 3: Delete the two guarded use cases**

```bash
rm src/application/use-cases/legal/SubmitForReviewUseCase.ts
rm src/application/use-cases/legal/PublishLegalDocumentUseCase.ts
```

- [ ] **Step 4: Create `SetLegalDocumentStatusUseCase.ts`**

```typescript
import { createHash } from 'crypto'
import { LegalDocument, type LegalDocumentStatus } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'
import type { ISecurityEventLogger } from '@/core/services/ISecurityEventLogger'
import { extractHeadingIds } from '@/infrastructure/markdown/legal-markdown'
import { findMissingAnchors, type MissingAnchor } from '@/core/config/legal-requirements'

export class MissingRequiredAnchorsError extends Error {
  constructor(
    public readonly slug: string,
    public readonly missing: MissingAnchor[],
  ) {
    super(`Cannot publish "${slug}": missing required anchors ${missing.map((m) => m.anchorId).join(', ')}`)
    this.name = 'MissingRequiredAnchorsError'
  }
}

export interface SetLegalDocumentStatusResult {
  document: LegalDocument
  softWarnings: MissingAnchor[]
}

export class SetLegalDocumentStatusUseCase {
  constructor(
    private legalDocumentRepository: ILegalDocumentRepository,
    private securityEventLogger: ISecurityEventLogger,
  ) {}

  // Any target status is allowed. Only 'published' carries the automatic
  // side effects: active-anchor check (blocking), content hash, archiving
  // any other currently-published row for the same slug, and the
  // legal_document_published security event.
  async execute(
    id: string,
    targetStatus: LegalDocumentStatus,
    actorId: string,
    reviewNote?: string | null,
  ): Promise<SetLegalDocumentStatusResult> {
    const existing = await this.legalDocumentRepository.findById(id)
    if (!existing) throw new Error(`Legal document ${id} not found`)

    if (targetStatus !== 'published') {
      const updated = existing.withEdits({ status: targetStatus, reviewNote })
      await this.legalDocumentRepository.update(updated)
      return { document: updated, softWarnings: [] }
    }

    const anchors = extractHeadingIds(existing.content)
    const missingActive = findMissingAnchors(existing.slug, anchors, { activeOnly: true })
    if (missingActive.length > 0) {
      throw new MissingRequiredAnchorsError(existing.slug, missingActive)
    }
    const softWarnings = findMissingAnchors(existing.slug, anchors, { activeOnly: false })

    const contentHash = createHash('sha256').update(existing.content).digest('hex')
    const published = existing.publish({ contentHash, publishedBy: actorId, reviewNote })
    await this.legalDocumentRepository.publish(published)

    await this.securityEventLogger.log({
      eventType: 'legal_document_published',
      payload: { slug: published.slug, version: published.version, hash: contentHash },
      actorId,
    })

    return { document: published, softWarnings }
  }
}
```

- [ ] **Step 5: Create `DuplicateLegalDocumentUseCase.ts`**

```typescript
import { LegalDocument } from '@/core/entities/LegalDocument'
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export class DuplicateLegalDocumentUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  // Copies slug/domain/title/content into a fresh draft row (new id). The
  // source row is untouched regardless of its status. Version/effective
  // date are pre-filled with a sensible suggestion but are ordinary
  // editable fields on the resulting draft, same as any other document.
  async execute(sourceId: string, createdBy: string | null): Promise<LegalDocument> {
    const source = await this.legalDocumentRepository.findById(sourceId)
    if (!source) throw new Error(`Legal document ${sourceId} not found`)

    const nextVersion = (await this.legalDocumentRepository.getMaxVersion(source.slug)) + 1
    const copy = LegalDocument.createDraft({
      slug: source.slug,
      domain: source.domain,
      title: source.title,
      content: source.content,
      version: nextVersion,
      effectiveDate: new Date(),
      createdBy,
    })
    await this.legalDocumentRepository.save(copy)
    return copy
  }
}
```

- [ ] **Step 6: Create `TrashLegalDocumentUseCase.ts`**

```typescript
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export class TrashLegalDocumentUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  async execute(id: string): Promise<void> {
    await this.legalDocumentRepository.trash(id)
  }
}
```

- [ ] **Step 7: Create `RestoreLegalDocumentUseCase.ts`**

```typescript
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export class RestoreLegalDocumentUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  async execute(id: string): Promise<void> {
    await this.legalDocumentRepository.restore(id)
  }
}
```

- [ ] **Step 8: Create `DeleteLegalDocumentPermanentlyUseCase.ts`**

```typescript
import type { ILegalDocumentRepository } from '@/core/repositories/ILegalDocumentRepository'

export class DeleteLegalDocumentPermanentlyUseCase {
  constructor(private legalDocumentRepository: ILegalDocumentRepository) {}

  async execute(id: string): Promise<void> {
    const document = await this.legalDocumentRepository.findById(id)
    if (!document) throw new Error(`Legal document ${id} not found`)
    if (!document.trashedAt) throw new Error('Only trashed documents can be permanently deleted')
    await this.legalDocumentRepository.delete(id)
  }
}
```

- [ ] **Step 9: Build check**

Run: `npm run build`
Expected: remaining errors only in `app/api/admin/legal/**` (the routes still reference the deleted use cases/error classes) — fixed in Task 5.

- [ ] **Step 10: Commit**

```bash
git add src/application/use-cases/legal/
git commit -m "feat: replace guarded publish/submit-review use cases with free status changes, add duplicate/trash/restore/delete use cases"
```

---

### Task 5: API routes — manual fields, unified status endpoint, duplicate/trash/restore/delete

**Files:**
- Modify: `app/api/admin/legal/route.ts`
- Modify: `app/api/admin/legal/[id]/route.ts`
- Delete: `app/api/admin/legal/[id]/publish/route.ts` (and the now-empty `publish/` directory)
- Delete: `app/api/admin/legal/[id]/submit-review/route.ts` (and the now-empty `submit-review/` directory)
- Create: `app/api/admin/legal/[id]/duplicate/route.ts`
- Create: `app/api/admin/legal/[id]/trash/route.ts`
- Create: `app/api/admin/legal/[id]/restore/route.ts`

**Interfaces:**
- Consumes: all five use cases from Task 4, `serializeLegalDocument` (unchanged, `app/api/admin/legal/serialize.ts`).
- Produces: `GET /api/admin/legal?trash=1` lists trashed documents. `POST /api/admin/legal` requires `version` in the body. `PATCH /api/admin/legal/[id]` accepts `{ title?, content?, version?, effectiveDate?, status?, reviewNote? }` — setting `status: 'published'` requires the caller to be `owner` and runs the anchor/hash/archive/audit side effects; any other status change only requires `legal.manage`. `DELETE /api/admin/legal/[id]` hard-deletes (409 if not trashed). `POST /api/admin/legal/[id]/duplicate`, `/trash`, `/restore`.

- [ ] **Step 1: Rewrite `app/api/admin/legal/route.ts`**

Replace its full contents with:

```typescript
import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import { SaveLegalDocumentDraftUseCase } from '@/application/use-cases/legal/SaveLegalDocumentDraftUseCase'
import { LEGAL_ANCHOR_REQUIREMENTS } from '@/core/config/legal-requirements'
import { extractHeadingIds } from '@/infrastructure/markdown/legal-markdown'
import { serializeLegalDocument } from './serialize'

const CreateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  domain: z.enum(['website', 'service', 'general']),
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(50000),
  version: z.number().int().positive(),
  effectiveDate: z.string().datetime().nullable().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const isTrash = searchParams.get('trash') === '1'

    const repository = new DrizzleLegalDocumentRepository()
    const useCase = new ListLegalDocumentsUseCase(repository)
    const documents = isTrash ? await useCase.trashed() : await useCase.execute()

    return Response.json({
      documents: documents.map((doc) => {
        const anchors = extractHeadingIds(doc.content)
        const requirements = LEGAL_ANCHOR_REQUIREMENTS[doc.slug] ?? []
        const missingRequiredAnchors = requirements
          .filter((r) => !anchors.includes(r.anchorId))
          .map((r) => ({ anchorId: r.anchorId, requiredBy: r.requiredBy, active: r.active }))
        return { ...serializeLegalDocument(doc), missingRequiredAnchors }
      }),
    })
  } catch (error) {
    console.error('Error listing legal documents:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const input = CreateSchema.parse(body)

    const repository = new DrizzleLegalDocumentRepository()
    const document = await new SaveLegalDocumentDraftUseCase(repository).execute({
      slug: input.slug,
      domain: input.domain,
      title: input.title,
      content: input.content,
      version: input.version,
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
      createdBy: userId,
    })

    return Response.json({ document: serializeLegalDocument(document) }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error creating legal document draft:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Rewrite `app/api/admin/legal/[id]/route.ts`**

Replace its full contents with:

```typescript
import { z } from 'zod'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { DrizzleSecurityEventLogger } from '@/infrastructure/services/DrizzleSecurityEventLogger'
import { SaveLegalDocumentDraftUseCase } from '@/application/use-cases/legal/SaveLegalDocumentDraftUseCase'
import {
  SetLegalDocumentStatusUseCase,
  MissingRequiredAnchorsError,
} from '@/application/use-cases/legal/SetLegalDocumentStatusUseCase'
import { DeleteLegalDocumentPermanentlyUseCase } from '@/application/use-cases/legal/DeleteLegalDocumentPermanentlyUseCase'
import { serializeLegalDocument } from '../serialize'

const UpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(50000).optional(),
  version: z.number().int().positive().optional(),
  effectiveDate: z.string().datetime().nullable().optional(),
  status: z.enum(['draft', 'in_review', 'published', 'archived']).optional(),
  reviewNote: z.string().max(2000).nullable().optional(),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const document = await new DrizzleLegalDocumentRepository().findById(id)
    if (!document) return Response.json({ error: 'Not found' }, { status: 404 })

    return Response.json({ document: serializeLegalDocument(document) })
  } catch (error) {
    console.error('Error fetching legal document:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    const role = (session.user as any)?.role
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const input = UpdateSchema.parse(body)

    const repository = new DrizzleLegalDocumentRepository()

    // Persist any non-publish field edits first (title/content/version/
    // effectiveDate, and status/reviewNote when the target status isn't
    // 'published' — that transition is handled separately below since it
    // carries anchor validation, hash computation, and the audit event).
    const hasFieldEdits =
      input.title !== undefined ||
      input.content !== undefined ||
      input.version !== undefined ||
      input.effectiveDate !== undefined ||
      (input.status !== undefined && input.status !== 'published') ||
      (input.reviewNote !== undefined && input.status !== 'published')

    let document = await repository.findById(id)
    if (!document) return Response.json({ error: 'Not found' }, { status: 404 })

    if (hasFieldEdits) {
      document = await new SaveLegalDocumentDraftUseCase(repository).executeEdit(id, {
        title: input.title,
        content: input.content,
        version: input.version,
        effectiveDate:
          input.effectiveDate === undefined ? undefined : input.effectiveDate ? new Date(input.effectiveDate) : null,
        status: input.status !== 'published' ? input.status : undefined,
        reviewNote: input.status !== 'published' ? input.reviewNote : undefined,
      })
    }

    if (input.status === 'published') {
      if (role !== 'owner') {
        return Response.json({ error: 'Only owners can publish legal documents' }, { status: 403 })
      }
      const { document: published, softWarnings } = await new SetLegalDocumentStatusUseCase(
        repository,
        new DrizzleSecurityEventLogger(),
      ).execute(id, 'published', userId, input.reviewNote)
      return Response.json({ document: serializeLegalDocument(published), softWarnings })
    }

    return Response.json({ document: serializeLegalDocument(document) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    if (error instanceof MissingRequiredAnchorsError) {
      return Response.json({ error: error.message, missing: error.missing }, { status: 422 })
    }
    console.error('Error updating legal document:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const repository = new DrizzleLegalDocumentRepository()
    await new DeleteLegalDocumentPermanentlyUseCase(repository).execute(id)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Only trashed documents can be permanently deleted') {
      return Response.json({ error: error.message }, { status: 409 })
    }
    console.error('Error deleting legal document:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Remove the two guarded routes**

```bash
rm -rf "app/api/admin/legal/[id]/publish"
rm -rf "app/api/admin/legal/[id]/submit-review"
```

- [ ] **Step 4: Create `app/api/admin/legal/[id]/duplicate/route.ts`**

```typescript
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { DuplicateLegalDocumentUseCase } from '@/application/use-cases/legal/DuplicateLegalDocumentUseCase'
import { serializeLegalDocument } from '../../serialize'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const repository = new DrizzleLegalDocumentRepository()
    const copy = await new DuplicateLegalDocumentUseCase(repository).execute(id, userId)

    return Response.json({ document: serializeLegalDocument(copy) }, { status: 201 })
  } catch (error) {
    console.error('Error duplicating legal document:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Create `app/api/admin/legal/[id]/trash/route.ts`**

```typescript
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { TrashLegalDocumentUseCase } from '@/application/use-cases/legal/TrashLegalDocumentUseCase'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await new TrashLegalDocumentUseCase(new DrizzleLegalDocumentRepository()).execute(id)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error trashing legal document:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Create `app/api/admin/legal/[id]/restore/route.ts`**

```typescript
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { RestoreLegalDocumentUseCase } from '@/application/use-cases/legal/RestoreLegalDocumentUseCase'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'legal.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await new RestoreLegalDocumentUseCase(new DrizzleLegalDocumentRepository()).execute(id)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error restoring legal document:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: 0 TypeScript errors (the API layer was the last consumer of the removed guard classes).

- [ ] **Step 8: Commit**

```bash
git add app/api/admin/legal/
git commit -m "feat: unify legal document status changes into PATCH, add duplicate/trash/restore/delete endpoints"
```

---

### Task 6: Admin UI — editable version/date/status, duplicate, trash view

**Files:**
- Modify: `app/admin/(protected)/legal/page.tsx`
- Modify: `src/presentation/components/admin/legal/LegalDocumentManagerClient.tsx`
- Modify: `src/presentation/components/admin/legal/LegalDocumentEditorClient.tsx` (full rewrite)
- Create: `src/presentation/components/admin/legal/LegalDocumentsTrashView.tsx`

**Interfaces:**
- Consumes: `GET/POST/PATCH/DELETE /api/admin/legal[...]`, `POST .../duplicate`, `POST .../trash`, `POST .../restore` (Task 5).
- Produces: no new exports consumed elsewhere — this is the leaf UI layer.

- [ ] **Step 1: Add trash view wiring to `app/admin/(protected)/legal/page.tsx`**

Replace its full contents with:

```typescript
import Link from 'next/link'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import { LEGAL_ANCHOR_REQUIREMENTS } from '@/core/config/legal-requirements'
import { extractHeadingIds } from '@/infrastructure/markdown/legal-markdown'
import { LegalDocumentManagerClient } from '@/presentation/components/admin/legal/LegalDocumentManagerClient'
import { LegalDocumentsTrashView } from '@/presentation/components/admin/legal/LegalDocumentsTrashView'

export default async function LegalDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string }>
}) {
  const { trash } = await searchParams
  const isTrash = trash === '1'

  const repository = new DrizzleLegalDocumentRepository()
  const useCase = new ListLegalDocumentsUseCase(repository)

  if (isTrash) {
    const trashed = await useCase.trashed()
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Legal Documents Trash
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Trashed documents — restore them or delete them forever.{' '}
            <Link href="/admin/legal" className="underline" style={{ color: 'var(--contigo-primary)' }}>
              Back to list
            </Link>
          </p>
        </div>
        <LegalDocumentsTrashView
          documents={trashed.map((doc) => ({ id: doc.id, title: doc.title, slug: doc.slug, version: doc.version }))}
        />
      </div>
    )
  }

  const documents = await useCase.execute()

  const rows = documents.map((doc) => {
    const anchors = extractHeadingIds(doc.content)
    const requirements = LEGAL_ANCHOR_REQUIREMENTS[doc.slug] ?? []
    const missingActive = requirements.filter((r) => r.active && !anchors.includes(r.anchorId))
    const missingInactive = requirements.filter((r) => !r.active && !anchors.includes(r.anchorId))

    return {
      id: doc.id,
      slug: doc.slug,
      domain: doc.domain,
      title: doc.title,
      version: doc.version,
      status: doc.status,
      effectiveDate: doc.effectiveDate?.toISOString() ?? null,
      anchorsOk: missingActive.length === 0,
      hasSoftWarnings: missingInactive.length > 0,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Legal Documents
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Version, effective date, and status are set by you — nothing here is computed automatically except the
            audit trail recorded when a document is published.
          </p>
        </div>
        <Link href="/admin/legal?trash=1" className="text-fluid-sm underline" style={{ color: '#6B6560' }}>
          View Trash
        </Link>
      </div>

      <LegalDocumentManagerClient documents={rows} />
    </div>
  )
}
```

- [ ] **Step 2: Add version/effective-date inputs to the "New document" dialog in `LegalDocumentManagerClient.tsx`**

In `src/presentation/components/admin/legal/LegalDocumentManagerClient.tsx`, change the state declarations:

```typescript
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState<LegalDomain>('website')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
```

to:

```typescript
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState<LegalDomain>('website')
  const [content, setContent] = useState('')
  const [version, setVersion] = useState('1')
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
```

Change the `handleCreate` body from:

```typescript
        body: JSON.stringify({ slug, domain, title: title.trim(), content }),
```

to:

```typescript
        body: JSON.stringify({
          slug,
          domain,
          title: title.trim(),
          content,
          version: Number(version),
          effectiveDate: effectiveDate ? new Date(effectiveDate).toISOString() : null,
        }),
```

Add version/effective-date fields to the dialog form. Change:

```typescript
            <div className="space-y-1.5">
              <Label htmlFor="legal-content">Content (Markdown)</Label>
```

to:

```typescript
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="legal-version">Version</Label>
                <Input
                  id="legal-version"
                  type="number"
                  min={1}
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legal-effective-date">Effective date</Label>
                <Input
                  id="legal-effective-date"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legal-content">Content (Markdown)</Label>
```

- [ ] **Step 3: Full rewrite of `LegalDocumentEditorClient.tsx`**

Replace its full contents with:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/presentation/components/ui/dialog'
import { legalMarkdownRemarkPlugins, legalMarkdownRehypePlugins } from '@/infrastructure/markdown/legal-markdown'

type LegalStatus = 'draft' | 'in_review' | 'published' | 'archived'

interface DocumentData {
  id: string
  slug: string
  domain: 'website' | 'service' | 'general'
  title: string
  content: string
  version: number
  status: LegalStatus
  effectiveDate: string | null
  reviewNote: string | null
  contentHash: string | null
}

interface RequirementRow {
  anchorId: string
  requiredBy: string
  active: boolean
  present: boolean
}

interface VersionRow {
  id: string
  version: number
  status: LegalStatus
  contentHash: string | null
  publishedAt: string | null
  publishedByName: string | null
}

const STATUS_OPTIONS: LegalStatus[] = ['draft', 'in_review', 'published', 'archived']

function diffSummary(oldText: string, newText: string): { added: number; removed: number } {
  const oldLines = new Set(oldText.split('\n').map((l) => l.trim()).filter(Boolean))
  const newLines = newText.split('\n').map((l) => l.trim()).filter(Boolean)
  const newSet = new Set(newLines)
  let added = 0
  for (const line of newSet) if (!oldLines.has(line)) added++
  let removed = 0
  for (const line of oldLines) if (!newSet.has(line)) removed++
  return { added, removed }
}

export function LegalDocumentEditorClient({
  document,
  previousPublishedContent,
  requirements,
  versions,
}: {
  document: DocumentData
  previousPublishedContent: string | null
  requirements: RequirementRow[]
  versions: VersionRow[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState(document.title)
  const [content, setContent] = useState(document.content)
  const [version, setVersion] = useState(String(document.version))
  const [effectiveDate, setEffectiveDate] = useState(document.effectiveDate ? document.effectiveDate.slice(0, 10) : '')
  const [status, setStatus] = useState<LegalStatus>(document.status)
  const [reviewNote, setReviewNote] = useState(document.reviewNote ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [trashing, setTrashing] = useState(false)

  const missingActive = requirements.filter((r) => r.active && !r.present)
  const softMissing = requirements.filter((r) => !r.active && !r.present)

  // Editing a document that is (or is about to become) published shows a
  // confirmation first — everything else saves immediately, no status
  // pipeline left to enforce.
  const touchesLivePublish = document.status === 'published' || status === 'published'

  async function submitSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/legal/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          version: Number(version),
          effectiveDate: effectiveDate ? new Date(effectiveDate).toISOString() : null,
          status,
          reviewNote: reviewNote || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      toast.success(status === 'published' ? 'Published' : 'Saved')
      setConfirmOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleSaveClick() {
    if (touchesLivePublish) {
      setConfirmOpen(true)
      return
    }
    submitSave()
  }

  async function handleDuplicate() {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/admin/legal/${document.id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to duplicate')
      }
      const data = await res.json()
      toast.success('Duplicated as a new draft')
      router.push(`/admin/legal/${data.document.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate')
    } finally {
      setDuplicating(false)
    }
  }

  async function handleTrash() {
    if (!confirm(`Move "${document.title}" to trash?`)) return
    setTrashing(true)
    try {
      const res = await fetch(`/api/admin/legal/${document.id}/trash`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to move to trash')
      toast.success('Moved to trash')
      router.push('/admin/legal')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to move to trash')
    } finally {
      setTrashing(false)
    }
  }

  const diff = previousPublishedContent ? diffSummary(previousPublishedContent, content) : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-fluid-3xl font-semibold truncate" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
            {document.title}
          </h1>
          <p className="text-fluid-xs" style={{ color: '#9C8F83' }}>
            /legal/{document.slug} &middot; v{document.version}
          </p>
        </div>
        <Badge>{document.status.replace('_', ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title</Label>
              <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-version">Version</Label>
                <Input
                  id="doc-version"
                  type="number"
                  min={1}
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-effective-date">Effective date</Label>
                <Input
                  id="doc-effective-date"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as LegalStatus)}>
                  <SelectTrigger id="doc-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-content">Content (Markdown)</Label>
              <Textarea
                id="doc-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={24}
                className="font-mono text-fluid-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-review-note">Review note</Label>
              <Textarea
                id="doc-review-note"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Approved by [consultant] 2026-07-20"
                rows={2}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSaveClick} disabled={saving || (status === 'published' && missingActive.length > 0)}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleDuplicate} disabled={duplicating}>
                {duplicating ? 'Duplicating…' : 'Duplicate as new version'}
              </Button>
              <Button variant="destructive" onClick={handleTrash} disabled={trashing}>
                {trashing ? 'Moving…' : 'Move to Trash'}
              </Button>
              {status === 'published' && missingActive.length > 0 && (
                <p className="text-fluid-xs self-center" style={{ color: '#B91C1C' }}>
                  Missing required anchors — see panel
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <article className="prose prose-neutral max-w-none border rounded-lg p-6" style={{ borderColor: '#E5DDD0' }}>
              <ReactMarkdown remarkPlugins={legalMarkdownRemarkPlugins} rehypePlugins={legalMarkdownRehypePlugins}>
                {content}
              </ReactMarkdown>
            </article>
          </TabsContent>

          <TabsContent value="history">
            <div className="rounded-lg overflow-hidden bg-white" style={{ border: '1px solid #E5DDD0' }}>
              <table className="w-full text-fluid-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5DDD0' }}>
                    <th className="text-left px-4 py-2">Version</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Hash</th>
                    <th className="text-left px-4 py-2">Published by</th>
                    <th className="text-left px-4 py-2">Published at</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                      <td className="px-4 py-2">v{v.version}</td>
                      <td className="px-4 py-2">{v.status.replace('_', ' ')}</td>
                      <td className="px-4 py-2 font-mono text-fluid-xs">{v.contentHash ? v.contentHash.slice(0, 10) : '—'}</td>
                      <td className="px-4 py-2">{v.publishedByName ?? '—'}</td>
                      <td className="px-4 py-2">{v.publishedAt ? new Date(v.publishedAt).toLocaleString('en-AU') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        <aside className="space-y-3">
          <h2 className="text-fluid-sm font-semibold" style={{ color: '#6B6560' }}>
            Required anchors
          </h2>
          {requirements.length === 0 ? (
            <p className="text-fluid-xs" style={{ color: '#9C8F83' }}>
              No third-party integration requires an anchor in this document.
            </p>
          ) : (
            <ul className="space-y-2">
              {requirements.map((r) => (
                <li key={r.anchorId} className="flex items-start gap-2 text-fluid-xs" style={{ color: '#2D2924' }}>
                  {r.present ? (
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${r.active ? 'text-red-600' : 'text-amber-500'}`} />
                  )}
                  <div>
                    <p>
                      #{r.anchorId} <span style={{ color: '#9C8F83' }}>({r.requiredBy})</span>
                    </p>
                    {!r.active && <p style={{ color: '#9C8F83' }}>Not yet active — warning only</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{status === 'published' ? `Publish ${document.title}` : 'Editing a published document'}</DialogTitle>
            <DialogDescription>
              {status === 'published'
                ? 'This archives any other published version of this document and makes this content live immediately.'
                : 'This document is currently published — your changes will be visible on the live site immediately.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {status === 'published' &&
              (diff ? (
                <p className="text-fluid-sm">
                  Compared to the current published version: <strong>+{diff.added}</strong> lines added,{' '}
                  <strong>-{diff.removed}</strong> lines removed.
                </p>
              ) : (
                <p className="text-fluid-sm">No previously published version for this document.</p>
              ))}
            {status === 'published' && softMissing.length > 0 && (
              <p className="text-fluid-xs" style={{ color: '#8A6D1F' }}>
                {softMissing.length} inactive integration anchor(s) still missing — non-blocking for now.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitSave} disabled={saving}>
              {saving ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 4: Create `LegalDocumentsTrashView.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/presentation/components/ui/alert-dialog'

interface TrashedDocument {
  id: string
  title: string
  slug: string
  version: number
}

export function LegalDocumentsTrashView({ documents }: { documents: TrashedDocument[] }) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const restore = async (id: string) => {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/admin/legal/${id}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore')
      toast.success('Document restored')
      router.refresh()
    } catch {
      toast.error('Could not restore document')
    } finally {
      setRestoringId(null)
    }
  }

  const deleteForever = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/legal/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to delete document')
      }
      toast.success('Document permanently deleted')
      setDeleteTarget(null)
      setConfirmText('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete document')
    } finally {
      setDeleting(false)
    }
  }

  const closeDialog = () => {
    setDeleteTarget(null)
    setConfirmText('')
  }

  return (
    <div
      className="rounded-lg overflow-hidden bg-white"
      style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
    >
      <Table>
        <TableHeader>
          <TableRow style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid #E5DDD0' }}>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>
              Title
            </TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>
              Slug
            </TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>
              Version
            </TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                Trash is empty
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{doc.title}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm font-mono" style={{ color: '#6B6560' }}>{doc.slug}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>v{doc.version}</TableCell>
                <TableCell className="py-3.5 flex gap-2">
                  <Button size="sm" variant="outline" disabled={restoringId === doc.id} onClick={() => restore(doc.id)}>
                    Restore
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ id: doc.id, title: doc.title })}>
                    Delete Forever
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this version of the document. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-fluid-sm" style={{ color: '#6B6560' }}>
            Type <strong>{deleteTarget?.title}</strong> to confirm.
          </div>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={deleteTarget?.title}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting || confirmText !== deleteTarget?.title} onClick={deleteForever}>
              Delete Forever
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: 0 TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(protected)/legal" src/presentation/components/admin/legal
git commit -m "feat: editable version/date/status, duplicate, and trash view in the legal document editor"
```

---

### Task 7: Footer — single discreet "Legal" dropdown

**Files:**
- Modify: `src/presentation/sections/Footer.tsx`

**Interfaces:**
- Consumes: `legalLinks` prop (unchanged shape, still supplied by `FooterServer.tsx` — no change needed there).
- Produces: no change to the component's public prop shape.

**Design note:** the dropdown trigger opens the menu on click (Radix `DropdownMenu` behavior); it cannot simultaneously act as a plain link without a confusing dual-purpose control, so the menu's first item is "All legal documents" linking to `/legal` — one click away, same as clicking the trigger directly would have been.

- [ ] **Step 1: Replace the legal links block**

In `src/presentation/sections/Footer.tsx`, change the import block:

```typescript
'use client'
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import { IconLogo } from '@/presentation/components/IconLogo';
```

to:

```typescript
'use client'
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, Facebook, Linkedin, ChevronDown } from 'lucide-react';
import { IconLogo } from '@/presentation/components/IconLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
```

Remove the entire "Legal links" block — everything from `{/* Legal links — desktop: grouped by domain. Mobile: single micro-line. */}` through its closing `)}`, i.e. replace:

```typescript
        {/* Legal links — desktop: grouped by domain. Mobile: single micro-line. */}
        {legalLinks.length > 0 && (
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--neutral-700)' }}>
            {/* Desktop */}
            <div className="hidden md:flex justify-center gap-x-10 gap-y-2 flex-wrap">
              {websiteLinks.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                    Website
                  </span>
                  <div className="flex gap-4 flex-wrap">
                    {websiteLinks.map((link) => (
                      <Link
                        key={link.slug}
                        href={`/legal/${link.slug}`}
                        className="text-fluid-xs hover:underline"
                        style={{ color: 'var(--neutral-50)' }}
                      >
                        {link.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {serviceLinks.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                    Services
                  </span>
                  <div className="flex gap-4 flex-wrap">
                    {serviceLinks.map((link) => (
                      <Link
                        key={link.slug}
                        href={`/legal/${link.slug}`}
                        className="text-fluid-xs hover:underline"
                        style={{ color: 'var(--neutral-50)' }}
                      >
                        {link.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: single micro-line, middot separators, no accordions/columns */}
            <div
              className="flex md:hidden flex-wrap items-center justify-center"
              style={{ columnGap: '0.5rem', rowGap: '0.5rem' }}
            >
              {legalLinks.map((link, i) => (
                <span key={link.slug} className="flex items-center" style={{ columnGap: '0.5rem' }}>
                  {i > 0 && <span style={{ color: 'var(--contigo-primary)' }}>&middot;</span>}
                  <Link
                    href={`/legal/${link.slug}`}
                    className="text-fluid-xs py-3 hover:underline"
                    style={{ color: 'var(--neutral-50)' }}
                  >
                    {link.title}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
```

with just:

```typescript
        {/* Bottom bar */}
```

- [ ] **Step 2: Add the dropdown next to the copyright line**

Change:

```typescript
          <p
            className="text-fluid-xs"
            style={{ color: 'var(--neutral-600)' }}
          >
            &copy; 2025 Contigo Constructions Pty Ltd. All rights reserved.
          </p>
```

to:

```typescript
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <p
              className="text-fluid-xs"
              style={{ color: 'var(--neutral-600)' }}
            >
              &copy; 2025 Contigo Constructions Pty Ltd. All rights reserved.
            </p>
            {legalLinks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-fluid-xs inline-flex items-center gap-1 hover:underline"
                    style={{ color: 'var(--neutral-50)' }}
                  >
                    Legal
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/legal">All legal documents</Link>
                  </DropdownMenuItem>
                  {websiteLinks.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Website</DropdownMenuLabel>
                      {websiteLinks.map((link) => (
                        <DropdownMenuItem key={link.slug} asChild>
                          <Link href={`/legal/${link.slug}`}>{link.title}</Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {serviceLinks.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Services</DropdownMenuLabel>
                      {serviceLinks.map((link) => (
                        <DropdownMenuItem key={link.slug} asChild>
                          <Link href={`/legal/${link.slug}`}>{link.title}</Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: 0 TypeScript errors. Confirm `/`, `/about`, and `/legal` still appear in the route list (footer renders on all of them via `FooterServer`).

- [ ] **Step 4: Commit**

```bash
git add src/presentation/sections/Footer.tsx
git commit -m "feat: collapse footer legal links into a single Legal dropdown"
```

---

### Task 8: End-to-end verification and cleanup

**Files:**
- Create (temporary, deleted at the end of this task): `scripts/tmp-verify-flexible-legal.ts`

**Interfaces:**
- Consumes: every use case from Task 4, `DrizzleSecurityEventLogger` (existing).
- Produces: nothing persisted — this task only verifies behavior against the real staging database, then cleans up.

- [ ] **Step 1: Write the verification script**

Create `scripts/tmp-verify-flexible-legal.ts`:

```typescript
import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from '@/infrastructure/db/client'
import { legalDocuments, adminUsers } from '@/infrastructure/db/schema'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { DrizzleSecurityEventLogger } from '@/infrastructure/services/DrizzleSecurityEventLogger'
import { SaveLegalDocumentDraftUseCase } from '@/application/use-cases/legal/SaveLegalDocumentDraftUseCase'
import { SetLegalDocumentStatusUseCase } from '@/application/use-cases/legal/SetLegalDocumentStatusUseCase'
import { DuplicateLegalDocumentUseCase } from '@/application/use-cases/legal/DuplicateLegalDocumentUseCase'
import { TrashLegalDocumentUseCase } from '@/application/use-cases/legal/TrashLegalDocumentUseCase'
import { RestoreLegalDocumentUseCase } from '@/application/use-cases/legal/RestoreLegalDocumentUseCase'
import { DeleteLegalDocumentPermanentlyUseCase } from '@/application/use-cases/legal/DeleteLegalDocumentPermanentlyUseCase'

async function main() {
  const repo = new DrizzleLegalDocumentRepository()
  const logger = new DrizzleSecurityEventLogger()
  const [owner] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.role, 'owner')).limit(1)
  if (!owner) throw new Error('No owner admin user found — cannot run verification')

  const draft = await new SaveLegalDocumentDraftUseCase(repo).execute({
    slug: '__flex_test__',
    domain: 'general',
    title: 'Flex Test',
    content: 'Some text.',
    version: 7,
    createdBy: null,
  })
  console.log('1. draft created with manual version:', draft.version === 7)

  const published = await new SetLegalDocumentStatusUseCase(repo, logger).execute(draft.id, 'published', owner.id)
  console.log('2. published (manual version preserved):', published.document.version === 7)

  // Edit the now-published row directly — must succeed with no guard error.
  const edited = await new SaveLegalDocumentDraftUseCase(repo).executeEdit(draft.id, { content: 'Edited live content.' })
  console.log('3. edited a published row in place:', edited.content === 'Edited live content.')

  // Manually unpublish (archive) — free transition, no guard.
  const archived = await new SaveLegalDocumentDraftUseCase(repo).executeEdit(draft.id, { status: 'archived' })
  console.log('4. manually archived:', archived.status === 'archived')

  // Duplicate.
  const copy = await new DuplicateLegalDocumentUseCase(repo).execute(draft.id, null)
  console.log('5. duplicated as new draft:', copy.status === 'draft' && copy.slug === draft.slug && copy.id !== draft.id)

  // Trash both rows, confirm they disappear from listCurrent, then restore one.
  await new TrashLegalDocumentUseCase(repo).execute(draft.id)
  await new TrashLegalDocumentUseCase(repo).execute(copy.id)
  const current = await repo.listCurrent()
  console.log('6. trashed rows excluded from listCurrent:', !current.some((d) => d.slug === '__flex_test__'))

  await new RestoreLegalDocumentUseCase(repo).execute(copy.id)
  const restored = await repo.findById(copy.id)
  console.log('7. restore clears trashedAt:', restored?.trashedAt === null)

  // Permanent delete must reject a non-trashed row.
  try {
    await new DeleteLegalDocumentPermanentlyUseCase(repo).execute(copy.id)
    console.log('8. FAIL: permanent delete on a non-trashed row did not throw')
  } catch (err) {
    console.log('8. permanent delete correctly rejected a non-trashed row:', (err as Error).message)
  }

  // Trash it again, then permanently delete for real.
  await new TrashLegalDocumentUseCase(repo).execute(copy.id)
  await new DeleteLegalDocumentPermanentlyUseCase(repo).execute(copy.id)
  const gone = await repo.findById(copy.id)
  console.log('9. permanent delete removed the row:', gone === null)

  // Cleanup the remaining test row.
  await db.delete(legalDocuments).where(eq(legalDocuments.slug, '__flex_test__'))
  console.log('10. cleanup done')

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Run it**

Run: `npx tsx scripts/tmp-verify-flexible-legal.ts`
Expected: lines 1–7, 9, 10 all print `true`/a success message; line 8 prints the rejection message (not "FAIL").

- [ ] **Step 3: Delete the temporary script**

```bash
rm scripts/tmp-verify-flexible-legal.ts
```

- [ ] **Step 4: Final full build**

Run: `npm run build`
Expected: 0 TypeScript errors.

- [ ] **Step 5: Update `docs/09-Compliance-y-Legal.md`**

Add a short new section near the top (after "## Module summary") noting the flexibility change, so the doc doesn't contradict the code:

```markdown
## Update 2026-07-09: flexible editing

The strict immutability model described below was relaxed at Gustavo's request:
version, effective date, and status (draft/in_review/published/archived) are now
plain admin-editable fields on any document regardless of its current status —
see `docs/superpowers/specs/2026-07-09-legal-documents-flexible-editing-design.md`.
The only remaining automatic behavior is what happens when a document's status
becomes `published`: the required-active-anchor check, content hash, archiving
of any other published row for the same slug, and the `legal_document_published`
security event. Documents can also be duplicated into a new draft version, and
moved to a trash before permanent deletion, mirroring the categories/leads
trash pattern already in this repo.
```

- [ ] **Step 6: Commit**

```bash
git add docs/09-Compliance-y-Legal.md
git commit -m "docs: note the flexible-editing update in the Compliance & Legal module doc"
```

---

## Self-Review Notes (for the plan author, already applied above)

- **Spec coverage:** manual version/date (Task 2, 4, 6) ✓; free status transitions (Task 2, 4, 5) ✓; published-only side effects preserved (Task 4 `SetLegalDocumentStatusUseCase`, Task 5 PATCH) ✓; edit-in-place with confirmation (Task 6 `touchesLivePublish`) ✓; duplicate (Task 4, 5, 6) ✓; trash/restore/permanent-delete (Task 2, 3, 4, 5, 6) ✓; footer dropdown (Task 7) ✓; migration (Task 1) ✓.
- **Placeholder scan:** none found — every step has complete code or an exact shell command.
- **Type consistency:** `LegalDocumentEdits` (Task 2) is the single shape used by `withEdits`, `executeEdit`, and the PATCH schema (Task 5) — checked field names match (`title`, `content`, `version`, `effectiveDate`, `status`, `reviewNote`) throughout.
- **Scope check:** single subsystem (the legal documents module already built in the prior session) — no decomposition needed.
