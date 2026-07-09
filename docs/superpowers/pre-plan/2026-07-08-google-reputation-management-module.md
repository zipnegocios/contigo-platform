# Work Order: Google Business Reputation Management Module

**Date:** 2026-07-08
**Repo:** `zipnegocios/contigo-platform` — branch `main`
**Status:** PLANNED — implementation must not begin until Phase 0 (Audit) is closed
**Depends on:** Auth hardening merge verification (`2026-07-04-auth-hardening-admin-staff.md`), Compliance module APP 8 decision (`2026-07-06-compliance-legal-pages.md`) — Phase 6 only

---

## 1. Context & objective

Contigo Constructions needs to manage its Google Business Profile reputation end-to-end: sync reviews into the platform, moderate/curate what the public website shows, publish owner replies, request reviews from won leads via Resend, and analyze reputation trends.

This is **not a reviews widget**. It is a CRM submodule following the existing Clean Architecture (domain → application → infrastructure → presentation), integrated with:

- **Leads CRM** → determines when to request a review (pipeline stage trigger).
- **Resend** → sends review request emails + reminders (verified subdomain `updates.contigoconstructions.com.au`).
- **Google Business Profile** → source of truth for reviews; reply publishing target.
- **OpenAI** → sentiment, classification, reply drafting (**conditional — see §9 Legal gate**).
- **Public website** → renders only admin-approved reviews from the local cache, never live from Google.

### Core architectural decision

The website **never queries Google directly**. Reviews are synced into PostgreSQL and served from the local `google_reviews` table. Rationale: caching, moderation (hide/feature/pin), tagging, AI enrichment, statistics, and complete independence from Google API quotas at render time.

```
Google Business Profile ──OAuth2──▶ ReviewSyncService ──▶ PostgreSQL
                                                            ├──▶ Public website (curated subset)
                                                            └──▶ Admin dashboard (full management)
```

---

## 2. Known infrastructure facts (provided by Gustavo, to be verified in Phase 0)

| Item | Value |
|---|---|
| GCP project | `contigo-platform` / `delta-entity-500212-d8` / number `121307221241` |
| GCP organization | `contigoconstructions.com.au` |
| Enabled APIs | My Business Account Management API (v1), Business Profile Performance API |
| GBP admin account | `gustavo@contigoconstructions.com.au` |
| Location ID | `2373348681553577527` |
| OAuth client ID | `121307221241-...apps.googleusercontent.com` (env var only) |
| OAuth redirect URIs | OAuth Playground (temporary — production callback to be added in Phase 2) |
| Scope | `https://www.googleapis.com/auth/business.manage` |

### 🔴 Security preconditions (non-negotiable, before any commit)

- [ ] **Rotate the OAuth client secret** in Google Cloud Console — the current secret was shared in plaintext outside the secret store and must be considered compromised.
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_LOCATION_ID` live **only** in EasyPanel env vars (production) and `.env.local` (dev, gitignored). Never in any file committed to the repo, including this plan and archived markdown.
- [ ] Confirm `.env.local` and `.env*` patterns are in `.gitignore` before first commit of this module.

---

## 3. ⚠️ Critical API corrections vs. the original spec

The original module spec assumed reviews are available on the v1 Account Management API. **They are not.** Verified constraints that reshape Phase 0/2:

1. **Reviews exist only on the legacy v4 API** (`https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews`). The v1 Account Management API manages accounts/invitations only; the Business Profile Performance API covers metrics, not reviews.
2. **`accounts/me` is not a valid v4 alias for the reviews endpoint.** The numeric account name must be resolved first via `GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts` (accounts.list) using the same OAuth token.
3. **Google Business Profile APIs require prior approval.** Enabling the API in the console is not enough — default quota is **0 QPM** until Google approves the access request form for the project. Phase 0 must verify actual quota > 0 with a live call before any implementation.
4. **Owner replies** use v4 `accounts.locations.reviews.updateReply` (PUT) and `deleteReply` (DELETE) — this part of the original spec is correct.
5. **Review-request attribution is heuristic.** Google provides no way to link a submitted review to a specific request email. "Reviewed" status on a `review_requests` row can only be inferred (new review whose reviewer display name fuzzy-matches the lead contact, within N days of the request). The plan treats this as best-effort, never authoritative.
6. **Review direct link** for the CTA button uses the Place ID short link format (`https://search.google.com/local/writereview?placeid=...`) — the Place ID must be captured in Phase 0 (it is not the same as the GBP location ID).

---

## 4. Scope & milestones

Deliberately split into three shippable milestones so v1 delivers business value without waiting for AI/analytics.

| Milestone | Contents | Phases |
|---|---|---|
| **M1 — Sync & Display** | OAuth infra, review sync (manual + scheduled), admin moderation, public website section | 0–4 |
| **M2 — Review Requests** | Won-lead trigger, Resend templates, reminders, request tracking | 5 |
| **M3 — Intelligence** | OpenAI enrichment (gated), analytics dashboard, automation rules | 6–7 |

### Out of scope for this work order (roadmap)

- SMS / WhatsApp channels (email via Resend only).
- Review translation.
- Multi-location support (single location hardcoded via env var, schema keeps `locationId` column for future-proofing).
- Business Profile Performance API metrics (separate future work order).

---

## Phase 0 — Mandatory audit (blocking)

- [ ] `git clone --depth 1 --branch main` + `git log -1 --format="%H %ad %s" --date=short` — anchor the exact commit this plan targets. Confirm auth-hardening changes are live on `main`.
- [ ] **Resolve numeric GBP account ID**: with a temporary OAuth Playground token, call `GET /v1/accounts` and record the `accounts/{id}` name. Store as `GOOGLE_ACCOUNT_ID` env var.
- [ ] **Verify v4 reviews quota is approved**: `GET /v4/accounts/{accountId}/locations/2373348681553577527/reviews` must return 200 with data. If 403/429 with quota error → **STOP**: submit the GBP API access request form and park this work order until approved.
- [ ] **Capture the Place ID** (Maps Place ID, for the write-review deep link) via the GBP dashboard or Places API. Record as `GOOGLE_PLACE_ID` env var.
- [ ] **Obtain a production refresh token**: run the OAuth consent flow with `access_type=offline&prompt=consent` for `gustavo@contigoconstructions.com.au`. Confirm the GCP OAuth consent screen is in **Production** status (not Testing — testing refresh tokens expire after 7 days).
- [ ] Confirm current permission catalog convention (`permissions` table) and pick keys: `reviews.view`, `reviews.moderate`, `reviews.reply`, `reviews.requests`, `reviews.settings`.
- [ ] Confirm scheduler approach for the VPS/EasyPanel deployment (no Vercel cron available). Decision to record: **system cron on the VPS hitting `POST /api/internal/reviews/sync` with a shared `CRON_SECRET` header** vs. in-process `node-cron` singleton. Default recommendation: system cron + protected endpoint (survives Swarm restarts predictably, observable, no duplicate scheduling across replicas).
- [ ] Confirm rate-limit posture: sync endpoint is internal; public endpoints added in Phase 4/5 must be evaluated against the existing Cloudflare Free-plan rule budget (currently consolidated quote-status + quote-form rule).
- [ ] **Closing note for Phase 0** documenting: commit hash, account ID, quota status, Place ID, refresh token stored in EasyPanel, scheduler decision.

---

## Phase 1 — Schema & domain layer

Drizzle schema additions (`src/infrastructure/db/schema.ts`), all English identifiers, following existing conventions (uuid PKs, `withTimezone` timestamps, cascade rules, indexes).

- [ ] `google_reviews` — local cache. Columns: `id`, `googleReviewId` (unique, the v4 review name), `locationId`, `reviewerName`, `reviewerAvatarUrl`, `reviewerProfileUrl`, `rating` (1–5 int), `comment` (text, nullable — star-only reviews exist), `reviewCreatedAt`, `reviewUpdatedAt`, `language`, `ownerReply` (text, nullable), `ownerReplyAt`, `isVisible` (bool, default false — **opt-in publishing**), `isFeatured`, `isPinned`, `archivedAt`, `internalNotes`, `aiSummary`, `aiSentiment` (enum: positive/neutral/negative, nullable), `aiCategories` (jsonb string[]), `spamScore` (numeric, nullable), `deletedOnGoogleAt` (soft flag — Google deletions never hard-delete locally), `syncedAt`, `createdAt`, `updatedAt`. Indexes: `googleReviewId` (unique), `rating`, `isVisible`, `reviewCreatedAt`.
- [ ] `review_tags` + `google_review_tags` (join) — admin-defined labels.
- [ ] `review_requests` — `id`, `leadId` FK (cascade), `contactEmail`, `contactName`, `status` enum (`scheduled`/`sent`/`opened`/`clicked`/`reviewed_inferred`/`expired`/`cancelled`), `templateId` FK, `scheduledFor`, `sentAt`, `openedAt`, `clickedAt`, `reminderCount`, `nextReminderAt`, `matchedReviewId` FK nullable, `createdAt`. Index on `leadId`, `status`, `nextReminderAt`.
- [ ] `review_request_templates` — `id`, `name`, `subject`, `bodyHtml` (uses `renderEmailShell` shell), `isDefault`, timestamps.
- [ ] `review_sync_logs` — `id`, `trigger` (`manual`/`scheduled`), `startedAt`, `finishedAt`, `status`, `newCount`, `updatedCount`, `deletedCount`, `errorMessage`.
- [ ] `review_settings` — single-row settings: `syncFrequencyMinutes`, `requestDelayDays`, `maxRemindersPerRequest`, `reminderIntervalDays`, `minStarsPublic`, `defaultDisplayMode`, `websiteVisibilityFlags` (jsonb — the show name/avatar/date/etc. toggles), `automationRules` (jsonb — M3).
- [ ] Domain entities in `src/core/entities/`: `GoogleReview`, `ReviewRequest`, `ReviewRequestTemplate`, `ReviewSettings` — with repository interfaces in `src/core/repositories/`.
- [ ] Drizzle migration generated + applied to dev DB. `npx tsc --noEmit` clean.
- [ ] Seed migration: insert `permissions` catalog rows (`reviews.*` keys) and a default `review_request_templates` row.

---

## Phase 2 — Google OAuth infra & Sync service

- [ ] `src/infrastructure/services/GoogleBusinessProfileService.ts` implementing `IGoogleBusinessProfileService` (core interface). Responsibilities: token refresh from `GOOGLE_REFRESH_TOKEN` (in-memory access-token cache with expiry), `listReviews()` (v4, paginated via `pageToken`, 50/page), `updateReply()`, `deleteReply()`.
- [ ] Error taxonomy: distinguish auth failures (refresh token revoked → surface in dashboard settings as "Reconnect required"), quota errors (backoff, log), transient 5xx (retry ×3 exponential).
- [ ] `SyncGoogleReviewsUseCase` (`src/application/use-cases/reviews/`): full-pull reconciliation — upsert by `googleReviewId`, detect edits (`reviewUpdatedAt` change), detect owner-reply changes, flag local rows missing from Google as `deletedOnGoogleAt`. **Moderation fields (`isVisible`/`isFeatured`/`isPinned`/tags/notes/AI fields) are never overwritten by sync.** Writes a `review_sync_logs` row per run.
- [ ] `POST /api/admin/reviews/sync` — manual "Sync Reviews" button endpoint, gated by `reviews.view`.
- [ ] `POST /api/internal/reviews/sync` — cron endpoint, gated by `CRON_SECRET` header comparison (constant-time). Reads `syncFrequencyMinutes` from settings and no-ops if last successful sync is more recent (makes the cron schedule itself simple: every 15 min, service decides).
- [ ] VPS crontab entry documented in the infrastructure runbook (Doc 04 annex update noted for closing report).
- [ ] Verification: manual sync against production GBP data in dev environment; confirm idempotency (second run → 0 new / 0 updated).

---

## Phase 3 — Admin dashboard

New sidebar section `Google Business` under `/admin/(protected)/reviews/`:

- [ ] **Reviews list** (`/admin/reviews`): table + card views, columns per spec (avatar, name, stars, comment excerpt, date, Google link, visibility state, featured/pinned, tags). Filters: rating, visibility, sentiment (M3-ready, hidden until populated), tag, date range, has-reply. Sort: recent, oldest, rating, comment length.
- [ ] **Row actions**: Show/Hide (toggles `isVisible`), Feature, Pin, Archive, Open on Google, Add tags, Internal notes. All gated `reviews.moderate`. Each action writes a `lead_activities`-style audit entry? → No: reviews are not lead-scoped. Instead reuse the security-events/audit pattern from auth hardening: insert into the existing audit log with `entity: 'google_review'`.
- [ ] **Reply composer**: textarea + character guidance, `Publish to Google` (calls `updateReply`), `Delete reply`. Gated `reviews.reply`. On publish success, update local row immediately (optimistic sync).
- [ ] **Settings page** (`/admin/reviews/settings`): sync frequency, connection status (token health from last sync log), website visibility toggles (per-field show flags, min-stars filter, display mode default), request timing config (used in Phase 5). Gated `reviews.settings`.
- [ ] **Dashboard tab** (`/admin/reviews` header cards): total reviews, average rating, star distribution, pending replies count, last sync status. Computed with simple SQL aggregates (no `review_analytics_daily` table yet — deferred to Phase 7, YAGNI until dashboards are slow).
- [ ] Brand tokens throughout (gold `#B8962E`/`#E2C063`, petrol `#0D3C4C`, existing admin shadcn/ui patterns).

---

## Phase 4 — Public website section

- [ ] `GetPublicReviewsUseCase`: reads `google_reviews` where `isVisible = true` and `archivedAt IS NULL` and `deletedOnGoogleAt IS NULL`, applies settings (min stars, ordering mode: recent/rating/featured-first/random), applies per-field visibility flags at the DTO level (fields the admin disabled are simply absent from the payload — not hidden client-side).
- [ ] `GET /api/public/reviews` — cached (`revalidate` / `Cache-Control`), no auth. Evaluate against Cloudflare rule budget; static-cacheable so likely exempt from rate-limit rules.
- [ ] Website section component (`src/presentation/sections/`): **v1 ships two display modes only — Carousel (GSAP, consistent with services carousel patterns) and Grid.** The other eight modes in the original spec are settings-driven variants deferred to roadmap; the `displayMode` setting enum keeps room for them.
- [ ] Aggregate header: average rating + count + "Reviews from Google" attribution (Google branding guidelines require attribution when displaying GBP content).
- [ ] Accessibility: prefers-reduced-motion fallback, aria-live for carousel, semantic markup + `Review`/`AggregateRating` JSON-LD structured data (SEO — consistent with the carpentry/joinery positioning, no service-category claims beyond approved services).
- [ ] SSR fallback (no-JS renders grid).

---

## Phase 5 — Review request lifecycle (M2)

- [ ] **Trigger hook**: extend `ChangeLeadStageUseCase` — when target stage has `terminalKind = 'won'`, schedule a `review_requests` row (`status: scheduled`, `scheduledFor = now + requestDelayDays` from settings). This is a new side effect on a use case that currently has none for terminal stages — must be best-effort (failure logged, never fails the stage change), matching the existing notification pattern.
  - Open question for Daniel/Anamaria (record answer in closing report): trigger on `won` directly, or on a later signal (e.g. a manual "Job completed" action)? v1 default: on `won` + configurable delay; a per-lead "Cancel request" action covers exceptions.
- [ ] **Manual trigger**: button on lead detail page ("Request review") for leads already won, gated `reviews.requests`.
- [ ] **Dispatcher**: extend the internal cron endpoint (or a sibling `POST /api/internal/reviews/dispatch-requests`) — sends due `scheduled` requests and due reminders via `ResendEmailService` (new methods using `renderEmailShell`, sender display name "Contigo Constructions | Reviews", from `noreply@updates.contigoconstructions.com.au`). CTA deep link: `https://search.google.com/local/writereview?placeid={GOOGLE_PLACE_ID}`.
- [ ] **Reminders**: up to `maxRemindersPerRequest` (default 2), spaced `reminderIntervalDays` (default 7). A request with no click after final reminder + interval → `expired`.
- [ ] **Open/click tracking**: enable Resend open/click tracking for these sends via webhooks (`POST /api/webhooks/resend`, signature-verified) updating `openedAt`/`clickedAt`. If webhook setup proves heavy, fallback v1: first-party click redirect (`/r/review-request/{id}` → logs click → 302 to Google).
- [ ] **Reviewed inference**: during each sync, attempt fuzzy match of new reviews (reviewer name vs. contact name, review date > request sentAt) → set `status: reviewed_inferred` + `matchedReviewId`. Clearly labeled as inferred in the UI.
- [ ] **Requests dashboard** (`/admin/reviews/requests`): list with status chips (Scheduled/Sent/Opened/Clicked/Reviewed*/Expired/Cancelled), per-request cancel, funnel stats (send/open/click/review rates).
- [ ] **Compliance check (Spam Act 2003)**: requests are sent to existing customers about a service they purchased (inferred consent under the Act), but every email must still carry the sender's business identification (ABN footer already in `renderEmailShell` footer — verify) and a functional unsubscribe. Add `unsubscribedAt` to a suppression mechanism (simplest: flag on `lead_contacts` or a `review_request_suppressions` table by email) honored by the dispatcher.

---

## Phase 6 — AI enrichment (M3, **gated — see §9**)

- [ ] ⛔ **Gate**: do not implement until the compliance module's APP 8 decision (OpenAI overseas disclosure) is resolved with the legal consultant. If OpenAI is retained and disclosed in the Privacy Policy, proceed; reviews contain personal information (reviewer names).
- [ ] `AnalyzeReviewUseCase`: sentiment (positive/neutral/negative), category tags constrained to the **approved services taxonomy** (Carpentry, Cladding, Gyprock Fixing & Flushing, Additional Services — not the generic construction list from the original spec, which includes services Contigo does not offer), aspect classification (quality/communication/pricing/professionalism/speed/cleanliness), optional summary. Batch-run on sync for new reviews; manual re-run per review.
- [ ] `GenerateReviewReplyUseCase`: drafts a reply in brand voice (professional, friendly, Australian English, signs as Contigo Constructions), always returned as a **draft requiring human edit/approval** — never auto-published.
- [ ] Prompt templates stored in code (not DB) for auditability; model + token usage logged.

---

## Phase 7 — Analytics & automation (M3)

- [ ] `review_analytics_daily` aggregate table + nightly rollup (same cron infra) **only if** live aggregates prove slow — otherwise SQL views. Decide with real data volume (a carpentry business's review count likely stays in the low hundreds; premature aggregation is over-engineering).
- [ ] Analytics page: reviews/month chart, rating trend, star distribution over time, response-time metric, request funnel over time. Space Grotesk for numerical displays per brand tokens.
- [ ] Automation rules (settings-driven, evaluated on sync): v1 rule set limited to — `new review → notify admin email`, `rating ≤ 2 → notify admin + create lead task if matched to a lead`, `rating = 5 → (optional) thank-you note reminder`. The full IF/THEN rule builder from the original spec is roadmap.

---

## Phase 8 — Hardening, docs & closing

- [ ] `npx tsc --noEmit`, lint, Playwright visual pass on admin pages + public section (existing `sync_playwright` pattern, `networkidle` + 1500ms).
- [ ] Verify no secret material anywhere in the diff (`git grep` for client ID prefix, `GOCSPX`, token fragments).
- [ ] Update technical annexes: Doc 02 (DB dictionary — new tables), Doc 03 (API reference — new endpoints), Doc 04 (runbook — cron entries, env vars, GBP reconnect procedure), Doc 05 (module map — new module section).
- [ ] Env var checklist for EasyPanel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (rotated), `GOOGLE_REFRESH_TOKEN`, `GOOGLE_ACCOUNT_ID`, `GOOGLE_LOCATION_ID`, `GOOGLE_PLACE_ID`, `CRON_SECRET`.
- [ ] **Closing report** (mandatory): commit range, decisions taken on all open questions, deviations from this plan, verification evidence (sync log samples, email screenshots, Playwright captures), remaining roadmap items.

---

## 9. Legal & compliance notes

1. **APP 8 / OpenAI**: Phase 6 blocked pending the legal consultant's ruling already in flight for the compliance pages module. If OpenAI is dropped platform-wide, Phase 6 is removed or re-scoped to a local model/none.
2. **Spam Act 2003**: review request emails = commercial electronic messages → sender identification + unsubscribe required (Phase 5 checklist).
3. **Privacy Policy**: syncing reviewer names/avatars into the platform database is collection of personal information from a third party — flag to the legal consultant as an addition to the Privacy Policy scope (new data category), alongside the pending small-business-exemption decision.
4. **Google attribution**: displayed reviews must be attributed to Google per GBP content policies; no editing of review text ever (moderation = show/hide only).

---

## 10. Open questions (answers required before their phase starts)

| # | Question | Blocks |
|---|---|---|
| 1 | Is the GBP v4 reviews quota approved for project `delta-entity-500212-d8`? | Phase 0 → everything |
| 2 | Trigger review request on `won` stage, or on a separate "completed/invoice paid" signal? (No invoice-paid signal exists until Xero integration.) | Phase 5 |
| 3 | Confirm with Anamaria the default public filter (5★ only vs. 4★+)? | Phase 4 |
| 4 | APP 8 / OpenAI retention decision from legal consultant | Phase 6 |
| 5 | Resend webhooks vs. first-party click redirect for tracking? | Phase 5 |

---

## Closing report

**Date:** 2026-07-08
**Commit range:** implemented on top of `8d91415` (main, 2026-07-06) — not yet committed to git as of this report; see `git status` for the full file list.
**Phases delivered:** 1, 2, 3, 4, 5, 7. **Phase 6 (AI enrichment) intentionally not started** — still gated on the APP 8/OpenAI legal decision per §9. **Phase 8 (hardening/docs) partially covered** by this report; see remaining items below.

### Phase 0 audit — status: NOT cleanly closed, proceeded anyway on explicit instruction

- Commit hash anchor: `8d91415` (main, 2026-07-06).
- **GBP v4 reviews quota: confirmed NOT approved.** A live call to `GET /v1/accounts` returned `429 RESOURCE_EXHAUSTED` with `quota_limit_value: "0"` for project `delta-entity-500212-d8`. Per this plan's own §3.3 and Phase 0 checklist, this is the documented STOP condition ("submit the GBP API access request form and park this work order until approved"). The user explicitly chose to proceed with implementation regardless, accepting that Phases 2/5's live-API paths are unverified against real Google data until the access request is approved.
- `GOOGLE_ACCOUNT_ID` could not be resolved to a real numeric value (the `accounts.list` call that would resolve it is the same call that hit the quota wall). `GoogleBusinessProfileService` does **not** rely on the env var for this — it always calls `accounts.list` itself and caches the resolved `accounts/{id}` name in memory, so this will self-heal the first time quota is available.
- `GOOGLE_PLACE_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `CRON_SECRET` are present in `.env.local` (dev only, never committed).
- **Security incident**: the OAuth client secret was pasted in plaintext into the chat during this session (twice, partially redacted the second time). Flagged live in-session; per this plan's own §2 precondition, it must be considered compromised and **rotated in Google Cloud Console before production use**. Not verified as rotated as of this report.
- Scheduler decision: system cron + protected endpoint, per the plan's own default recommendation. Not yet installed on the VPS — crontab lines are documented below for the ops runbook.

### Phase 1 — Schema & domain layer

- Migrations: `20260708204817_add_google_reviews_module.sql` (7 tables + 4 enums), `20260708205010_seed_reviews_permissions_and_default_template.sql` (permissions + default template), `20260708230422_add_review_request_suppressions.sql` (Phase 5 addition). All applied; confirmed present in the DB as of this report (`google_reviews`, `google_review_tags`, `review_tags`, `review_requests`, `review_request_templates`, `review_sync_logs`, `review_settings`, `review_request_suppressions`).
- Used `drizzle-kit generate` + `migrate` instead of `db:push` — an unrelated pre-existing drift (`media_tags_name_unique` constraint) blocks `db:push` with an interactive prompt that can't be scripted. This is a **pre-existing repo issue, not introduced by this work** — worth a separate fix.
- **Deviation**: `review_settings` has no explicit "ordering mode" column, despite Phase 4 prose referencing "ordering mode: recent/rating/featured-first/random" as a setting. Fixed `featured-first` (pinned always on top) is used instead; adding a real column is a small follow-up if configurability is wanted.

### Phase 2 — OAuth infra & sync

- `GoogleBusinessProfileService`, `SyncGoogleReviewsUseCase`, manual (`/api/admin/reviews/sync`) and cron (`/api/internal/reviews/sync`, `CRON_SECRET`-gated) endpoints. **Not verified against live Google data** (Phase 0 quota gate).
- VPS crontab line to add when deploying (not yet installed):
  ```
  */15 * * * * curl -s -X POST -H "x-cron-secret: $CRON_SECRET" https://contigoconstructions.com.au/api/internal/reviews/sync
  */15 * * * * curl -s -X POST -H "x-cron-secret: $CRON_SECRET" https://contigoconstructions.com.au/api/internal/reviews/dispatch-requests
  ```

### Phase 3 — Admin dashboard

- `/admin/reviews` (list, filters, sort, moderation actions, reply composer, tags, notes), `/admin/reviews/settings`. `reviews.*` permission keys added to the staff permission editor UI (`staffPermissions.ts`), which the plan didn't explicitly call out but is necessary for the granular permissions to actually be grantable.

### Phase 4 — Public website section

- `GetPublicReviewsUseCase`, `GET /api/public/reviews` (cached, `revalidate=300`), `ReviewsSection` + `ReviewsCarouselClient` (grid is the real SSR/no-JS/reduced-motion fallback; carousel is a post-mount GSAP enhancement — no hydration mismatch risk since the DOM structure only changes after mount). Wired into the homepage between `MasterBuildersSection` and `ContactSection`. Currently renders nothing (0 reviews) since no data has synced yet.

### Phase 5 — Review request lifecycle

- **Open question #2 (trigger timing) resolved as**: trigger on `won` directly + configurable `requestDelayDays`, with manual cancel — the plan's own v1 default, since no invoice-paid signal exists yet.
- **Open question #5 (tracking)** resolved as: first-party click redirect (`/r/review-request/[id]`), **not** Resend webhooks — judged unnecessary complexity for v1, and explicitly allowed as the documented fallback.
- ⚠️ **Compliance gap, unresolved**: `renderEmailShell`'s footer has no ABN. Spam Act 2003 requires sender business identification. Flagged with a code comment in `ResendEmailService.sendReviewRequestEmail` — needs the real ABN from Gustavo before any production send.
- Unsubscribe suppression implemented and honored by the dispatcher.

### Phase 7 — Analytics & automation

- No new aggregate table (YAGNI per plan's own note — review volume is low hundreds at most for this business). `/admin/reviews/analytics` computes everything live in JS from existing repositories.
- v1 automation rule set (new review/low rating → admin email; low rating → lead task if matched; 5★ → optional thank-you task, disabled by default) implemented exactly as scoped, configurable via toggles on the settings page, backed by the `automationRules` jsonb column that already existed from Phase 1.

### Remaining before this can be considered production-ready

- [ ] Rotate the leaked OAuth client secret in Google Cloud Console.
- [ ] Submit/confirm the GBP API access request so quota > 0, then re-verify Phase 0's live-call checklist for real.
- [ ] Get Contigo Constructions' ABN and add it to `renderEmailShell`.
- [ ] Install the two crontab lines on the VPS once deployed.
- [ ] Manual sync against real GBP data once quota is approved; confirm idempotency (second run → 0 new / 0 updated) as the plan's Phase 2 verification step requires.
- [ ] `npx tsc --noEmit` and `eslint` are clean as of every phase in this report; no Playwright visual pass was run (no browser automation used this session, per explicit user preference — manual verification is the user's own responsibility going forward).
- [ ] Doc 02 (DB dictionary), Doc 03 (API reference), Doc 04 (runbook), Doc 05 (module map) — none of these live in this repo; this closing report is the only durable record of the module until those are updated wherever they actually live.
- [ ] Decide the real ordering-mode setting for public reviews if `featured-first` fixed isn't good enough (Phase 1 deviation above).
