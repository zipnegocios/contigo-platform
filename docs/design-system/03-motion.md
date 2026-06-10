# 03 — Motion Language

Motion is the site's memorability layer. It must read as **engineered, not decorated** — slow, weighty, precise; nothing bouncy or elastic. Stack: **GSAP + ScrollTrigger** for choreography, **Lenis** for smooth scroll (via `LenisProvider`), CSS transitions for micro-interactions.

## 1. Durations & easings

| Token | Value | Use |
|---|---|---|
| fast | 150ms `ease` | Hovers: color, border, opacity |
| base | 250–300ms `cubic-bezier(0.4, 0, 0.2, 1)` | State changes, underline bars, button lifts |
| entrance | 600–800ms `power3.out` (GSAP) | Scroll reveals, staggered text |
| structural | 400–500ms `cubic-bezier(0.25, 0.1, 0.25, 1)` | Accordion flex-expand, drawer slide |
| ambient | 20s+ `sine.inOut` / linear | Ken Burns, gooey blobs — sub-perceptual drift |

Stagger: 0.05–0.2s between siblings. Reveal offset: `y: 30px → 0` with fade (`.reveal` + `useScrollReveal`, trigger `top 85%`).

## 2. Canonical patterns (keep as-is)

- **Hero Ken Burns**: image `scale 1 → 1.07`, ±1.5% drift over 22s; text cascade overline → headline → subtitle → CTA, 0.6–0.8s, power3.out, −0.3s overlaps; scroll-linked scrim fade.
- **Heritage flip-letters**: per-letter 3D `rotateX(-80°) → 0` color `#3A3028 → gold-400`, reverse-cascade 0.05s stagger, scrub via ScrollTrigger.
- **Parallax service strips**: alternating horizontal scrub, `scrub: 0.5`.
- **Showcase accordion**: flex `1 ↔ 3`, 500ms; title rises 20px, description follows +0.1s delay.
- **RotatingText (project metadata)**: 1.5s hold + jitter, 0.7s swap, ±22px y, power2.in/out.
- **Gold rule (BrandBar)**: `scaleX 0 → 1` from center on reveal.
- **Login entry**: per-field fadeUp stagger 0.3–0.6s delays; error shake ±5px/0.5s.

## 3. Rules

1. **One orchestrated entrance per section** — staggered reveals on first scroll-into-view, `toggleActions: 'play none none none'` (no replay on scroll-up).
2. Animate only `transform` and `opacity`; `will-change` on long-running ambient layers.
3. Hover micro-interactions stay ≤300ms and reversible mid-flight.
4. Gold glow shadow appears only on primary CTA hover.
5. New GSAP work goes through `useScrollReveal` / `gsap.context()` for cleanup — no raw scroll listeners (the hero's manual listener is grandfathered; migrate when touched).

## 4. Accessibility

`prefers-reduced-motion: reduce` collapses all animation/transition durations to 0.01ms globally (globals.css). Any new JS-driven loop (autoplay carousel, rotating text) must also check the media query before starting — GSAP timelines are not covered by the CSS kill-switch when they set inline styles per frame.
