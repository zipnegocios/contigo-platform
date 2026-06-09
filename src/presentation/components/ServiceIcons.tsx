/**
 * Custom blueprint-style line icons for the Services index.
 *
 * Each icon is inline SVG with a thin stroke (drawn in `currentColor`).
 * Every drawable element carries `pathLength={1}` + `className="svc-draw"`
 * so it can self-draw via `stroke-dashoffset` (1 → 0) driven by CSS when the
 * row becomes active. See `.svc-draw` rules in globals.css.
 */
import type { ReactElement } from 'react'

const ICONS: Record<string, ReactElement> = {
  // House gable + frame
  'new-home': (
    <>
      <polyline className="svc-draw" pathLength={1} points="7,24 24,9 41,24" />
      <polyline className="svc-draw" pathLength={1} points="12,22 12,40 36,40 36,22" />
      <polyline className="svc-draw" pathLength={1} points="21,40 21,30 27,30 27,40" />
    </>
  ),
  // House + appended volume with arrow
  extension: (
    <>
      <polyline className="svc-draw" pathLength={1} points="8,20 8,40 24,40 24,16 8,20" />
      <polyline className="svc-draw" pathLength={1} points="8,20 16,12 24,16" />
      <rect className="svc-draw" pathLength={1} x="28" y="24" width="12" height="16" rx="1" />
      <line className="svc-draw" pathLength={1} x1="26" y1="20" x2="34" y2="20" />
      <polyline className="svc-draw" pathLength={1} points="31,17 34,20 31,23" />
    </>
  ),
  // House with refresh / transform arc
  renovation: (
    <>
      <polyline className="svc-draw" pathLength={1} points="14,26 24,17 34,26" />
      <polyline className="svc-draw" pathLength={1} points="17,24 17,36 31,36 31,24" />
      <path className="svc-draw" pathLength={1} d="M37,12 a11,11 0 1 1 -8,-4" fill="none" />
      <polyline className="svc-draw" pathLength={1} points="37,7 38,13 32,13" />
    </>
  ),
  // Set square + tick marks
  carpentry: (
    <>
      <polyline className="svc-draw" pathLength={1} points="11,11 11,38 38,38" />
      <line className="svc-draw" pathLength={1} x1="11" y1="11" x2="38" y2="38" />
      <line className="svc-draw" pathLength={1} x1="16" y1="38" x2="16" y2="34" />
      <line className="svc-draw" pathLength={1} x1="22" y1="38" x2="22" y2="34" />
      <line className="svc-draw" pathLength={1} x1="28" y1="38" x2="28" y2="34" />
    </>
  ),
  // Overlapping weatherboard planks
  cladding: (
    <>
      <path className="svc-draw" pathLength={1} d="M8,16 H40" />
      <path className="svc-draw" pathLength={1} d="M8,22 H40" />
      <path className="svc-draw" pathLength={1} d="M8,28 H40" />
      <path className="svc-draw" pathLength={1} d="M8,34 H40" />
      <line className="svc-draw" pathLength={1} x1="14" y1="16" x2="14" y2="34" />
      <line className="svc-draw" pathLength={1} x1="34" y1="16" x2="34" y2="34" />
    </>
  ),
  // Plasterboard sheet + corner bead
  gyprock: (
    <>
      <rect className="svc-draw" pathLength={1} x="9" y="11" width="22" height="28" rx="1" />
      <polyline className="svc-draw" pathLength={1} points="35,15 39,15 39,39 35,39" />
      <line className="svc-draw" pathLength={1} x1="14" y1="18" x2="26" y2="18" />
      <line className="svc-draw" pathLength={1} x1="14" y1="24" x2="26" y2="24" />
    </>
  ),
  // Leaf + ground line
  landscaping: (
    <>
      <path className="svc-draw" pathLength={1} d="M30,10 C16,12 12,26 14,34 C28,34 34,22 30,10 Z" />
      <path className="svc-draw" pathLength={1} d="M20,32 C22,24 26,18 30,14" />
      <line className="svc-draw" pathLength={1} x1="8" y1="40" x2="40" y2="40" />
    </>
  ),
  // Paint roller
  painting: (
    <>
      <rect className="svc-draw" pathLength={1} x="10" y="10" width="22" height="9" rx="1.5" />
      <polyline className="svc-draw" pathLength={1} points="32,14.5 37,14.5 37,22 24,22 24,27" />
      <line className="svc-draw" pathLength={1} x1="24" y1="27" x2="24" y2="40" />
    </>
  ),
  // Trowel
  render: (
    <>
      <polyline className="svc-draw" pathLength={1} points="6,30 26,24 30,30 10,36 6,30" />
      <line className="svc-draw" pathLength={1} x1="28" y1="27" x2="36" y2="17" />
      <path className="svc-draw" pathLength={1} d="M35,15 a2.4,2.4 0 1 1 3.4,3.4 Z" />
    </>
  ),
  // Diamond + polished sheen
  venetian: (
    <>
      <polygon className="svc-draw" pathLength={1} points="24,8 38,24 24,40 10,24" />
      <line className="svc-draw" pathLength={1} x1="19" y1="19" x2="29" y2="29" />
      <line className="svc-draw" pathLength={1} x1="25" y1="16" x2="32" y2="23" />
    </>
  ),
}

export function ServiceIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const glyph = ICONS[name] ?? ICONS['new-home']
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph}
    </svg>
  )
}
