# Carousel Hover Scope & Quote Modal Reuse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the `/services/[category]` carousel (`ServiceCategoryCarousel.tsx`), scope the auto-pause-on-hover behavior to the interactive foreground elements (queue thumbnails, category pills, details panel, pagination controls) instead of the entire hero scenario, and replace the "Request a Quote" link's navigation to `/#contact` with opening the existing quote request modal in place.

**Architecture:** Move the four pause/resume handlers (`onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur`) off the outer `<section>` and onto a new wrapper `<div>` that groups exactly the four interactive sibling regions already in the desktop JSX (category tabs, queue cards, both details panels, pagination group) — the two full-bleed decorative gradient divs stay outside this wrapper and no longer trigger pause. Separately, give `ServiceCategoryCarousel` its own local `open`/`onOpenChange` state and its own `<QuoteFormModal>` instance (same pattern `SimpleHeader.tsx` already uses — no shared context exists in this codebase), and swap the two "Request a Quote" `<Link href="/#contact">` elements (desktop details panel + mobile per-card CTA) for buttons that open that modal.

**Tech Stack:** Next.js 15 App Router, React 19 client component, GSAP (unaffected by this change), Radix-based `Dialog` (via `src/presentation/components/ui/dialog.tsx`).

## Global Constraints

- Do not change GSAP animation logic, timings, or refs — this plan only moves where DOM event handlers are attached and swaps a `<Link>` for a `<button>`.
- Do not introduce a new shared context/provider for the quote modal — follow the existing per-component local-state pattern (`SimpleHeader.tsx` is the reference).
- Preserve all existing accessibility attributes (`aria-label`, `role`, `tabIndex`, `aria-live`) exactly as they are on elements being moved/wrapped.
- No test infrastructure exists in this repo (per project conventions) — verification is `npm run lint`, `npm run build`, and manual browser check.

---

### Task 1: Scope hover/focus pause to the interactive foreground regions

**Files:**
- Modify: `src/presentation/sections/ServiceCategoryCarousel.tsx:567-741`

**Interfaces:**
- Consumes: existing `handleMouseEnter`, `handleMouseLeave`, `handleFocus`, `handleBlur` (defined at lines 437-452, unchanged) — these already scope correctly to whatever element `onMouseEnter`/`onFocus` etc. are attached to, via `e.currentTarget.contains(e.relatedTarget)`. No changes needed inside the handler bodies.
- Produces: no new exports. The `<section ref={containerRef}>` (line 567-578) keeps its `ref`, `className`, `style`, `role`, `aria-roledescription`, `aria-label` — only the four `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur` props are removed from it and added to a new wrapper `<div>` inside the desktop block.

Currently (lines 567-578):
```tsx
<section
  ref={containerRef}
  className="relative overflow-hidden w-full"
  style={{ height: '100dvh', minHeight: '520px' }}
  role="region"
  aria-roledescription="carousel"
  aria-label={`${categoryName} services`}
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  onFocus={handleFocus as React.FocusEventHandler<HTMLElement>}
  onBlur={handleBlur as React.FocusEventHandler<HTMLElement>}
>
```

And the desktop block starts at line 586:
```tsx
{/* ═══ Desktop carousel (≥1024px) — GSAP controlled ════════════════ */}
<div className="hidden lg:block absolute inset-0">
  {/* Left-side gradient — always on, makes details panel text readable */}
  <div className="absolute inset-0 pointer-events-none z-[16]" style={{ ... }} />

  {/* Bottom gradient — fades toward queue card row */}
  <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[16]" style={{ ... }} />

  {/* ── Category tabs ── */}
  <nav ref={desktopTabsRef as React.RefObject<HTMLDivElement>} ...>
    ...
  </nav>

  {/* All n cards */}
  {items.map((item, i) => ( ... ))}

  {/* Details panel EVEN */}
  {renderDetailsPanel(detailsEvenRef, evenContent, 'polite')}

  {/* Details panel ODD */}
  {renderDetailsPanel(detailsOddRef, oddContent)}

  {/* Pagination */}
  <div ref={paginationRef} className="absolute flex items-center gap-3">
    ...
  </div>
</div>
```

- [ ] **Step 1: Remove the four handlers from the outer `<section>`**

Change lines 567-578 to:
```tsx
<section
  ref={containerRef}
  className="relative overflow-hidden w-full"
  style={{ height: '100dvh', minHeight: '520px' }}
  role="region"
  aria-roledescription="carousel"
  aria-label={`${categoryName} services`}
>
```

- [ ] **Step 2: Wrap the four interactive regions (tabs, cards, both details panels, pagination) in a new pause-scoped wrapper inside the desktop block**

Change the desktop block (lines 586-741) so the two decorative gradient divs stay unwrapped (outside, so hovering the bare background never pauses), and everything from the category tabs nav through the pagination div is wrapped in one new `<div>` carrying the four handlers:

```tsx
{/* ═══ Desktop carousel (≥1024px) — GSAP controlled ════════════════ */}
<div className="hidden lg:block absolute inset-0">
  {/* Left-side gradient — always on, makes details panel text readable */}
  <div
    className="absolute inset-0 pointer-events-none z-[16]"
    style={{ background: 'linear-gradient(105deg, rgba(12,9,6,0.82) 0%, rgba(12,9,6,0.55) 38%, transparent 62%)' }}
  />

  {/* Bottom gradient — fades toward queue card row */}
  <div
    className="absolute bottom-0 left-0 right-0 pointer-events-none z-[16]"
    style={{ height: '200px', background: 'linear-gradient(to top, rgba(8,6,4,0.65) 0%, transparent 100%)' }}
  />

  {/* ── Pause-on-hover scope: category tabs, queue cards, details panels,
      pagination controls. The bare hero background (gradients above) and
      the underlying full-bleed card image are intentionally OUTSIDE this
      wrapper only where they render no foreground content — per product
      decision, hovering any card (including while it's the full-screen
      hero) still pauses, since cards are a single shared DOM node whether
      they're the hero or a queue thumbnail. ── */}
  <div
    className="absolute inset-0"
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
    onFocus={handleFocus as React.FocusEventHandler<HTMLDivElement>}
    onBlur={handleBlur as React.FocusEventHandler<HTMLDivElement>}
  >
    {/* ── Category tabs — positioned above queue cards by computeLayout() ── */}
    <nav
      ref={desktopTabsRef as React.RefObject<HTMLDivElement>}
      className="absolute z-[55] flex flex-wrap justify-end"
      style={{ top: '0px', right: '0px', gap: '5.6px' }}
      aria-label="Service categories"
    >
      {navCategories.map(({ slug, name }) => {
        const isActive = slug === categorySlug
        return (
          <Link
            key={slug}
            href={`/services/${slug}`}
            aria-current={isActive ? 'page' : undefined}
            className="uppercase tracking-widest rounded-full transition-all duration-200 backdrop-blur-sm"
            style={{
              fontSize: '8.4px',
              padding: '5.6px 11px',
              ...(isActive
                ? { backgroundColor: '#E2C063', color: '#1E1A16', fontWeight: 700 }
                : {
                    border: '1px solid rgba(255,255,255,0.35)',
                    color: 'rgba(255,255,255,0.8)',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                  }),
            }}
          >
            {rootCategoryNames?.[slug] ?? name}
          </Link>
        )
      })}
    </nav>

    {/* All n cards — absolutely positioned; GSAP owns x/y/width/height/zIndex */}
    {items.map((item, i) => (
      <div
        key={item.slug}
        ref={el => { cardRefs.current[i] = el }}
        className="absolute overflow-hidden"
        style={{
          backgroundColor: '#1E1A16',
          backgroundImage: item.imageUrl ? `url(${cfImage(item.imageUrl, { width: 1600 })})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: 'pointer',
        }}
        onClick={() => { if (!animatingRef.current) stepImpl('next') }}
        role="button"
        aria-label={`View ${item.name}`}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') stepImpl('next') }}
      >
        {/* Gradient overlay — bottom fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(20,16,12,0) 30%, rgba(20,16,12,0.7) 100%)' }}
        />
        {/* Icon fallback when no image */}
        {!item.imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div style={{ color: '#E2C063' }}>
              <ServiceIcon name={item.iconKey} className="w-24 h-24 opacity-15" />
            </div>
          </div>
        )}
        {/* Queue card text overlay — GSAP positions this; fades out when card becomes hero */}
        <div
          ref={el => { cardQueueContentRefs.current[i] = el }}
          className="absolute"
          style={{ left: 0, top: 0, paddingLeft: '14px', pointerEvents: 'none' }}
        >
          <div style={{ width: '28px', height: '5px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.8)', marginBottom: '7px' }} />
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-cormorant)', lineHeight: 1.3 }}>
            {item.name}
          </div>
        </div>
      </div>
    ))}

    {/* ── Details panel EVEN ─────────────────────────────────────────── */}
    {renderDetailsPanel(detailsEvenRef, evenContent, 'polite')}

    {/* ── Details panel ODD ─────────────────────────────────────────── */}
    {renderDetailsPanel(detailsOddRef, oddContent)}

    {/* ── Pagination: progress bar + slide counter + arrows/pause ────── */}
    <div
      ref={paginationRef}
      className="absolute flex items-center gap-3"
    >
      {/* Progress bar */}
      <div style={{ width: `${PROGRESS_W}px`, height: '3px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
        <div ref={progressFgRef} style={{ height: '100%', backgroundColor: '#E2C063' }} />
      </div>

      {/* Slide counter */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span ref={slideCounterRef} style={{ color: 'white', fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>1</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>/ {n}</span>
      </div>

      <div className="flex items-center gap-1.5" style={{ marginLeft: '12px' }}>
        <button
          onClick={handlePrev}
          aria-label="Previous service"
          className="flex items-center justify-center shrink-0 transition-colors hover:border-white"
          style={{ width: '25px', height: '25px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.75)' }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={handleTogglePause}
          aria-label={isPaused ? 'Resume carousel' : 'Pause carousel'}
          className="flex items-center justify-center shrink-0 transition-colors hover:border-white"
          style={{ width: '20px', height: '20px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.75)' }}
        >
          {isPaused ? (
            <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 4 20 12 6 20" />
            </svg>
          ) : (
            <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          )}
        </button>

        <button
          onClick={handleNext}
          aria-label="Next service"
          className="flex items-center justify-center shrink-0 transition-colors hover:border-white"
          style={{ width: '25px', height: '25px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.75)' }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>
```

Note: only the two decorative gradient `<div>`s stay direct children of `.hidden.lg:block.absolute.inset-0` (unwrapped); everything else moves one level deeper into the new pause-scoped wrapper. `pointer-events-none` on the gradients means they were never mouse-interactive anyway — moving the boundary here has no visual/layout effect (the wrapper is `absolute inset-0`, matching the parent's box exactly).

- [ ] **Step 3: Manual verification in the browser**

Run `npm run dev`, visit `/services/decks` (or any category with several services):
1. Hover over the gold background area where the hero card's plain image extends beyond the details panel/queue row/tabs (e.g. far left-center of the frame, away from text or thumbnails) — confirm the auto-advance progress bar keeps animating (not paused).
2. Hover over a queue thumbnail, a category pill, the details panel text/CTA area, or the prev/pause/next controls — confirm the progress bar visibly pauses (its width tween stops) in each case.
3. Click into a thumbnail so it becomes the full-screen hero, then hover over that same image — confirm it now pauses too (per the "any card, including hero" decision), then move the mouse off it and confirm it resumes.
4. Tab through the page with keyboard focus — confirm focusing a category pill, a CTA link, or a control button pauses, and moving focus back out resumes (unless manually paused via the pause button).

- [ ] **Step 4: Commit**

```bash
git add src/presentation/sections/ServiceCategoryCarousel.tsx
git commit -m "fix(services): scope carousel hover-pause to interactive regions only"
```

---

### Task 2: Replace "Request a Quote" navigation with the existing quote modal

**Files:**
- Modify: `src/presentation/sections/ServiceCategoryCarousel.tsx` (import, local state, two CTA elements)

**Interfaces:**
- Consumes: `QuoteFormModal` from `src/presentation/components/QuoteFormModal.tsx`, exact signature:
  ```tsx
  interface QuoteFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
  }
  export function QuoteFormModal({ open, onOpenChange }: QuoteFormModalProps)
  ```
  This is the same modal `src/presentation/components/SimpleHeader.tsx` opens from its nav "Request a Quote" button, via local `useState` — there is no shared context/provider for it anywhere in the codebase, so each component that wants it owns its own `open` state and its own `<QuoteFormModal>` instance (confirmed: `SimpleHeader.tsx` does exactly this, and it is the only existing consumer to mirror).
- Produces: no new exports. Two `<Link href="/#contact">` elements (desktop details panel CTA, mobile per-card CTA) become `<button onClick={...}>` elements that call `setQuoteModalOpen(true)`.

- [ ] **Step 1: Import `QuoteFormModal` and add local state**

Near the top of `ServiceCategoryCarousel.tsx`, add the import alongside the existing imports (after the `cfImage` import, matching the file's import grouping):
```tsx
import { QuoteFormModal } from '@/presentation/components/QuoteFormModal'
```

Inside the `ServiceCategoryCarousel` function body, alongside the other `useState` hooks (near `const [isPaused, setIsPaused] = useState(false)`), add:
```tsx
const [quoteModalOpen, setQuoteModalOpen] = useState(false)
```

- [ ] **Step 2: Swap the desktop details-panel "Request a Quote" `<Link>` for a `<button>`**

In `renderDetailsPanel` (inside the `.svc-cta` div), find:
```tsx
{/* Primary: Request a Quote — always visible, solid gold */}
<Link
  href="/#contact"
  className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
  style={{ padding: '1.02vh 1.25vw', backgroundColor: '#E2C063', color: '#1E1A16', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.78rem' }}
>
  Request a Quote
</Link>
```

Replace with:
```tsx
{/* Primary: Request a Quote — opens the quote modal in place, no page navigation */}
<button
  type="button"
  onClick={() => setQuoteModalOpen(true)}
  className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
  style={{ padding: '1.02vh 1.25vw', backgroundColor: '#E2C063', color: '#1E1A16', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.78rem', border: 'none', cursor: 'pointer' }}
>
  Request a Quote
</button>
```

(`border: 'none'` and `cursor: 'pointer'` are added because a native `<button>` has different default styling than an anchor; every other visual property is copied verbatim so there is no visible change other than behavior.)

- [ ] **Step 3: Swap the mobile per-card "Request a Quote" `<Link>` for a `<button>`**

In the mobile fallback block, find (around where the mobile card CTA row is rendered):
```tsx
<Link
  href="/#contact"
  style={{ backgroundColor: '#E2C063', color: '#1E1A16', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 18px' }}
>
  Request a Quote
</Link>
```

Replace with:
```tsx
<button
  type="button"
  onClick={() => setQuoteModalOpen(true)}
  style={{ backgroundColor: '#E2C063', color: '#1E1A16', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 18px', border: 'none', cursor: 'pointer' }}
>
  Request a Quote
</button>
```

- [ ] **Step 4: Render the modal once at the end of the component's JSX**

Immediately before the closing `</section>` of the component's returned JSX, add:
```tsx
<QuoteFormModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
```

This renders once regardless of desktop/mobile branch, so both CTA buttons (desktop details panel and mobile per-card) share the same modal instance and state.

- [ ] **Step 5: Manual verification in the browser**

Run `npm run dev`, visit `/services/decks`:
1. Desktop (≥1024px): click "Request a Quote" in the details panel — confirm the quote modal opens over the carousel (no navigation, URL stays on `/services/decks`), and the close button / overlay dismiss both work.
2. Resize below 1024px (mobile layout): scroll to a card, tap "Request a Quote" — confirm the same modal opens.
3. Confirm the secondary "View Detail →" link is untouched and still navigates to `/services/{categorySlug}/{slug}`.
4. Confirm opening the modal doesn't fight with the hover-pause wrapper from Task 1 (e.g. modal open/close doesn't leave the carousel stuck paused or unpaused incorrectly) — the modal is a Radix `Dialog` rendered in a portal, so it does not sit inside the pause-scoped wrapper and won't trigger those handlers.

- [ ] **Step 6: Run lint and build**

```bash
npm run lint
npm run build
```
Expected: no new errors (pre-existing warnings in this file — unused `tagline`, unused `pathname`, unused `animPromise`, `react-hooks/exhaustive-deps` on refs — are known and out of scope).

- [ ] **Step 7: Commit**

```bash
git add src/presentation/sections/ServiceCategoryCarousel.tsx
git commit -m "feat(services): reuse global quote modal instead of linking to #contact"
```

---

## Self-Review

**Spec coverage:**
- Hover pause scoped to details panel + category pills + card queue + controls, rest of hero stays active → Task 1. ✅
- Hover on any card (including full-screen hero) pauses, per explicit user clarification → Task 1, documented in the code comment and Step 3 verification. ✅
- "Request a Quote" no longer navigates to home `/#contact`, instead opens the existing modal reused from the main menu → Task 2. ✅

**Placeholder scan:** No TBD/TODO, all code blocks are complete and copy-pasteable, no "similar to Task N" shortcuts.

**Type consistency:** `QuoteFormModalProps` (`open: boolean`, `onOpenChange: (open: boolean) => void`) matches exactly how Task 2 wires `quoteModalOpen`/`setQuoteModalOpen`. `handleMouseEnter` etc. signatures (`() => void` for mouse handlers, `(e: React.FocusEvent<HTMLElement>) => void` for focus handlers) are reused unchanged in Task 1 — only their attachment point moves, and the cast to `React.FocusEventHandler<HTMLDivElement>` matches the new wrapper's element type (a `<div>`, same cast pattern the original `<section>` used with `HTMLElement`).
