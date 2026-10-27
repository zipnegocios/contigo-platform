import type { PhotoMatchCandidate, ReviewMatchTarget } from './matchReviewPhotos'

/**
 * Documented test cases for `matchPhotoToReview` (no test framework in this
 * repo; run with tsx or wire into a runner, e.g.:
 *   for (const { description, photo, expected } of PHOTO_MATCH_FIXTURES) {
 *     it(description, () => expect(matchPhotoToReview(photo, PHOTO_MATCH_REVIEWS)).toBe(expected))
 *   }
 */
const day = 24 * 60 * 60 * 1000
const base = new Date('2026-07-20T10:00:00Z').getTime()

export const PHOTO_MATCH_REVIEWS: ReviewMatchTarget[] = [
  { id: 'luciano', reviewerName: 'Luciano', reviewCreatedAt: new Date(base) },
  { id: 'lisa', reviewerName: 'Lisa Howe', reviewCreatedAt: new Date(base + 2 * day) },
  { id: 'luciano-old', reviewerName: 'Luciano', reviewCreatedAt: new Date(base - 30 * day) },
]

export interface PhotoMatchFixture {
  description: string
  photo: PhotoMatchCandidate
  expected: string | null
}

export const PHOTO_MATCH_FIXTURES: PhotoMatchFixture[] = [
  {
    description: 'same name, uploaded minutes after the review → that review',
    photo: { attributionName: 'Luciano', createdAt: new Date(base + 5 * 60 * 1000) },
    expected: 'luciano',
  },
  {
    description: 'same name twice → the review closest in time wins',
    photo: { attributionName: 'Luciano', createdAt: new Date(base - 30 * day + 60 * 1000) },
    expected: 'luciano-old',
  },
  {
    description: 'case and accents ignored',
    photo: { attributionName: 'LUCIANÓ', createdAt: new Date(base) },
    expected: 'luciano',
  },
  {
    description: 'multi-word containment ("Lisa Howe" vs "Lisa M Howe" is not containment) → no match',
    photo: { attributionName: 'Lisa M Howe', createdAt: new Date(base + 2 * day) },
    expected: null,
  },
  {
    description: 'multi-word containment ("Lisa Howe" within "Lisa Howe AU") → match',
    photo: { attributionName: 'Lisa Howe AU', createdAt: new Date(base + 2 * day) },
    expected: 'lisa',
  },
  {
    description: 'first name only ("Lisa") is not enough → no match',
    photo: { attributionName: 'Lisa', createdAt: new Date(base + 2 * day) },
    expected: null,
  },
  {
    description: 'right name but outside the 48h window → no match',
    photo: { attributionName: 'Lisa Howe', createdAt: new Date(base + 6 * day) },
    expected: null,
  },
  {
    description: 'no attribution name → no match',
    photo: { attributionName: null, createdAt: new Date(base) },
    expected: null,
  },
]
