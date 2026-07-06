# Request a Quote — Technical Documentation

Audience: developers working on this codebase. Covers the full lifecycle: public
form submission → Quote + Lead creation → notification emails → admin pipeline
management → public tracking → archive/trash/permanent-delete.

## Architecture overview

Follows the repo's layered DDD structure (see root `CLAUDE.md`):

```
Presentation  → QuoteForm.tsx, FormRenderer.tsx, admin Leads UI, /quote-status UI
API Routes    → app/api/quotes, app/api/admin/leads/**, app/api/quote-status/**
Application   → CreateQuoteUseCase, CreateLeadForQuoteUseCase, ChangeLeadStageUseCase,
                GetTrackingPanelDataUseCase, DeleteLeadPermanentlyUseCase, etc.
Infrastructure→ Drizzle*Repository classes, ResendEmailService, OpenAIEmbeddingService, R2StorageService
Core          → Quote, Lead, LeadEvent, LeadDocument, LeadNote, LeadMessage,
                LeadContact, LeadActivity, LeadTask entities + repository interfaces
```

Use cases instantiate their own dependencies directly in each API route — there's
no DI container in this codebase.

## 1. Public submission

The "Request a Quote" form is **Form-Builder-driven, not static**. `QuoteForm.tsx`
fetches its schema from `GET /api/forms/request-a-quote` (slug `request-a-quote`,
seeded by migration `20260622193729_seed_request_a_quote_form.sql`, editable at
`/admin/leads/management/form-builder/request-a-quote/builder`) and renders it via
`FormRenderer.tsx`. Each field carries a `mapsToSystemField` (name/email/phone/
service/message) so the generic Form Builder schema maps onto the fixed
`/api/quotes` payload shape. `QuoteFormModal.tsx` wraps the same component for
modal entry points (`ContactSection.tsx`, `HeroSection.tsx`, `AboutClosingCTA.tsx`).
Attachments (max 3 images) upload directly to the private `contigo-quotes` R2
bucket via `uploadQuoteAttachment()`, outside the form state.

**Submission path:**

```
QuoteForm.onSubmit
  → POST /api/quotes (zod-validated: name, email, phone?, service, message, attachmentUrls?)
  → CreateQuoteUseCase.execute()
      1. Quote.create(input)                          — domain entity
      2. quoteRepository.save(quote)                   — DB insert, awaited
      3. createLeadForQuote.execute(quote)              — CreateLeadForQuoteUseCase (see below)
      4. Promise.all([                                  — both awaited, response waits on these
           emailService.sendQuoteConfirmation(quote),    — to client
           emailService.sendAdminNotification(quote),    — to staff (ADMIN_EMAIL)
         ])
      5. generateEmbeddingAsync(quote)                  — fire-and-forget, NOT awaited
      → returns quote.trackingToken
  → client redirects to /quote-status/{trackingToken}
```

`CreateLeadForQuoteUseCase` (`src/application/use-cases/leads/CreateLeadForQuoteUseCase.ts`)
is where **the Lead is born at submission time**, not later when an admin first
opens the quote (explicit design decision, see code comment). It:
1. Finds the default `pipeline_stages` row.
2. Creates the `Lead` (`stageId` = default stage).
3. Best-effort seeds a primary `LeadContact` from the quote's name/phone/email
   (failure here is logged, not fatal — the phone form field is optional but
   `lead_contacts.phone` is `NOT NULL`, so a missing phone falls back to `''`, a
   documented trade-off).
4. Writes a `lead_activities` row (`type: 'stage_change', payload: {from: null, to: <default stage>}`).

Embedding generation (`generateEmbeddingAsync`) builds text from
`name + service + message`, calls `OpenAIEmbeddingService`, and stores the vector
back onto `quotes.descriptionVector` via a second `quoteRepository.update()` call.
Failure only logs — it never affects the user-facing response.

## 2. Data model

| Table | Purpose |
|---|---|
| `quotes` | The raw public submission: name/email/phone/service/message, unique `trackingToken` (drives the public tracking URL), `status` enum, `attachmentUrls` (jsonb string[]), `descriptionVector` (jsonb embedding), `formVersionId`/`formData` (see Known legacy areas). |
| `leads` | One row per quote (`quoteId` FK, `onDelete: cascade`) — the CRM object. `stageId` FK to `pipeline_stages`, `estimatedValue` (cents), independent `archivedAt`/`trashedAt` soft-delete states, `notificationsViewedAt`. |
| `pipeline_stages` | Admin-configurable Kanban columns: `key`, `label`, `position`, `color`, `isDefault`, `terminalKind` (`'won'` \| `'lost'` \| `null`). |
| `lead_events` | Calls/visits/meetings/follow-ups: `type`, `scheduledAt`, `durationMinutes`, `status`, `location`, discriminated `metadata` jsonb. |
| `lead_documents` | Files on a lead. `direction` (`client_upload` \| `admin_sent` \| `internal`) — only `admin_sent` + unarchived documents are exposed on the public tracking page. Optional `sourceMediaId` if reused from the Media Library (excluded from R2 cleanup on delete). |
| `lead_notes` | Internal, staff-only notes. Never shown to the client. |
| `lead_messages` | The client↔staff chat thread. `authorType` (`'client'` \| `'staff'`), `authorId` null when client, `readAt` drives unread counts. |
| `lead_contacts` | Additional contacts (name/phone/email/isPrimary), `roleId` FK (see Known legacy areas for the deprecated `role` enum). |
| `lead_activities` | Append-only audit/timeline log — `type` + `payload` jsonb. |
| `lead_tasks` | Lightweight per-lead task list: title/description/dueDate/status/assignee. |
| `task_checklist_items`, `task_comments`, `task_attachments` | Sub-resources of a task, all FK'd to `lead_tasks.id` with cascade delete. |

All child tables cascade-delete off `leads.id`, and `leads.quoteId` cascades off
`quotes.id` — deleting a `quotes` row deletes the entire tree in one statement
(exploited by `DeleteLeadPermanentlyUseCase`, see below).

## 3. Admin pipeline management

`/admin/leads` (`app/admin/(protected)/leads/page.tsx`) switches view via query
params: default = active pipeline (`LeadsBoard` — kanban via `LeadsKanban.tsx`
using `@dnd-kit`, or table via `LeadsViewToggle`), `?archived=1` = `LeadsArchiveView`,
`?trash=1` = `LeadsTrashView.tsx`.

Dragging a card to a new column calls `PATCH /api/admin/leads/[id]` with
`{ stageId }`, which runs `ChangeLeadStageUseCase`:
1. Validates the target stage exists.
2. Updates `lead.stageId`, writes a `lead_activities` stage_change entry.
3. Fires `sendStageChangeNotificationToClient` and `sendStageChangeNotificationToAdmin`
   (both best-effort — a send failure is logged, never fails the stage change).

Note: landing on a terminal stage (`terminalKind: 'won'/'lost'`) does **not**
auto-trigger any side effect today — explicitly out of scope per the use case's
own comment.

The lead detail page (`app/admin/(protected)/leads/[id]/page.tsx` +
`LeadDetailTabs.tsx`) loads quote/events/documents/activities/notes/contacts/
stages/unread-count in parallel and renders six tabs: **Summary, Activity,
Calls & Visits, Documents, Tasks, Messages**.

Lifecycle endpoints, all under `app/api/admin/leads/[id]/`:

| Route | Gate | Effect |
|---|---|---|
| `POST .../archive` | `leads.archive` | Sets `archivedAt` |
| `POST .../restore` | `leads.archive` | Clears `archivedAt` |
| `POST .../trash` | `leads.archive` | Sets `trashedAt` |
| `POST .../restore-trash` | `leads.archive` | Clears `trashedAt` |
| `POST .../delete-permanently` | `leads.delete` | Requires the lead already trashed; hard `DELETE FROM quotes` (cascades everything) + best-effort R2 cleanup of lead documents (excluding Media-Library-sourced), task attachments under `task-attachments/`, and quote attachment URLs. See `DeleteLeadPermanentlyUseCase`. |

There is **no route to manually create a lead** in the admin panel — leads only
come into existence via `CreateLeadForQuoteUseCase` off a public quote submission.

## 4. Public tracking (`/quote-status/[token]`)

`GetTrackingPanelDataUseCase` (`src/application/use-cases/portal/GetTrackingPanelDataUseCase.ts`)
builds one DTO, deliberately scoped safe for an **unauthenticated** viewer:
- `clientStage` comes from `leads.stageId` → `pipeline_stages` (via
  `GetLeadClientStageUseCase`) — **never** the frozen `quotes.status`.
- Documents filtered to `direction === 'admin_sent'` and unarchived only.
- Events filtered to exclude `cancelled`.
- Messages reversed to chronological order; `authorId` is never leaked to the client.

The page renders `TrackingStatusCard`, `TrackingDocumentsList`,
`TrackingScheduleList`, `TrackingMessages`, is marked `robots: noindex` (the
token is a private capability link), and lets the client post messages back via
`PostClientMessageUseCase`. Real-time updates use SSE routes under
`app/api/quote-status/[token]/`: `notifications/stream`, `status/stream`,
`schedule/stream`, `messages/stream`, plus `messages/unread-count`.

## 5. Permissions

| Permission key | Gates |
|---|---|
| `leads.view` | Read access (enforced at UI/route level where relevant) |
| `leads.edit` | Contacts, events, notes CRUD/archive/restore; sending/streaming messages |
| `leads.archive` | Archive / restore / trash / restore-trash a lead |
| `leads.delete` | Permanent lead deletion |
| `pipeline.manage` | Create/edit/reorder `pipeline_stages` |
| `tasks.manage` | All lead-task operations: CRUD/archive/restore, checklist items, comments, attachments, presigned uploads |
| `form_builder.manage` | Forms/form-versions CRUD, duplicate, revert (includes the Request-a-Quote form itself) |

Full list: `src/presentation/constants/staffPermissions.ts`. Enforcement is
`hasPermission(userId, key)`, checked per-route in `app/api/admin/**`. Admins
with `role = 'owner'` bypass all granular checks.

## 6. Known legacy / work-in-progress areas

Flag these before relying on them:

- **`leads.stage` enum column is deprecated**, superseded by `stageId` FK. Code
  comment: "left in place until a later migration confirms production reads
  exclusively from stageId, then drops this column + the enum." All current
  writes only touch `stageId`.
- **`lead_contacts.role` enum column is deprecated**, superseded by `roleId` FK
  to `lead_contact_roles`. "Application code no longer writes to this column."
- **`quotes.formVersionId`/`formData` are unpopulated today.** The columns and
  the comment describing "Form Builder Fase 4.2" wiring exist, but neither
  `Quote.create()`, `CreateQuoteUseCase`, nor `DrizzleQuoteRepository.save()`
  set them — every quote is saved with `formData: {}` and `formVersionId: null`,
  even though the form itself is now Form-Builder-driven. Don't treat this as
  "in use" in new code without checking again.
- **`quotes.status` is effectively frozen after creation.** The client tracking
  page and stage-change logic both deliberately read `leads.stageId` /
  `pipeline_stages` instead. No use case updates `quotes.status` after the
  initial `'new'` value.
- **`descriptionVector` embeddings are write-only.** Generated on every quote,
  but nothing reads them back yet (no semantic search UI wired up) — this is
  infrastructure for a future feature, not an active one.
- **Terminal pipeline stages have no wired side effects.** `terminalKind`
  (`'won'`/`'lost'`) exists on `pipeline_stages`, but `ChangeLeadStageUseCase`
  doesn't react to it.
- Contact seeding, embedding generation, and stage-change emails are all
  wrapped in try/catch and treated as **non-fatal** — a failure there never
  fails the parent request.
