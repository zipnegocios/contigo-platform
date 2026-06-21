import type { CSSProperties } from 'react'

type IconLogoProps = {
  className?: string
  style?: CSSProperties
  /** Accessible label. Omit for decorative/watermark uses (renders aria-hidden). */
  label?: string
}

/**
 * Inline vector rendering of the brand icon mark (logo-family_icon-logo.svg).
 * Inlined as JSX rather than <img>/next/image so `fill="currentColor"` can
 * inherit the surrounding CSS `color` — the same pattern HeritageSection
 * uses for the brand lockup via brand-lockup-paths.tsx.
 */
export function IconLogo({ className, style, label }: IconLogoProps) {
  return (
    <svg
      viewBox="0 0 512 355.137"
      className={className}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      <path
        fill="currentColor"
        d="M310.141,122.478c14.81-30.873,44.554-59.459,81.995-59.459c41.175,0,62.448,20.843,73.787,49.377h3.724
				V69.342c0,0-45.296-22.015-100.696-15.377c-45.617,5.466-83.573,22.96-107.265,71.313c-12.713,25.942-13.287,28.947-13.494,70.571
				c-0.187,38.029-11.654,91.005-72.238,91.005c-43.642,0-87.596-56.903-88.951-102.993c-1.759-59.82,28.78-101.149,62.241-114.21
				c39.899-15.571,90.516,2.083,103.78,43.347h3.553v-43.57c0,0-52.586-26.28-119.056-12.559
				C85.753,67.553,34.969,109.831,37.177,183.552c2.156,71.854,54.81,120.142,138.777,118.843
				c77.172-1.191,107.658-52.625,117.432-88.419C304.009,175.074,296.729,150.441,310.141,122.478"
      />
      <path
        fill="currentColor"
        d="M384.013,286.761c-60.365-8.166-79.141-72.891-79.141-72.891l0.066-0.407c0,0-0.066,0.407-0.216,1.161
				c-1.063,5.397-6.312,28.471-21.234,46.122c0,0,34.269,41.674,95.955,41.674c63.209,0,89.558-19.613,89.558-19.613l5.892-40.384
				C474.893,242.424,441.7,294.566,384.013,286.761"
      />
    </svg>
  )
}
