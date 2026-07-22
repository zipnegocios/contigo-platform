# Service Category Page Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abrupt white-flash route change between `/services/[category]` pages with a GSAP fade-out (to Petrol Blue) → navigate → fade-in sequence, without disturbing the carousel's existing internal item-to-item animation, autoplay loop, or the persistent Header/Footer.

**Architecture:** Three independent, additive changes: (1) a background color on the `[category]` layout so the moment of zero-opacity shows Petrol Blue instead of white; (2) intercepted `onClick` handlers on the carousel's desktop and mobile category tabs that fade the whole carousel section to opacity 0 before calling `router.push`, stopping the autoplay loop first so it can't fire against an unmounting tree; (3) a new `template.tsx` in the same route segment that fades new content in on every mount, since Next.js remounts `template.tsx` (unlike `layout.tsx`) on every navigation within the segment.

**Tech Stack:** Next.js 15 App Router (`template.tsx` convention), GSAP (`gsap.to`, `gsap.fromTo`, already a project dependency used throughout `ServiceCategoryCarousel.tsx`), React 19, Tailwind CSS.

## Global Constraints

- Petrol Blue must be the existing corporate token `var(--petrol-800)` (`#0D3C4C`), never a new/duplicate hex literal.
- `/projects` (query-param filtering) must not be touched — out of scope.
- `app/(portfolio)/layout.tsx` (Header/Footer) must not be modified and must not remount.
- The carousel's internal item-to-item stepping animation (`stepImpl`, `runLoop`, etc.) must be untouched except for explicitly stopping the loop before a category-tab-triggered unmount.
- No test infrastructure exists in this repo (see project memory) — verification is via `npm run lint`, `npm run build`, and manual browser check in dev (`npm run dev`), not automated tests.
- All new/changed UI copy, if any, stays in English (existing convention); this feature adds no user-facing copy.

---

### Task 1: Petrol Blue background on the services category layout

**Files:**
- Modify: `app/(portfolio)/services/[category]/layout.tsx`

**Interfaces:**
- Produces: no new exports; purely a visual/style change to the existing default export `ServiceCategoryLayout`.

- [ ] **Step 1: Add the Petrol Blue background wrapper**

Replace the current fragment return with a `div` carrying the corporate Petrol Blue background token, so it's visible behind the carousel whenever the carousel's opacity drops to 0 during a transition:

```tsx
import { SERVICE_ROOT_SLUGS } from '@/presentation/data/serviceCategoryMeta'
import { getPublicServiceCategories } from '@/infrastructure/services/getPublicServiceCategories'

export async function generateStaticParams() {
  try {
    if (!process.env.DATABASE_URL) return SERVICE_ROOT_SLUGS.map((category) => ({ category }))
    const visible = await getPublicServiceCategories()
    return visible.map((cat) => ({ category: cat.slug }))
  } catch {
    return []
  }
}

export default function ServiceCategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div style={{ backgroundColor: 'var(--petrol-800, #0D3C4C)' }}>{children}</div>
}
```

- [ ] **Step 2: Verify the token resolves**

Run: `grep -n "petrol-800" "c:/dev/contigo-platform/app/globals.css"`
Expected: a line defining `--petrol-800: #0D3C4C;` (or similar) — confirms the CSS variable exists so the inline style isn't relying solely on the hex fallback.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors from this file.

- [ ] **Step 4: Commit**

```bash
git add "app/(portfolio)/services/[category]/layout.tsx"
git commit -m "feat(services): show Petrol Blue background during category transitions"
```

---

### Task 2: Fade-in on mount via `template.tsx`

**Files:**
- Create: `app/(portfolio)/services/[category]/template.tsx`

**Interfaces:**
- Consumes: nothing from Task 1 directly (independent), but relies on the Task 1 background being in place for the fade-in to read correctly against Petrol Blue rather than white.
- Produces: default-exported `Template` component, automatically picked up by Next.js App Router for this route segment — no other file needs to import it.

- [ ] **Step 1: Create the template file**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (prefersReducedMotion()) return

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: -15 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'all' }
    )
  }, [])

  return <div ref={ref}>{children}</div>
}
```

`prefersReducedMotion` already exists at `src/presentation/animations/prefersReducedMotion.ts` and is imported the same way inside `ServiceCategoryCarousel.tsx` (see its line 8) — reusing it here keeps this transition consistent with the carousel's own reduced-motion handling instead of introducing a second convention.

- [ ] **Step 2: Manual verification in dev**

Run: `npm run dev`
Navigate to `http://localhost:3000/services/carpentry`, then directly to `http://localhost:3000/services/electrical` via URL bar (bypassing tab click, since Task 3 hasn't wired the tabs yet).
Expected: on each direct load/navigation, content fades in from slightly above (no fade-out yet — that's Task 3). No console errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(portfolio)/services/[category]/template.tsx"
git commit -m "feat(services): fade in category content on route mount"
```

---

### Task 3: Intercept category tab clicks for fade-out before navigation

**Files:**
- Modify: `src/presentation/sections/ServiceCategoryCarousel.tsx`

**Interfaces:**
- Consumes: `containerRef` (existing, defined at line 81, attached to the outermost `<section>` at line 571 — this task does not add a new ref, it reuses this one), `stopLoop()` (existing function, defined at line 317, already the established way to kill the autoplay tween safely), `router.push` from `next/navigation`.
- Produces: a new `handleCategoryNavigate(slug: string)` function used by both the desktop tabs (~line 622) and mobile tabs (~line 773) `onClick` handlers. No other task depends on this function's name, since this is the last task in the plan.

- [ ] **Step 1: Import `useRouter` and add a transition-guard ref**

Modify the top of the component (near line 5, alongside the existing `usePathname` import) and near the other refs (after `animatingRef` at line 63):

```tsx
import { useRouter, usePathname } from 'next/navigation'
```

```tsx
  const animatingRef = useRef(false)
  const categoryTransitionRef = useRef(false) // guards against double-clicking a category tab mid-fade-out
```

- [ ] **Step 2: Add `const router = useRouter()`**

Place it directly below the existing `const pathname = usePathname()` at line 59:

```tsx
  const pathname = usePathname()
  const router = useRouter()
```

- [ ] **Step 3: Add the `handleCategoryNavigate` function**

Place it near `stopLoop` (after line 323, before the "Init on mount" section comment at line 325), so it can call `stopLoop()` and reuse `containerRef`:

```tsx
  function handleCategoryNavigate(slug: string) {
    if (slug === categorySlug) return
    if (categoryTransitionRef.current) return
    categoryTransitionRef.current = true

    stopLoop()

    if (prefersReducedMotion() || !containerRef.current) {
      router.push(`/services/${slug}`, { scroll: false })
      return
    }

    gsap.to(containerRef.current, {
      opacity: 0,
      y: 15,
      duration: 0.35,
      ease: 'power2.inOut',
      onComplete: () => router.push(`/services/${slug}`, { scroll: false }),
    })
  }
```

This calls `stopLoop()` (already kills the indicator tween and resets it — see existing definition at line 317-323) before starting the fade, so the autoplay's `gsap.to(indicatorRef.current, ...)` tween can't fire its own `onComplete`/loop continuation against a section that's about to navigate away.

- [ ] **Step 4: Wire the desktop tabs to use it**

Modify the desktop tabs block (~line 619-643). Change the `<Link>` to a `<button>`-like anchor that intercepts the click:

```tsx
          {navCategories.map(({ slug, name }) => {
            const isActive = slug === categorySlug
            return (
              <Link
                key={slug}
                href={`/services/${slug}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleCategoryNavigate(slug)
                }}
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
```

Keeping the `<Link href>` (rather than switching to a plain `<button>`) preserves middle-click/ctrl-click "open in new tab" and right-click "copy link" behavior, and `preventDefault()` only stops the default same-tab navigation.

- [ ] **Step 5: Wire the mobile tabs the same way**

Modify the mobile tabs block (~line 770-786) identically:

```tsx
          {navCategories.map(({ slug, name }) => {
            const isActive = slug === categorySlug
            return (
              <Link
                key={slug}
                href={`/services/${slug}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleCategoryNavigate(slug)
                }}
                aria-current={isActive ? 'page' : undefined}
                className="text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full transition-all backdrop-blur-sm whitespace-nowrap"
                style={isActive
                  ? { backgroundColor: '#E2C063', color: '#1E1A16', fontWeight: 700 }
                  : { border: '1px solid rgba(255,255,255,0.38)', color: 'rgba(255,255,255,0.88)', backgroundColor: 'rgba(0,0,0,0.38)' }
                }
              >
                {rootCategoryNames?.[slug] ?? name}
              </Link>
            )
          })}
```

- [ ] **Step 6: Manual verification in dev**

Run: `npm run dev`
Navigate to `http://localhost:3000/services/carpentry`. Click a different category tab (desktop viewport ≥1024px).
Expected: the whole carousel fades to Petrol Blue (opacity 0 + slight downward shift) over ~0.35s, URL then changes, then the new category's carousel fades in from Task 2's `template.tsx` over ~0.45s. No white flash. Header/Footer stay static throughout (check via React DevTools or just visually — no flicker).

Resize to a mobile viewport (<1024px) and repeat via the mobile tab column.
Expected: same fade behavior through the mobile tabs.

Rapidly double-click a tab.
Expected: only one navigation fires — `categoryTransitionRef` blocks the second click during the fade.

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: no new errors, no unused-import warnings (`useRouter` is now used).

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: build succeeds with no type errors (verifies `handleCategoryNavigate`'s usage of `router.push`, `stopLoop`, `containerRef` all type-check against existing declarations).

- [ ] **Step 9: Commit**

```bash
git add src/presentation/sections/ServiceCategoryCarousel.tsx
git commit -m "feat(services): fade out category carousel before navigating between categories"
```

---

## Final Verification

- [ ] **Full manual walkthrough**

Run: `npm run dev`
1. Load `/services/carpentry` directly — confirm fade-in on initial mount (Task 2), no console errors.
2. Click through all visible category tabs (desktop) in sequence — confirm fade-out to Petrol Blue → fade-in each time, no white flash, Header/Footer never flicker.
3. Repeat on a mobile-width viewport using the mobile tab column.
4. Confirm scroll position doesn't jump when switching categories (`scroll: false` is passed to `router.push` in both call sites).
5. Confirm `/projects` category filtering still works unchanged (query-param based, untouched by this plan) — click a project category pill and confirm no regression.

- [ ] **Final lint + build**

Run: `npm run lint && npm run build`
Expected: both succeed with no new errors.
