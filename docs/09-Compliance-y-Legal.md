# 09 — Compliance & Legal Pages

Implements `docs/superpowers/pre-plan/2026-07-09-compliance-legal-pages.md` (v2).

## Module summary

- **Schema**: `legal_documents` (versioned, immutable once `published`/`archived`) and `security_events` (minimal audit log — no prior auth-hardening merge existed to reuse).
- **Domain**: `src/core/entities/LegalDocument.ts`, `src/core/repositories/ILegalDocumentRepository.ts`, `src/core/config/legal-requirements.ts` (anchor registry for Google/Meta integration hooks), `src/infrastructure/markdown/legal-markdown.ts` (shared remark/rehype pipeline).
- **Use cases**: `src/application/use-cases/legal/*` — draft → in_review → published → archived, with `PublishLegalDocumentUseCase` validating required anchors, computing the SHA-256 content hash, archiving the prior published version, and logging `legal_document_published` to `security_events`.
- **Admin API**: `app/api/admin/legal/**`, gated by the `legal.manage` permission; publish is additionally owner-only (this repo has no separate "admin" role, only `owner`/`staff`).
- **Admin UI**: `/admin/legal` (list grouped by domain, anchors indicator) and `/admin/legal/[id]` (editor, live anchors panel, publish confirmation with a line-diff summary, version history).
- **Public**: `/legal` (index) and `/legal/[slug]` (SSR, print stylesheet, version/hash HTML comment), `.well-known/security.txt`, sitemap entries — all sourced from `listPublished()`, so a document stuck in draft never produces a dead link.
- **Footer**: grouped Legal links (desktop) / single micro-line (mobile), fetched server-side via `FooterServer.tsx`.

## Status at handoff (2026-07-09)

All 6 documents are `in_review`, sent to the external legal consultant. **They are not published** — publishing is gated on consultant approval per the plan's legal note. Registered address resolved to 76 Coorara Ave, Payneham South SA 5070 (differs from the address on file with CBS, 25 Green Ave, Seaton — see matrix below).

## Verification performed

- `pnpm build` after every phase (0 TypeScript errors).
- End-to-end lifecycle test against staging DB (not committed, cleaned up after): created a throwaway document, ran it through draft → in_review → published, confirmed:
  - `security_events` row logged on publish.
  - Editing a `published` row throws (`LegalDocumentNotEditableError`).
  - Re-publishing an already-published row throws (`LegalDocumentNotPublishableError`).
  - Soft (inactive) anchor warnings surface without blocking publish.
- **Not verified** (needs a human, no browser automation available in this session): footer mobile layout at 360/390/430px — check the micro-line doesn't overflow; the plan's approved fallback is collapsing to a single "Legal" link if it does.

## Deviations from the plan (and why)

| Plan said | Built instead | Why |
|---|---|---|
| Reuse `security_events` from an auth-hardening merge | Added a minimal `security_events` table from scratch | That merge never happened — confirmed absent from schema and git history (Fase 0 pre-audit) |
| Unit tests for `PublishLegalDocumentUseCase` | Manual verification script (see above) | Repo has no test runner (vitest/jest); user chose not to introduce one for this alone |
| Pages under `app/(marketing)/legal/**` | Pages under `app/(portfolio)/legal/**` | `(marketing)` has no shared header/footer layout (its layout is a no-op wrapper around the single-page home); `(portfolio)` already wraps children in `SimpleHeader` + `Footer`, matching how `/about` is built |
| Publish restricted to "owner/admin" roles | Restricted to `owner` only | This repo's `admin_role` enum is `owner` \| `staff` — there is no separate `admin` role |
| Update docs 02, 03, 05, 07 | Skipped | No numbered doc series matching that description exists in this repo |
| Regenerate a docx preview for the consultant | Not generated (no docx tooling in this repo) | This is the traceability matrix below in Markdown — convert to docx/PDF and attach the current draft content when emailing the consultant |

## Traceability matrix (§7 annex)

| Clause | Document / section | Decision | Source | Date |
|---|---|---|---|---|
| Entity & trading name | All docs, "Who We Are" / "About These Terms" | "Contigo Constructions Pty Ltd, trading as Contigo Constructions". DOSORIO CARPENTRY (present on CBS registration) not mentioned — no current commercial use. | CBS registration + Gustavo confirmation | 2026-07-09 |
| Registered address | website-terms, privacy-policy | 76 Coorara Ave, Payneham South SA 5070 (confirmed place of business). Differs from CBS record (25 Green Ave, Seaton SA 5023) — updating CBS is a client action, out of scope here. | Gustavo, via AskUserQuestion | 2026-07-09 |
| Licence scope & trades clause | service-terms, "Who Provides the Services" | Anchored to BLD 357596, Building Work Contractor with conditions — Carpentry and Joinery. Work outside conditions: "delivered in coordination with appropriately licensed trade professionals". | CBS registration | 2026-07-09 |
| Quote validity | service-terms, "Quotations" | 14 days, no exception clause. | Email Anamaria, point 3 | 2026-07-09 |
| Warranties | service-terms, "Warranties" | Generic: SA legislation + signed contract per project, no specific statutory periods named. | Email Anamaria, point 5 + questionnaire response | 2026-07-09 |
| Project imagery clause | service-terms, "Project Imagery and Marketing"; privacy-policy, "Project Imagery and Your Privacy" | Combined clause: (a) images published with client authorisation, (b) usage rights for marketing/portfolio/web/social per signed contracts. Privacy Policy complement: never publish addresses or owner/property data. | Email Anamaria, point 6 + responses 4-5 | 2026-07-09 |
| Third-party providers wording | website-terms, "Third-Party Content and Services"; privacy-policy, "Third-Party Services" | Generic ("reputable technology providers, some located overseas"). No mention of OpenAI or internal technical detail. Google is the only foreseen exception (its ToS requires incorporation by reference) once activated. Legal consultant has final say. | Email Anamaria, point 4 + follow-up decision | 2026-07-09 |
| No cookie banner | cookie-policy | Disclosure-only, no consent banner (Australia does not require one). | Plan decision | 2026-07-09 |
| Anchors required by integrations | privacy-policy (`#data-deletion`, `#third-party-services`), website-terms (`#third-party-content-and-services`) | Registered in `src/core/config/legal-requirements.ts`, currently `active: false` for both Google and Meta (neither integration is live). The PR that activates either integration must flip `active: true` in the same change. | Google Maps Platform / Meta Developer docs | 2026-07-09 |

## Open items carried forward

1. **Consultant approval** — all 6 documents are `in_review`. Publishing (and the client-facing `/legal` pages going live with real content) is blocked until the consultant signs off; record their approval as the `reviewNote` at publish time.
2. **CBS registration discrepancy** — Coorara Ave vs Green Ave. Updating the CBS record is a client action; not tracked further here.
3. **Footer mobile QA** — verify the Legal micro-line at 360/390/430px; collapse to a single "Legal" link if it overflows (fallback already anticipated by the design, not yet needed).
4. **Google/Meta integration activation** — when either ships, flip the corresponding `active` flag in `legal-requirements.ts` in the same PR, which will then block re-publishing the affected document without the required anchor.
