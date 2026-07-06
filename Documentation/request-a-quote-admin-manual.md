# Request a Quote — Admin/CRM Usage Manual

Audience: staff using the admin panel to manage leads that come in through the
"Request a Quote" form. This is a how-to guide, not a technical reference.

## Where to find leads

Go to **Admin → Leads** (`/admin/leads`). You'll land on the active pipeline by
default. Two other views are available from the same page:
- **Archive** — leads set aside but kept, out of the active pipeline.
- **Trash** — leads marked for deletion, still recoverable until permanently deleted.

You can switch between a **Kanban board** (drag cards between stage columns)
and a **table view** using the view toggle at the top of the page.

## How a new lead shows up

You don't create leads manually — there is no "add lead" button. Every lead is
created automatically the moment a visitor submits the "Request a Quote" form
on the website. As soon as that happens:
- The client receives a confirmation email with their personal tracking link.
- You (or whoever is configured as `ADMIN_EMAIL`) receive an internal
  notification email with the full request details.
- The lead appears in the pipeline, in the default stage, ready to work.

No action is required to "accept" or "import" the lead — it's already there.

## Moving a lead through the pipeline

**On the Kanban board:** drag the lead's card from its current column into the
column for the new stage. **In the table view:** use the stage dropdown on the
lead's row (or open the lead and change it from the detail page).

Every time you change a lead's stage, this happens automatically — you don't
need to do anything else:
- The client gets an email telling them their project has moved to the new
  stage.
- An internal record of the change (from stage → to stage) is added to the
  lead's Activity timeline.

If a stage-change email fails to send for some reason, the stage change itself
still goes through — you won't be blocked by an email problem.

## Working a lead — the detail page

Click into any lead to open its detail page. It has six tabs:

**Summary** — the client's original request details (name, contact info,
service, project description) and the primary contact.

**Activity** — a read-only timeline/audit log of everything that's happened on
this lead (stage changes, etc.). Use this if you need to answer "when did this
change?"

**Calls & Visits** — schedule and manage calls, site visits, meetings, and
follow-ups:
- Create one with a date/time, duration, and (for site visits) an address or
  maps link, or (for meetings) a video call link.
- The client is emailed automatically when you schedule, update, or cancel one
  — and it shows up on their tracking page too.
- Cancelled events are hidden from the client's tracking page automatically.

**Documents** — files attached to this lead. When you upload a document, you
choose a direction:
- Files the *client* sent you (reference photos, etc.) — for your own records.
- Files *you* send to the client (a quote PDF, a contract) — these are the
  only documents that appear on the client's tracking page, so use this
  direction whenever you want the client to be able to see or download
  something.
- Internal-only files stay private to the team.

**Tasks** — an internal to-do list for this lead. Each task can have a due
date, an assignee, a checklist, comments, and its own file attachments. Fully
internal — the client never sees this tab's contents.

**Messages** — a direct chat thread with the client. Anything you send here
shows up on the client's tracking page and triggers an email notification to
them; anything the client sends shows up here and is marked unread until you
open it. This is the recommended way to communicate back and forth about the
project, instead of a separate email thread — it keeps the whole conversation
attached to the lead.

There's also a **Notes** area for internal-only notes — unlike Messages, notes
are never visible to the client and don't send any notification. Use Notes for
things like "spoke to client's partner, prefers weekend visits" — context for
the team, not for the client.

## What the client sees on their end

The client's tracking link (`/quote-status/...`, the one they got in their
first confirmation email) shows them:
- The current stage of their project.
- Upcoming (non-cancelled) calls/visits/meetings.
- Any documents you've sent them (only documents marked "sent to client" —
  their own uploads and internal files never appear here).
- The full message thread with your team, with the ability to reply.

They don't need an account or password — the link itself is their access, so
treat it as something private (don't forward a client's tracking link to
someone else).

## Archiving, Trashing, and Permanent Delete — what's the difference

These are three distinct, increasingly serious actions:

1. **Archive** — removes the lead from the active pipeline view but keeps it
   fully intact and recoverable. Use this for leads that are done (won/lost)
   but you want to keep for records. Restore it anytime from the Archive view.

2. **Trash** — a stronger "set aside," meant as a step before deletion. Still
   fully recoverable from the Trash view via **Restore**.

3. **Delete Forever** (only available from the Trash view) — permanently and
   irreversibly deletes the lead: the original quote request, every call/
   visit/meeting, every document, every note, every message, every task, and
   the entire activity history. Nothing is recoverable after this.
   - You can only permanently delete a lead that's already in the Trash.
   - You'll be asked to type the client's name to confirm before the button
     enables — this is intentional friction so it can't happen by accident.
   - This requires a specific permission ("Delete Leads Permanently"),
     separate from the permission that lets you archive/trash leads — if you
     don't see the option, ask whoever manages staff permissions to grant it.

**Rule of thumb:** archive leads you want to keep for records, trash leads
you're fairly sure you don't need, and only use Delete Forever once you're
certain — there's no undo.

## If something seems missing

If you can't perform an action (e.g. no "Delete Forever" button, can't create
or edit pipeline stages, can't manage tasks), it's most likely a permissions
issue, not a bug. Each of these areas is gated by a specific permission — ask
whoever manages staff accounts to check what's granted to your account.
