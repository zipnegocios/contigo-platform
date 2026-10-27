/**
 * Google exposes customer photos for a location but never says which review a
 * photo belongs to. A review's photos are uploaded by the reviewer at roughly
 * the same time as the review, so we match on reviewer name + upload time.
 * Heuristic only — admins can reassign or hide any photo.
 */

/** Max distance between a photo's upload time and the review's creation time. */
export const PHOTO_MATCH_WINDOW_MS = 48 * 60 * 60 * 1000

export interface PhotoMatchCandidate {
  attributionName: string | null
  createdAt: Date
}

export interface ReviewMatchTarget {
  id: string
  reviewerName: string
  reviewCreatedAt: Date
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Stricter than the review-request matcher: a shared first name alone is not
 * enough here, because a wrong match would publish a stranger's photo.
 */
export function isSameReviewer(a: string, b: string): boolean {
  const x = normalizeName(a)
  const y = normalizeName(b)
  if (!x || !y) return false
  if (x === y) return true
  // Containment ("Lisa Howe" within "Lisa Howe AU") only when BOTH are multi-word:
  // a bare first name must never claim a photo.
  const bothMultiWord = x.includes(' ') && y.includes(' ')
  return bothMultiWord && (x.includes(y) || y.includes(x))
}

/** Returns the id of the review the photo most likely belongs to, or null. */
export function matchPhotoToReview(photo: PhotoMatchCandidate, reviews: ReviewMatchTarget[]): string | null {
  if (!photo.attributionName) return null
  let best: { id: string; distance: number } | null = null
  for (const review of reviews) {
    if (!isSameReviewer(photo.attributionName, review.reviewerName)) continue
    const distance = Math.abs(photo.createdAt.getTime() - review.reviewCreatedAt.getTime())
    if (distance > PHOTO_MATCH_WINDOW_MS) continue
    if (!best || distance < best.distance) best = { id: review.id, distance }
  }
  return best?.id ?? null
}
