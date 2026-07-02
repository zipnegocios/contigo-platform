/**
 * Marquee geometry helper functions for the services carousel.
 * Pure functions with no JSX or external dependencies.
 */

/**
 * Calculate how many times to duplicate a set of items to fill and overflow the viewport.
 *
 * @param itemCount - Number of items in a single set
 * @param viewportWidthPx - Width of the visible viewport in pixels
 * @param cardWidthPx - Width of a single card including gap (e.g., 320px card + 16px gap = 336px)
 * @returns The duplication count (minimum 2 for seamless loop, maximum driven by viewport fill)
 *
 * Example: 4 items at 336px each = 1344px per set.
 * At a 1440px viewport: setsToFillViewport = ceil(1440 / 1344) = 2.
 * return max(2, 2 + 1) = 3
 */
export function getServiceRowDuplicationCount(
  itemCount: number,
  viewportWidthPx: number,
  cardWidthPx: number,
): number {
  const singleSetWidth = itemCount * cardWidthPx
  const setsToFillViewport = Math.ceil(viewportWidthPx / singleSetWidth)
  return Math.max(2, setsToFillViewport + 1)
}

/**
 * Duplicate items into a looped array with unique loop keys.
 *
 * @param items - Array of items with a slug property
 * @param duplicationCount - How many times to repeat the items
 * @returns New array where each duplicated item has a unique loopKey for React key prop
 *
 * Example: 4 items duplicated 3 times = 12 total items, each with loopKey like "carpentry__set0", "carpentry__set1", etc.
 */
export function buildLoopItems<T extends { slug: string }>(
  items: T[],
  duplicationCount: number,
): (T & { loopKey: string })[] {
  const out: (T & { loopKey: string })[] = []
  for (let set = 0; set < duplicationCount; set++) {
    // Include the item's index so the key stays unique even if two services in
    // the same row happen to share a slug (slugs are only unique per category).
    items.forEach((item, i) => {
      out.push({ ...item, loopKey: `${item.slug}__${i}__set${set}` })
    })
  }
  return out
}

/**
 * Deal a flat list of items round-robin into `rowCount` rows so counts stay
 * balanced (row lengths differ by at most 1) even when the total isn't
 * divisible by `rowCount`.
 *
 * @param items - Flat, already-ordered (e.g. pre-shuffled) list
 * @param rowCount - Number of rows to produce (always returns exactly this many)
 * @returns Array of `rowCount` sub-arrays; trailing rows may be empty if items < rowCount
 *
 * Example: 8 items into 3 rows → [3, 3, 2] items (indices 0,3,6 / 1,4,7 / 2,5).
 */
export function splitIntoRows<T>(items: T[], rowCount: number): T[][] {
  const rows: T[][] = Array.from({ length: rowCount }, () => [])
  items.forEach((item, idx) => {
    rows[idx % rowCount].push(item)
  })
  return rows
}
