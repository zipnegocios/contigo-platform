# Flexible editing, manual versioning, and a simpler footer menu for legal documents

## Problem

The Compliance & Legal module (`docs/09-Compliance-y-Legal.md`) was built around strict,
system-enforced immutability: `version` auto-increments, `effectiveDate`/`publishedAt` are
set by the system at publish time, `published`/`archived` rows can never be edited again,
and the only way to change a live document is to draft, review, and publish a brand-new
row through a fixed pipeline.

Gustavo wants the admin to have full manual control instead: edit any document (including
one that's already published) directly, decide the version number and publication date
himself instead of having the system compute them, move a document freely between
draft/in_review/published/archived, and delete a document (to a trash, with a separate
permanent-delete step). The footer's grouped legal links should also collapse into a
single, subtler "Legal" menu instead of a permanent block of links.

## Scope

In scope:
- Remove the immutability guards in `LegalDocument` and `DrizzleLegalDocumentRepository`.
  Any field (title, content, `version`, `effectiveDate`, `status`) is editable regardless
  of the row's current status.
- `version` and `effectiveDate` become admin-entered form fields (pre-filled with a
  suggested next version / today's date, both overridable) instead of system-computed
  values.
- A free status selector (draft / in_review / published / archived) replacing the
  `submitForReview`/`publish` guarded pipeline. Setting status to `published` still:
  - blocks if a required **active** anchor (Google/Meta) is missing from the content
    (same rule as today — the only remaining automatic gate);
  - auto-archives any other `published` row for the same slug (keeps "one live version
    per slug" true, per Gustavo's confirmation), computes the content hash, and logs the
    existing `legal_document_published` security event.
  - Moving *out* of `published` (to draft/in_review/archived) or between any other pair of
    statuses is unrestricted and does not log a security event.
- Editing a row that is currently `published` asks for an extra confirmation in the admin
  UI ("This document is published — changes go live immediately") before saving. No
  confirmation for any other status.
- "Duplicate as new version": copies slug + content into a new `draft` row (new id),
  regardless of the source row's status. The source is untouched. Version/date on the
  copy are pre-filled (`maxVersion + 1` / today) and editable like any other draft.
- Trash: adds `trashedAt` to `legal_documents`, following the same pattern already used by
  `categories`/`projects`/`leads` in this repo. "Delete" soft-deletes (sets `trashedAt`);
  a trash view (`/admin/legal?trash=1`) lists trashed documents with **Restore** and
  **Delete forever** (hard `DELETE`, confirmation required) actions.
- Public/footer queries (`getPublished`, `listPublished`) exclude trashed rows.
- Footer: replace the grouped link block with a single "Legal ▾" trigger next to the
  copyright line. The label itself links to `/legal`; hovering/clicking reveals a small
  dropdown with the same grouped links as before. One implementation for desktop and
  mobile (no separate collapsed micro-line).

Out of scope:
- Any change to the public `/legal` index or `/legal/[slug]` pages themselves (they
  already only render `published`, non-trashed documents).
- Any change to `security_events` schema — reused as-is, only logged on the `published`
  transition, same as today.
- Bulk trash actions (empty trash / restore-all) — per-row only, matching the leads trash
  precedent.
- Content of the 6 seeded documents — unchanged by this spec.
- Re-adding a test runner — this module still has no automated tests (per the earlier
  decision); verification stays manual/build-based.

## Data model change

```typescript
// src/infrastructure/db/schema.ts — legalDocuments table, additive column
trashedAt: timestamp('trashed_at', { withTimezone: true }),
```

Plus an index, mirroring every other trashable table in this schema:

```typescript
index('idx_legal_trashed_at').on(table.trashedAt),
```

No other column changes. `version` stays `integer`, `effectiveDate` stays nullable
`timestamp` — only how they get their values changes (admin input vs. system-computed).

## Entity changes (`src/core/entities/LegalDocument.ts`)

- Remove `LegalDocumentNotEditableError` / `LegalDocumentNotPublishableError` and the
  `isEditable` guard from `withEdits`, `submitForReview`, and `publish`.
- `withEdits` accepts `version` and `effectiveDate` as ordinary editable fields, and also
  accepts a `status` change (replacing the separate `submitForReview`/`archive` methods
  with one generic `withStatus(status)` — kept minimal since there's no guard logic left
  to justify separate methods).
- `publish(...)` keeps computing `contentHash` + `publishedAt` (system timestamp, for the
  security event payload/audit trail) but no longer throws on current status; it becomes
  "the specific transition that also computes the hash and fires the audit event",
  callable from any status.
- New: `trashedAt` field, `trash()` / `restore()` methods (mirroring `Category`'s
  pattern), and a static shape for "duplicate" (constructed by the use case, not the
  entity, since it needs a fresh id).

## Repository changes (`DrizzleLegalDocumentRepository` / `ILegalDocumentRepository`)

- `update()` drops the guard block entirely — plain `UPDATE ... WHERE id = ...` for every
  editable column (title, content, version, effectiveDate, status, reviewNote).
- `publish()` keeps the transaction (set this row `published` + hash/timestamp, archive
  siblings) but is callable regardless of the row's prior status.
- `getPublished()` / `listPublished()` / `listCurrent()` add `isNull(trashedAt)`.
- New: `trash(id)`, `restore(id)`, `delete(id)` (hard delete), `listTrashed()` — same
  signatures as `DrizzleCategoryRepository`.

## Use case changes (`src/application/use-cases/legal/`)

- `SaveLegalDocumentDraftUseCase.execute` gains `version` and `effectiveDate` as required
  input (no more internal `getMaxVersion() + 1` auto-compute — the use case still *reads*
  `getMaxVersion` to hand the admin UI a suggested default, but the value that gets saved
  is whatever the caller passes).
- `executeEdit` accepts `version`, `effectiveDate`, `status` alongside `title`/`content`.
- `SubmitForReviewUseCase` and the old guarded `PublishLegalDocumentUseCase` are replaced
  by one `SetLegalDocumentStatusUseCase` (any target status), which runs the
  `published`-specific side effects (anchor check, hash, archive siblings, security event)
  only when `targetStatus === 'published'`.
- New: `DuplicateLegalDocumentUseCase` (reads source row, creates a new `draft` row with
  copied slug/domain/title/content, suggested version/date).
- New: `TrashLegalDocumentUseCase`, `RestoreLegalDocumentUseCase`,
  `DeleteLegalDocumentPermanentlyUseCase` — mirroring the leads/categories trash use
  cases already in the codebase.

## API changes (`app/api/admin/legal/**`)

- `PATCH /api/admin/legal/[id]` becomes the single endpoint for every field edit,
  including `status`. Body: any subset of `{ title, content, version, effectiveDate,
  status, reviewNote }`. The existing `/api/admin/legal/[id]/publish` and
  `/submit-review` routes are removed — status changes (to any of the 4 values) go
  through this one `PATCH`. When the resulting `status === 'published'`, the handler
  runs the same side effects as today's publish flow (active-anchor check → 422 if
  missing, content hash, archive sibling published rows, `legal_document_published`
  security event) and additionally requires the caller to be `owner` (403 otherwise);
  any other status value only requires `legal.manage`.
- New `POST /api/admin/legal/[id]/duplicate`.
- New `POST /api/admin/legal/[id]/trash`, `POST /api/admin/legal/[id]/restore`,
  `DELETE /api/admin/legal/[id]` (hard delete, trash-only guard: 409 if not trashed).
- `GET /api/admin/legal` gains `?trash=1` to list trashed documents, mirroring
  `/api/admin/categories`.

## Admin UI changes

- `LegalDocumentEditorClient`: version and effective date become always-editable form
  inputs (number + date picker) instead of read-only display. Status becomes a `Select`
  (draft/in_review/published/archived) instead of separate action buttons; saving while
  the *current* (pre-edit) status is `published` shows a confirmation dialog first. A
  "Duplicate as new version" button next to Save. Anchor-blocking only applies when the
  selected status is `published`.
- `LegalDocumentManagerClient` / `/admin/legal` page: add a "View Trash" link (same
  pattern as `/admin/categories?trash=1`) and a `LegalDocumentsTrashView` component
  (Restore / Delete forever, confirmation on permanent delete).

## Footer change

`Footer.tsx`: replace the desktop grouped block and the mobile micro-line with one
`Legal ▾` trigger (a `Link` to `/legal` plus a small popover/dropdown — likely reusing the
existing `popover.tsx`/`dropdown-menu.tsx` primitive already in `components/ui`) showing
the same domain-grouped links on hover/click. `FooterServer.tsx`'s data-fetching (already
guarded against missing `DATABASE_URL`) is unchanged; only what `Footer.tsx` does with
`legalLinks` changes.

## Migration plan

1. Additive migration: `trashedAt` column + index on `legal_documents`. No backfill
   needed (nullable, defaults to unset).
2. No data migration for existing rows' `version`/`effectiveDate` — the 6 seeded documents
   already have sensible values from Fase 1–5; this spec only changes *how future edits*
   set those fields, not their current values.

## Risks / trade-offs (accepted per Gustavo's decisions above)

- Losing hard immutability means `contentHash`/`security_events` are no longer a
  guarantee of "what's been live since publish" — a published row's content can drift
  after the fact without a new audit entry. Accepted: the confirmation dialog on editing
  a published row is the only guard against accidental drift.
- Manual version numbers can collide or go backwards for the same slug. The existing
  unique index on `(slug, version)` stays as a safety net — a duplicate version number
  will fail with a clear 409/500 rather than silently overwriting history, but the admin
  is otherwise free to pick any number.
