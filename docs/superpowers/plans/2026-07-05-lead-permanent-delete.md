# Permanent delete for trashed leads — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin permanently delete a trashed lead from `/admin/leads?trash=1` — the lead, its quote, every child record, and the R2 files it owns are all removed, recursively, in one action.

**Architecture:** `leads.quoteId → quotes.id` and every lead-child table already cascade on delete (see spec). A new `DeleteLeadPermanentlyUseCase` collects R2 keys to clean up, issues a single `quoteRepository.delete(quote.id)` (cascades the whole tree), then best-effort deletes the collected R2 objects. A new `leads.delete` permission gates a new `POST /api/admin/leads/[id]/delete-permanently` route. The trash UI gets a "Delete Forever" button behind a type-to-confirm `AlertDialog`.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM/Postgres, next-auth v5, shadcn `AlertDialog`, AWS S3 SDK (R2).

## Global Constraints

- No test framework exists in this repo (no jest/vitest configured, no `test` script in `package.json`) — verify each task with `npx tsc --noEmit`, `npm run lint`, and (final task) `npm run build`, not unit tests.
- Do not run Chrome DevTools MCP browser tests.
- Do not spawn subagents — execute every task directly in this session.
- Do not `git commit` at any point. Suggest one commit message at the very end instead.
- UI copy is in English (existing convention in `LeadsTrashView.tsx`).
- Spec: `docs/superpowers/specs/2026-07-05-lead-permanent-delete-design.md`.

---

### Task 1: `IQuoteRepository.delete` + `DrizzleQuoteRepository.delete`

**Files:**
- Modify: `src/core/repositories/IQuoteRepository.ts`
- Modify: `src/infrastructure/repositories/DrizzleQuoteRepository.ts`

**Interfaces:**
- Produces: `IQuoteRepository.delete(id: string): Promise<void>` — hard `DELETE FROM quotes WHERE id = ...`. Cascades to `leads` and everything below it per the FK chain in the spec.

- [ ] **Step 1: Add `delete` to the interface**

In `src/core/repositories/IQuoteRepository.ts`, add one line to the interface:

```ts
export interface IQuoteRepository {
  save(quote: Quote): Promise<void>
  findById(id: string): Promise<Quote | null>
  findByToken(token: string): Promise<Quote | null>
  findAll(limit?: number, offset?: number): Promise<Quote[]>
  update(quote: Quote): Promise<void>
  delete(id: string): Promise<void>
}
```

- [ ] **Step 2: Implement it in `DrizzleQuoteRepository`**

In `src/infrastructure/repositories/DrizzleQuoteRepository.ts`, the import on line 1 already includes `eq`. Add this method (e.g. directly after `update`, before `count`):

```ts
  async delete(id: string): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id))
  }
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors (any pre-existing errors unrelated to this file are out of scope — confirm the count doesn't grow because of this change).

---

### Task 2: `ITaskAttachmentRepository.findByLeadId` + Drizzle implementation

**Files:**
- Modify: `src/core/repositories/ITaskAttachmentRepository.ts`
- Modify: `src/infrastructure/repositories/DrizzleTaskAttachmentRepository.ts`

**Interfaces:**
- Consumes: `taskAttachments` and `leadTasks` tables from `src/infrastructure/db/schema.ts` (both already defined: `taskAttachments.taskId` FK → `leadTasks.id`, `leadTasks.leadId` FK → `leads.id`).
- Produces: `ITaskAttachmentRepository.findByLeadId(leadId: string): Promise<TaskAttachment[]>` — every attachment belonging to any task under the given lead.

- [ ] **Step 1: Add to the interface**

In `src/core/repositories/ITaskAttachmentRepository.ts`:

```ts
import { TaskAttachment } from '../entities/TaskAttachment'

export interface ITaskAttachmentRepository {
  save(attachment: TaskAttachment): Promise<void>
  findById(id: string): Promise<TaskAttachment | null>
  findByTaskId(taskId: string): Promise<TaskAttachment[]>
  findByLeadId(leadId: string): Promise<TaskAttachment[]>
  delete(id: string): Promise<void>
}
```

- [ ] **Step 2: Implement it in `DrizzleTaskAttachmentRepository`**

In `src/infrastructure/repositories/DrizzleTaskAttachmentRepository.ts`, change the imports and add the method:

```ts
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { taskAttachments, leadTasks } from '../db/schema'
import { TaskAttachment } from '@/core/entities/TaskAttachment'
import { ITaskAttachmentRepository } from '@/core/repositories/ITaskAttachmentRepository'

export class DrizzleTaskAttachmentRepository implements ITaskAttachmentRepository {
  async save(attachment: TaskAttachment): Promise<void> {
    await db.insert(taskAttachments).values({
      id: attachment.id,
      taskId: attachment.taskId,
      key: attachment.key,
      filename: attachment.filename,
    })
  }

  async findById(id: string): Promise<TaskAttachment | null> {
    const rows = await db.select().from(taskAttachments).where(eq(taskAttachments.id, id)).limit(1)
    if (!rows.length) return null
    return this.mapRow(rows[0])
  }

  async findByTaskId(taskId: string): Promise<TaskAttachment[]> {
    const rows = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.createdAt))
    return rows.map((row) => this.mapRow(row))
  }

  async findByLeadId(leadId: string): Promise<TaskAttachment[]> {
    const rows = await db
      .select({
        id: taskAttachments.id,
        taskId: taskAttachments.taskId,
        key: taskAttachments.key,
        filename: taskAttachments.filename,
        createdAt: taskAttachments.createdAt,
      })
      .from(taskAttachments)
      .innerJoin(leadTasks, eq(taskAttachments.taskId, leadTasks.id))
      .where(eq(leadTasks.leadId, leadId))
    return rows.map((row) => this.mapRow(row))
  }

  async delete(id: string): Promise<void> {
    await db.delete(taskAttachments).where(eq(taskAttachments.id, id))
  }

  private mapRow(row: any): TaskAttachment {
    return TaskAttachment.reconstruct({
      id: row.id,
      taskId: row.taskId,
      key: row.key,
      filename: row.filename,
      createdAt: row.createdAt,
    })
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

---

### Task 3: `DeleteLeadPermanentlyUseCase`

**Files:**
- Create: `src/application/use-cases/leads/DeleteLeadPermanentlyUseCase.ts`

**Interfaces:**
- Consumes:
  - `ILeadRepository.findById(id): Promise<Lead | null>` (existing)
  - `IQuoteRepository.findById(id): Promise<Quote | null>` and `.delete(id): Promise<void>` (Task 1)
  - `ILeadDocumentRepository.findByLeadId(leadId): Promise<LeadDocument[]>` (existing, confirmed in `DrizzleLeadDocumentRepository.ts`)
  - `ITaskAttachmentRepository.findByLeadId(leadId): Promise<TaskAttachment[]>` (Task 2)
  - `deleteObject(bucket: string, key: string): Promise<void>` from `@/infrastructure/services/R2StorageService` (existing)
- Produces: `DeleteLeadPermanentlyUseCase.execute(leadId: string): Promise<void>`. Throws `Error('Lead not found')` if missing, `Error('Lead must be trashed before it can be permanently deleted')` if `lead.trashedAt` is null, `Error('Quote not found')` if the quote row is missing.

- [ ] **Step 1: Write the use case**

```ts
import { ILeadRepository } from '@/core/repositories/ILeadRepository'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { ILeadDocumentRepository } from '@/core/repositories/ILeadDocumentRepository'
import { ITaskAttachmentRepository } from '@/core/repositories/ITaskAttachmentRepository'
import { deleteObject } from '@/infrastructure/services/R2StorageService'

export class DeleteLeadPermanentlyUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private quoteRepository: IQuoteRepository,
    private leadDocumentRepository: ILeadDocumentRepository,
    private taskAttachmentRepository: ITaskAttachmentRepository,
  ) {}

  async execute(leadId: string): Promise<void> {
    const lead = await this.leadRepository.findById(leadId)
    if (!lead) throw new Error('Lead not found')

    if (!lead.trashedAt) {
      throw new Error('Lead must be trashed before it can be permanently deleted')
    }

    const quote = await this.quoteRepository.findById(lead.quoteId)
    if (!quote) throw new Error('Quote not found')

    const r2Targets = await this.collectR2Targets(leadId, quote.attachmentUrls)

    await this.quoteRepository.delete(quote.id)

    await this.cleanupR2(r2Targets)
  }

  private async collectR2Targets(
    leadId: string,
    quoteAttachmentUrls: string[],
  ): Promise<Array<{ bucket: string; key: string }>> {
    const assetsBucket = process.env.R2_ASSETS_BUCKET
    const quotesBucket = process.env.R2_QUOTES_BUCKET

    const targets: Array<{ bucket: string; key: string }> = []

    const documents = await this.leadDocumentRepository.findByLeadId(leadId)
    for (const doc of documents) {
      if (doc.sourceMediaId) continue // reused from the shared Media Library
      if (assetsBucket) targets.push({ bucket: assetsBucket, key: doc.fileKey })
    }

    const attachments = await this.taskAttachmentRepository.findByLeadId(leadId)
    for (const attachment of attachments) {
      if (!attachment.key.startsWith('task-attachments/')) continue // picked from Media Library
      if (quotesBucket) targets.push({ bucket: quotesBucket, key: attachment.key })
    }

    for (const url of quoteAttachmentUrls) {
      if (quotesBucket) targets.push({ bucket: quotesBucket, key: url })
    }

    return targets
  }

  private async cleanupR2(targets: Array<{ bucket: string; key: string }>): Promise<void> {
    const results = await Promise.allSettled(
      targets.map((target) => deleteObject(target.bucket, target.key)),
    )

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`Failed to delete R2 object ${targets[i].bucket}/${targets[i].key}:`, result.reason)
      }
    })
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors. This confirms `ILeadDocumentRepository` already exposes `findByLeadId` (it does — see `DrizzleLeadDocumentRepository.ts`) and that `Quote.attachmentUrls` is `string[]` (confirmed in `src/core/entities/Quote.ts`).

---

### Task 4: `POST /api/admin/leads/[id]/delete-permanently` route

**Files:**
- Create: `app/api/admin/leads/[id]/delete-permanently/route.ts`

**Interfaces:**
- Consumes: `DeleteLeadPermanentlyUseCase` (Task 3), `hasPermission` (existing, `@/infrastructure/auth/hasPermission`), `auth` (existing, `@/infrastructure/auth/auth.config`).
- Produces: `POST` handler returning `{ success: true }` on success; `401`/`403`/`404`/`500` with `{ error: string }` otherwise.

- [ ] **Step 1: Write the route**

```ts
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleTaskAttachmentRepository } from '@/infrastructure/repositories/DrizzleTaskAttachmentRepository'
import { DeleteLeadPermanentlyUseCase } from '@/application/use-cases/leads/DeleteLeadPermanentlyUseCase'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'leads.delete'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const useCase = new DeleteLeadPermanentlyUseCase(
      new DrizzleLeadRepository(),
      new DrizzleQuoteRepository(),
      new DrizzleLeadDocumentRepository(),
      new DrizzleTaskAttachmentRepository(),
    )
    await useCase.execute(id)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting lead:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Lead not found' || message === 'Quote not found' ? 404 : 500
    return Response.json({ error: message }, { status })
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

---

### Task 5: `leads.delete` permission — migration + `staffPermissions.ts`

**Files:**
- Create: `src/infrastructure/db/migrations/<generated-timestamp>_seed_leads_delete_permission.sql` (exact filename decided by `drizzle-kit generate` in Step 1)
- Modify: `src/presentation/constants/staffPermissions.ts`

**Interfaces:**
- Produces: a `leads.delete` row in the `permissions` table, granted to all existing `owner`-role admin users; `PERMISSION_OPTIONS` array entry so the "edit permissions" admin screen can grant it to staff.

- [ ] **Step 1: Generate an empty custom migration**

Run: `npx drizzle-kit generate --custom --name=seed_leads_delete_permission`
Expected: creates a new empty `.sql` file under `src/infrastructure/db/migrations/` and adds an entry to `src/infrastructure/db/migrations/meta/_journal.json`. Note the exact generated filename for the next step.

- [ ] **Step 2: Fill in the migration SQL**

Open the newly generated file and replace its contents with:

```sql
-- Custom SQL migration file, put your code below! --

-- Seed: new granular permission for permanently deleting a trashed lead
-- (distinct from leads.archive, which only covers trash/restore).
INSERT INTO permissions (key, label)
VALUES
  ('leads.delete', 'Delete Leads Permanently')
ON CONFLICT (key) DO NOTHING;

-- Backfill: existing 'owner' admin_users get this permission granted
-- explicitly too, mirroring the original permissions seed migration
-- (owners bypass granular checks in app logic regardless).
INSERT INTO staff_user_permissions (user_id, permission_key)
SELECT admin_users.id, 'leads.delete'
FROM admin_users
WHERE admin_users.role = 'owner'
ON CONFLICT (user_id, permission_key) DO NOTHING;
```

- [ ] **Step 3: Add the permission to `staffPermissions.ts`**

In `src/presentation/constants/staffPermissions.ts`, add one entry after `leads.archive`:

```ts
export const PERMISSION_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'leads.view', label: 'View Leads' },
  { key: 'leads.edit', label: 'Edit Leads' },
  { key: 'leads.archive', label: 'Archive Leads' },
  { key: 'leads.delete', label: 'Delete Leads Permanently' },
  { key: 'pipeline.manage', label: 'Manage Pipeline' },
  { key: 'tasks.manage', label: 'Manage Tasks' },
  { key: 'form_builder.manage', label: 'Manage Form Builder' },
  { key: 'users.manage', label: 'Manage Users' },
  { key: 'media.manage', label: 'Manage Media' },
  { key: 'settings.manage', label: 'Manage Settings' },
]
```

- [ ] **Step 4: Apply the migration**

Run: `npm run db:migrate`
Expected: reports the new migration applied successfully (no errors). If `DATABASE_URL` / `.env.local` isn't available in this environment, note that and skip running it, but leave the SQL file in place — flag this explicitly to the user rather than silently skipping.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

---

### Task 6: "Delete Forever" button + type-to-confirm dialog in `LeadsTrashView.tsx`

**Files:**
- Modify: `src/presentation/components/admin/LeadsTrashView.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/leads/[id]/delete-permanently` (Task 4); existing shadcn `AlertDialog` primitives from `@/presentation/components/ui/alert-dialog`; existing `Input` component from `@/presentation/components/ui/input` (confirm it exists before using — if not, use a plain `<input>` styled like other admin inputs).
- Produces: no new exports — this is a leaf UI change.

- [ ] **Step 1: Confirm the `Input` component exists**

Run: `ls src/presentation/components/ui/input.tsx` (or check via Glob) — expected to exist, since React Hook Form usage across the admin implies a shared `Input`. If it doesn't exist, fall back to a plain `<input>` with Tailwind classes matching the existing table's neutral palette.

- [ ] **Step 2: Rewrite `LeadsTrashView.tsx`**

```tsx
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
import type { QuoteDTO } from '@/presentation/types/QuoteDTO'
import type { PipelineStageDTO } from '@/presentation/types/PipelineStageDTO'

interface LeadsTrashViewProps {
  leads: Array<{
    id: string
    quoteId: string
    stageId: string
    estimatedValue: number | null
    updatedAt: Date
    quote: QuoteDTO | null
  }>
  pipelineStages: PipelineStageDTO[]
}

export function LeadsTrashView({ leads, pipelineStages }: LeadsTrashViewProps) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const restoreLead = async (leadId: string) => {
    setRestoringId(leadId)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/restore-trash`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore lead')
      toast.success('Lead restored')
      router.refresh()
    } catch {
      toast.error('Could not restore lead')
    } finally {
      setRestoringId(null)
    }
  }

  const deleteForever = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/leads/${deleteTarget.id}/delete-permanently`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to delete lead')
      toast.success('Lead permanently deleted')
      setDeleteTarget(null)
      setConfirmText('')
      router.refresh()
    } catch {
      toast.error('Could not delete lead')
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
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Name</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Email</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Service</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Stage</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                Trash is empty
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{lead.quote?.name || 'Unknown'}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{lead.quote?.email ?? '—'}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{lead.quote?.service ?? '—'}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>
                  {pipelineStages.find((s) => s.id === lead.stageId)?.label ?? '—'}
                </TableCell>
                <TableCell className="py-3.5 flex gap-2">
                  <Button size="sm" variant="outline" disabled={restoringId === lead.id} onClick={() => restoreLead(lead.id)}>
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget({ id: lead.id, name: lead.quote?.name || 'this lead' })}
                  >
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
            <AlertDialogTitle>Delete lead permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lead, its quote, and all associated data
              (documents, notes, messages, tasks, events). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-fluid-sm" style={{ color: '#6B6560' }}>
            Type <strong>{deleteTarget?.name}</strong> to confirm.
          </div>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={deleteTarget?.name}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting || confirmText !== deleteTarget?.name}
              onClick={deleteForever}
            >
              Delete Forever
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

Note: the confirm button is a plain `Button`, not `AlertDialogAction` — `AlertDialogAction` auto-closes the dialog on click regardless of the async result, which would close it even if the delete fails. Driving `open` off `deleteTarget` state and closing manually only on success avoids that.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors. If `Input` doesn't exist per Step 1's check, replace the `<Input .../>` with a plain `<input className="..." />` matching the surrounding style and re-run this check.

---

### Task 7: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors introduced by this feature (pre-existing unrelated errors, if any, are out of scope).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new warnings/errors in the files touched by this plan.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual reasoning check (no MCP chrome devtools, no test infra)**

Re-read the final `DeleteLeadPermanentlyUseCase` and the route against the spec's "R2 cleanup" and "Why one DELETE cascades everything" sections; confirm every child table listed in the spec is in fact covered by the FK cascade chain (re-grep `schema.ts` for `.references(() => leads.id` and `.references(() => leadTasks.id` if any doubt remains).

---

## Suggested commit message (do not run — user will commit manually)

```
feat: add permanent delete for trashed leads with R2 cleanup
```
