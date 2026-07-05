# Permanent delete for trashed leads

## Problem

`/admin/leads?trash=1` only supports restoring a trashed lead
(`RestoreLeadFromTrashUseCase` via `POST .../restore-trash`). There is no way to
permanently remove a lead the business no longer wants to keep — its row, and all its
child data, stay in the database forever. The user wants a "delete forever" action from
the trash view that recursively removes the lead and every child record.

## Scope

In scope:
- A `DeleteLeadPermanentlyUseCase` that hard-deletes a trashed lead, its `Quote`, and
  every child record across all lead-related tables, plus the R2 objects those records
  point to (except files reused from the shared Media Library).
- New `POST /api/admin/leads/[id]/delete-permanently` endpoint, gated on a lead being
  trashed already and on a new granular permission.
- New permission key `leads.delete` (separate from `leads.archive`), seeded via
  migration and added to `staffPermissions.ts`. Owners bypass as usual.
- "Delete Forever" button in `LeadsTrashView.tsx` with a reinforced confirmation dialog
  (type the client's name to enable the destructive action).

Out of scope:
- Bulk "empty trash" (delete-all) action — per-row only.
- Any change to the existing trash/restore flow, or to other entities' trash (projects,
  services, categories already explicitly deferred permanent-delete in an earlier spec).
- A retention/auto-purge policy for trash.

## Why one `DELETE` cascades everything

`leads.quoteId` references `quotes.id` with `onDelete: 'cascade'`. Every lead-owned
child table references `leads.id` with `onDelete: 'cascade'`
(`lead_events`, `lead_documents`, `lead_notes`, `lead_messages`, `lead_contacts`,
`lead_activities`, `lead_tasks`), and the tables owned by a task in turn reference
`lead_tasks.id` with `onDelete: 'cascade'` (`task_checklist_items`, `task_attachments`,
`task_comments`).

That means a single `DELETE FROM quotes WHERE id = <quote.id>` deletes the quote, which
cascades to the lead, which cascades to all 7 direct child tables, 2 of which cascade
further into the 3 task-owned tables — the entire tree, in one statement, with no manual
per-table deletes required.

## R2 cleanup

Deleting DB rows leaves the files they pointed at orphaned in R2 unless cleaned up
explicitly. Before issuing the `DELETE`, the use case collects every key it's safe to
remove:

- `lead_documents.fileKey` where `sourceMediaId IS NULL` — bucket `R2_ASSETS_BUCKET`.
  Rows with a `sourceMediaId` are reused from the shared Media Library and must be kept.
- `task_attachments.key` where the key starts with `task-attachments/` — bucket
  `R2_QUOTES_BUCKET`. Attachments picked via the Media Library picker instead get a key
  copied from the public assets bucket (no `task-attachments/` prefix) and are excluded
  the same way.
- `quotes.attachmentUrls[]` (every entry) — bucket `R2_QUOTES_BUCKET`. These are always
  private, lead-specific uploads from the public quote form, never shared.

After the DB `DELETE` succeeds, the collected keys are deleted from R2 via
`Promise.allSettled` (best-effort — a failed R2 delete is logged, not thrown; the DB is
already the source of truth and is clean either way).

## Backend

- `IQuoteRepository` gains `delete(id: string): Promise<void>` — hard `DELETE FROM
  quotes WHERE id = ...`. Implemented in `DrizzleQuoteRepository`.
- `ITaskAttachmentRepository` gains `findByLeadId(leadId: string): Promise<TaskAttachment[]>`
  — joins `task_attachments` to `lead_tasks` on `taskId` to find every attachment under
  any task belonging to the lead. Implemented in `DrizzleTaskAttachmentRepository`.
- New `DeleteLeadPermanentlyUseCase(leadRepository, quoteRepository,
  leadDocumentRepository, taskAttachmentRepository)`:
  1. `leadRepository.findById(leadId)` — 404 (`Error('Lead not found')`) if missing.
  2. Guard: if `lead.trashedAt` is `null`, throw (`Error('Lead must be trashed before it
     can be permanently deleted')`) — mirrors the existing trash/restore guards.
  3. `quoteRepository.findById(lead.quoteId)` — throw if missing (shouldn't happen,
     `quoteId` is `notNull`).
  4. Collect R2 targets as described above (`leadDocumentRepository.findByLeadId`,
     `taskAttachmentRepository.findByLeadId`, `quote.attachmentUrls`).
  5. `quoteRepository.delete(quote.id)`.
  6. `Promise.allSettled` the R2 `deleteObject` calls; log (`console.error`) any
     rejections.
- New route `app/api/admin/leads/[id]/delete-permanently/route.ts`, `POST`, mirroring
  `trash/route.ts`: `auth()` check, `hasPermission(userId, 'leads.delete')` check (403),
  then run the use case, return `{ success: true }` (no lead to return — it's gone).
  404 if the lead doesn't exist or isn't trashed (use case error message surfaces as the
  `error` field, same pattern as other lead routes).

## Permission

- New migration seeding `('leads.delete', 'Delete Leads Permanently')` into
  `permissions`, following the exact pattern of
  `20260622152709_seed_permissions_and_backfill_owner_grants.sql` (including the owner
  backfill insert into `staff_user_permissions`).
- `PERMISSION_OPTIONS` in `staffPermissions.ts` gains
  `{ key: 'leads.delete', label: 'Delete Leads Permanently' }`.

## Frontend

- `LeadsTrashView.tsx`: each row gets a second, destructive-styled button ("Delete
  Forever") next to "Restore".
- Clicking it opens a shadcn `AlertDialog`:
  - Copy: "This will permanently delete this lead, its quote, and all associated data
    (documents, notes, messages, tasks, events). This cannot be undone."
  - A text input asking the admin to type the client's name (`lead.quote?.name`) to
    match before the confirm button enables (reinforced confirmation, per user's choice
    — mirrors no existing pattern in this codebase, so it's a small local component, not
    a shared one).
  - Confirm button calls `POST /api/admin/leads/[id]/delete-permanently`; on success,
    toast + `router.refresh()`, same as `restoreLead`. On failure, error toast.

## Rollout

Single additive permission-seed migration (`npm run db:migrate`). Verify with `npx tsc
--noEmit && npm run lint && npm run build`. Manual check in the browser: trash a lead,
open trash view, delete forever with the wrong name typed (button stays disabled), type
the correct name, confirm, verify the lead disappears from `?trash=1` and its row (plus
quote, documents, tasks, etc.) is gone from the database. No `git commit` unless asked.
