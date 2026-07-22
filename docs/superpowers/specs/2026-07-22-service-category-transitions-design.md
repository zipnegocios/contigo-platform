# Service Category Page Transitions (GSAP)

## Problem

Switching between service root categories (e.g. `/services/carpentry` → `/services/electrical`) is a real Next.js route change to a new dynamic segment. Each category page (`app/(portfolio)/services/[category]/page.tsx`) mounts a fresh `ServiceCategoryCarousel` with different `items`/`categoryName` — the previous carousel instance fully unmounts and the new one mounts from scratch. This produces a visible white flash and momentary loss of the surrounding Header/Footer chrome (perceptually, even though they don't actually unmount, the default route-swap has no transition to soften it).

## Scope

**In scope**: category-to-category navigation in `/services/[category]`, driven by the category tabs rendered inside `ServiceCategoryCarousel.tsx`.

**Out of scope**:
- `/projects` — filters via `?category=` query param on a single route (`app/(portfolio)/projects/page.tsx`), not a route change. No white-flash mechanism applies there; not touched.
- The carousel's internal item-to-item animation (stepping between services within the same category) — already has its own GSAP choreography and is untouched.
- `app/(portfolio)/layout.tsx` (Header/Footer) — not modified; it already persists across route changes and is not what's remounting.

## Design

### 1. Petrol Blue background during transition

`app/(portfolio)/services/[category]/layout.tsx` gets `className="bg-[#0D3C4C]"` (equivalent to `var(--petrol-800)`, the existing corporate token — no new hex value introduced) on its wrapping element, so the moment of opacity:0 during fade shows Petrol Blue instead of white.

### 2. Intercepted tab navigation (fade-out)

`ServiceCategoryCarousel.tsx` currently renders category tabs as plain `<Link href={/services/${slug}}>` (~line 622). These become client-navigated:

- Add a `rootRef` wrapping the carousel's existing top-level return `<div>` (currently no single ref covers the whole component tree — individual refs exist per card/panel).
- Tab `onClick`: `preventDefault()`, then `gsap.to(rootRef.current, { opacity: 0, y: 15, duration: 0.35, ease: 'power2.inOut', onComplete: () => router.push(`/services/${slug}`, { scroll: false }) })`.
- Before/at the start of the fade-out, kill any running autoplay/hover tweens tied to this instance (`gsap.killTweensOf(indicatorRef.current)` and any other live tweens identified in the component) so they don't fire callbacks against a DOM that's about to unmount.
- Guard against double-clicks: ignore the click if a transition is already in flight (reuse or extend the existing `animatingRef` pattern already used for step navigation, so tab clicks and carousel auto-stepping don't collide).

### 3. Fade-in on mount (`template.tsx`)

New file `app/(portfolio)/services/[category]/template.tsx`:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: -15 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'all' }
    )
  }, [])
  return <div ref={ref}>{children}</div>
}
```

Next.js remounts `template.tsx` on every navigation within this route segment (unlike `layout.tsx`), so this fires on each category switch without affecting `app/(portfolio)/layout.tsx` (Header/Footer stay mounted).

## Acceptance Criteria

- [ ] Clicking a category tab fades the current carousel to Petrol Blue (`#0D3C4C`) before the URL changes.
- [ ] Header and Footer never remount or visibly flicker during the transition.
- [ ] The new category's carousel fades in smoothly once its route has mounted.
- [ ] No hydration errors or console warnings introduced.
- [ ] No abrupt scroll jump when switching categories (`scroll: false` on `router.push`).
- [ ] Rapid double-clicks on tabs don't produce overlapping/broken animations or duplicate navigations.
- [ ] `/projects` filtering behavior is unchanged (not touched by this work).

## Risks / Watch-outs

- The carousel has an existing autoplay progress-bar tween (`indicatorRef`) and hover-driven timelines; these must be explicitly killed on tab-click fade-out, or they can call back into refs after unmount.
- `rootRef` must wrap the carousel's actual outermost rendered element — verify during implementation that no CSS relying on that element being the direct child of its current parent breaks (e.g. absolute positioning contexts).
