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

  // ---- Carpentry (11 sub-items, 9 new — carpentry icon above covers the root) ----

  // Hammer + nail, two fixing stages
  '1st-2nd-fix': (
    <>
      <polyline className="svc-draw" pathLength={1} points="10,30 20,20 24,24 14,34 10,30" />
      <line className="svc-draw" pathLength={1} x1="20" y1="20" x2="28" y2="12" />
      <line className="svc-draw" pathLength={1} x1="25" y1="17" x2="31" y2="23" />
      <line className="svc-draw" pathLength={1} x1="32" y1="30" x2="32" y2="40" />
      <line className="svc-draw" pathLength={1} x1="27" y1="34" x2="37" y2="34" />
    </>
  ),
  // Door frame trim profile, mitred corner
  'architraves-skirting': (
    <>
      <rect className="svc-draw" pathLength={1} x="14" y="8" width="20" height="32" rx="0" />
      <polyline className="svc-draw" pathLength={1} points="18,8 18,36 34,36" />
      <line className="svc-draw" pathLength={1} x1="8" y1="40" x2="40" y2="40" />
    </>
  ),
  // Decking boards + joist
  deck: (
    <>
      <line className="svc-draw" pathLength={1} x1="8" y1="18" x2="40" y2="18" />
      <line className="svc-draw" pathLength={1} x1="8" y1="24" x2="40" y2="24" />
      <line className="svc-draw" pathLength={1} x1="8" y1="30" x2="40" y2="30" />
      <line className="svc-draw" pathLength={1} x1="12" y1="30" x2="12" y2="40" />
      <line className="svc-draw" pathLength={1} x1="36" y1="30" x2="36" y2="40" />
    </>
  ),
  // Open-rafter pergola
  pergola: (
    <>
      <line className="svc-draw" pathLength={1} x1="6" y1="16" x2="42" y2="16" />
      <line className="svc-draw" pathLength={1} x1="12" y1="16" x2="12" y2="40" />
      <line className="svc-draw" pathLength={1} x1="36" y1="16" x2="36" y2="40" />
      <line className="svc-draw" pathLength={1} x1="16" y1="10" x2="16" y2="16" />
      <line className="svc-draw" pathLength={1} x1="24" y1="10" x2="24" y2="16" />
      <line className="svc-draw" pathLength={1} x1="32" y1="10" x2="32" y2="16" />
    </>
  ),
  // Eave overhang + fence palings
  'eaves-fencing': (
    <>
      <polyline className="svc-draw" pathLength={1} points="6,16 24,16 24,10" />
      <line className="svc-draw" pathLength={1} x1="14" y1="22" x2="14" y2="40" />
      <line className="svc-draw" pathLength={1} x1="22" y1="22" x2="22" y2="40" />
      <line className="svc-draw" pathLength={1} x1="30" y1="22" x2="30" y2="40" />
      <line className="svc-draw" pathLength={1} x1="38" y1="22" x2="38" y2="40" />
      <line className="svc-draw" pathLength={1} x1="10" y1="22" x2="42" y2="22" />
    </>
  ),
  // Wrench fixing a loose joint
  'general-repairs': (
    <>
      <path
        className="svc-draw"
        pathLength={1}
        d="M16,32 a8,8 0 1 1 11.3,0 L34,38.7 L31,41.7 L24.3,35 a8,8 0 0 1 -8.3,-3 Z"
      />
      <line className="svc-draw" pathLength={1} x1="18" y1="22" x2="22" y2="26" />
    </>
  ),
  // Door leaf, hinged, open
  'interior-exterior-doors': (
    <>
      <line className="svc-draw" pathLength={1} x1="14" y1="8" x2="14" y2="40" />
      <path className="svc-draw" pathLength={1} d="M14,8 A32,32 0 0 1 38,40" fill="none" />
      <line className="svc-draw" pathLength={1} x1="38" y1="40" x2="14" y2="40" />
    </>
  ),
  // House outline + appended bay (renovation + extension combined)
  'renovations-extensions': (
    <>
      <polyline className="svc-draw" pathLength={1} points="8,22 8,40 24,40 24,14 8,22" />
      <rect className="svc-draw" pathLength={1} x="26" y="26" width="14" height="14" rx="1" />
      <line className="svc-draw" pathLength={1} x1="24" y1="33" x2="26" y2="33" />
    </>
  ),
  // Storefront awning + window
  'shop-fitouts': (
    <>
      <polyline className="svc-draw" pathLength={1} points="8,18 8,12 40,12 40,18" />
      <polyline className="svc-draw" pathLength={1} points="8,18 14,24 8,24" />
      <polyline className="svc-draw" pathLength={1} points="40,18 34,24 40,24" />
      <line className="svc-draw" pathLength={1} x1="14" y1="24" x2="34" y2="24" />
      <rect className="svc-draw" pathLength={1} x="14" y="28" width="20" height="12" rx="0.5" />
    </>
  ),
  // Staircase profile + stud frame
  'staircases-studwork': (
    <>
      <polyline className="svc-draw" pathLength={1} points="8,40 8,32 16,32 16,24 24,24 24,16 32,16 32,8" />
      <line className="svc-draw" pathLength={1} x1="36" y1="8" x2="36" y2="40" />
      <line className="svc-draw" pathLength={1} x1="42" y1="8" x2="42" y2="40" />
      <line className="svc-draw" pathLength={1} x1="36" y1="20" x2="42" y2="20" />
    </>
  ),
  // Verandah roof over a row of posts
  verandahs: (
    <>
      <polyline className="svc-draw" pathLength={1} points="6,18 24,9 42,18" />
      <line className="svc-draw" pathLength={1} x1="6" y1="18" x2="6" y2="22" />
      <line className="svc-draw" pathLength={1} x1="42" y1="18" x2="42" y2="22" />
      <line className="svc-draw" pathLength={1} x1="10" y1="22" x2="10" y2="40" />
      <line className="svc-draw" pathLength={1} x1="24" y1="22" x2="24" y2="40" />
      <line className="svc-draw" pathLength={1} x1="38" y1="22" x2="38" y2="40" />
    </>
  ),

  // ---- Cladding (4 sub-items) ----

  // Vertically-jointed Axon panels
  axon: (
    <>
      <rect className="svc-draw" pathLength={1} x="8" y="8" width="32" height="32" rx="1" />
      <line className="svc-draw" pathLength={1} x1="16" y1="8" x2="16" y2="40" />
      <line className="svc-draw" pathLength={1} x1="24" y1="8" x2="24" y2="40" />
      <line className="svc-draw" pathLength={1} x1="32" y1="8" x2="32" y2="40" />
    </>
  ),
  // Base sheet + trowel-applied render coat
  blueboard: (
    <>
      <rect className="svc-draw" pathLength={1} x="8" y="10" width="24" height="28" rx="1" />
      <path className="svc-draw" pathLength={1} d="M32,16 L40,14 L40,34 L32,32" />
      <line className="svc-draw" pathLength={1} x1="14" y1="18" x2="26" y2="18" />
      <line className="svc-draw" pathLength={1} x1="14" y1="30" x2="26" y2="30" />
    </>
  ),
  // Aerated panel, cellular cross-section
  hebel: (
    <>
      <rect className="svc-draw" pathLength={1} x="9" y="9" width="30" height="30" rx="1" />
      <circle className="svc-draw" pathLength={1} cx="18" cy="18" r="2" />
      <circle className="svc-draw" pathLength={1} cx="30" cy="18" r="2" />
      <circle className="svc-draw" pathLength={1} cx="18" cy="30" r="2" />
      <circle className="svc-draw" pathLength={1} cx="30" cy="30" r="2" />
    </>
  ),
  // Horizontal overlapping boards, single plank detail
  weatherboard: (
    <>
      <path className="svc-draw" pathLength={1} d="M8,14 H40" />
      <path className="svc-draw" pathLength={1} d="M8,21 H40" />
      <path className="svc-draw" pathLength={1} d="M8,28 H40" />
      <path className="svc-draw" pathLength={1} d="M8,35 H40" />
      <path className="svc-draw" pathLength={1} d="M8,14 L8,17" />
    </>
  ),

  // ---- Gyprock Fixing & Flushing (4 sub-items) ----

  // Suspended ceiling grid + hangers
  'acoustic-ceilings': (
    <>
      <line className="svc-draw" pathLength={1} x1="8" y1="14" x2="40" y2="14" />
      <line className="svc-draw" pathLength={1} x1="14" y1="8" x2="14" y2="14" />
      <line className="svc-draw" pathLength={1} x1="24" y1="8" x2="24" y2="14" />
      <line className="svc-draw" pathLength={1} x1="34" y1="8" x2="34" y2="14" />
      <line className="svc-draw" pathLength={1} x1="8" y1="14" x2="14" y2="34" />
      <line className="svc-draw" pathLength={1} x1="40" y1="14" x2="34" y2="34" />
      <line className="svc-draw" pathLength={1} x1="14" y1="34" x2="34" y2="34" />
    </>
  ),
  // Boxed bulkhead with pelmet recess
  'bulkheads-pelmet': (
    <>
      <polyline className="svc-draw" pathLength={1} points="6,12 6,22 16,22 16,12" />
      <line className="svc-draw" pathLength={1} x1="6" y1="12" x2="42" y2="12" />
      <polyline className="svc-draw" pathLength={1} points="32,12 32,22 42,22 42,12" />
      <line className="svc-draw" pathLength={1} x1="16" y1="22" x2="32" y2="22" />
      <line className="svc-draw" pathLength={1} x1="12" y1="28" x2="12" y2="40" />
      <line className="svc-draw" pathLength={1} x1="36" y1="28" x2="36" y2="40" />
    </>
  ),
  // Plasterboard sheet, screw-fixed, joint taped
  'plasterboard-fixing': (
    <>
      <rect className="svc-draw" pathLength={1} x="8" y="9" width="32" height="30" rx="1" />
      <line className="svc-draw" pathLength={1} x1="24" y1="9" x2="24" y2="39" />
      <circle className="svc-draw" pathLength={1} cx="16" cy="17" r="0.8" fill="currentColor" />
      <circle className="svc-draw" pathLength={1} cx="16" cy="31" r="0.8" fill="currentColor" />
      <circle className="svc-draw" pathLength={1} cx="32" cy="17" r="0.8" fill="currentColor" />
      <circle className="svc-draw" pathLength={1} cx="32" cy="31" r="0.8" fill="currentColor" />
    </>
  ),
  // WR board with water droplet
  'water-resistant-boarding': (
    <>
      <rect className="svc-draw" pathLength={1} x="8" y="9" width="22" height="30" rx="1" />
      <line className="svc-draw" pathLength={1} x1="14" y1="17" x2="24" y2="17" />
      <line className="svc-draw" pathLength={1} x1="14" y1="25" x2="24" y2="25" />
      <path className="svc-draw" pathLength={1} d="M37,14 C41,20 41,24 37,27 C33,24 33,20 37,14 Z" />
    </>
  ),

  // ---- Additional Services (9 new — painting + landscaping reused above) ----

  // Pencil drafting over a ruled plan
  'design-drafting': (
    <>
      <rect className="svc-draw" pathLength={1} x="8" y="10" width="28" height="24" rx="1" />
      <line className="svc-draw" pathLength={1} x1="13" y1="18" x2="27" y2="18" />
      <line className="svc-draw" pathLength={1} x1="13" y1="24" x2="23" y2="24" />
      <line className="svc-draw" pathLength={1} x1="28" y1="30" x2="40" y2="18" />
      <polyline className="svc-draw" pathLength={1} points="36,14 40,18 36,22" />
    </>
  ),
  // Lightning bolt + tap/drop
  'electrical-plumbing': (
    <>
      <polyline className="svc-draw" pathLength={1} points="22,8 12,24 20,24 16,40 32,20 23,20 28,8" />
    </>
  ),
  // Beam on two supports, load arrow
  engineering: (
    <>
      <line className="svc-draw" pathLength={1} x1="8" y1="20" x2="40" y2="20" />
      <polyline className="svc-draw" pathLength={1} points="14,20 10,30 18,30 14,20" />
      <polyline className="svc-draw" pathLength={1} points="34,20 30,30 38,30 34,20" />
      <line className="svc-draw" pathLength={1} x1="24" y1="8" x2="24" y2="18" />
      <polyline className="svc-draw" pathLength={1} points="20,14 24,18 28,14" />
    </>
  ),
  // Roof pitch + gutter run with downpipe
  'roofing-guttering': (
    <>
      <polyline className="svc-draw" pathLength={1} points="6,24 24,10 42,24" />
      <polyline className="svc-draw" pathLength={1} points="10,24 38,24 38,28 10,28 10,24" />
      <line className="svc-draw" pathLength={1} x1="12" y1="28" x2="12" y2="40" />
    </>
  ),
  // Window sash + glazing bar reflection
  'windows-glazing': (
    <>
      <rect className="svc-draw" pathLength={1} x="10" y="8" width="28" height="32" rx="1" />
      <line className="svc-draw" pathLength={1} x1="24" y1="8" x2="24" y2="40" />
      <line className="svc-draw" pathLength={1} x1="10" y1="24" x2="38" y2="24" />
      <line className="svc-draw" pathLength={1} x1="14" y1="20" x2="20" y2="12" />
    </>
  ),
  // Bath tub + tap
  'bathroom-renovation': (
    <>
      <path className="svc-draw" pathLength={1} d="M8,26 H38 V30 a6,6 0 0 1 -6,6 H14 a6,6 0 0 1 -6,-6 Z" />
      <path className="svc-draw" pathLength={1} d="M12,26 V20 a4,4 0 0 1 8,0" />
      <line className="svc-draw" pathLength={1} x1="30" y1="14" x2="30" y2="20" />
      <line className="svc-draw" pathLength={1} x1="26" y1="14" x2="34" y2="14" />
    </>
  ),
  // Wall with crack/break line + falling debris
  demolition: (
    <>
      <polyline className="svc-draw" pathLength={1} points="10,8 10,40 38,40 38,8" />
      <polyline className="svc-draw" pathLength={1} points="10,8 20,8 16,18 26,18 18,40" />
      <line className="svc-draw" pathLength={1} x1="32" y1="26" x2="36" y2="30" />
      <line className="svc-draw" pathLength={1} x1="36" y1="26" x2="32" y2="30" />
    </>
  ),
  // Tile grid + grout lines emphasised
  grouting: (
    <>
      <rect className="svc-draw" pathLength={1} x="8" y="8" width="32" height="32" rx="1" />
      <line className="svc-draw" pathLength={1} x1="8" y1="20" x2="40" y2="20" />
      <line className="svc-draw" pathLength={1} x1="8" y1="32" x2="40" y2="32" />
      <line className="svc-draw" pathLength={1} x1="20" y1="8" x2="20" y2="20" />
      <line className="svc-draw" pathLength={1} x1="30" y1="20" x2="30" y2="32" />
      <line className="svc-draw" pathLength={1} x1="16" y1="32" x2="16" y2="40" />
    </>
  ),
  // Stud + noggin timber frame
  'timber-framing': (
    <>
      <rect className="svc-draw" pathLength={1} x="8" y="8" width="32" height="32" rx="0" />
      <line className="svc-draw" pathLength={1} x1="18" y1="8" x2="18" y2="40" />
      <line className="svc-draw" pathLength={1} x1="30" y1="8" x2="30" y2="40" />
      <line className="svc-draw" pathLength={1} x1="8" y1="20" x2="18" y2="20" />
      <line className="svc-draw" pathLength={1} x1="18" y1="28" x2="30" y2="28" />
      <line className="svc-draw" pathLength={1} x1="30" y1="20" x2="40" y2="20" />
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
