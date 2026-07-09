export type ReviewSentiment = 'positive' | 'neutral' | 'negative'

export interface CreateGoogleReviewInput {
  googleReviewId: string
  locationId: string
  reviewerName: string
  reviewerAvatarUrl?: string | null
  reviewerProfileUrl?: string | null
  rating: number
  comment?: string | null
  reviewCreatedAt: Date
  reviewUpdatedAt: Date
  language?: string | null
}

export interface SyncedGoogleReviewContent {
  reviewerName: string
  reviewerAvatarUrl: string | null
  reviewerProfileUrl: string | null
  rating: number
  comment: string | null
  reviewUpdatedAt: Date
  language: string | null
  ownerReply: string | null
  ownerReplyAt: Date | null
}

export interface AiEnrichment {
  summary: string | null
  sentiment: ReviewSentiment | null
  categories: string[]
  spamScore: number | null
}

export class GoogleReview {
  readonly id: string
  readonly googleReviewId: string
  readonly locationId: string
  readonly reviewerName: string
  readonly reviewerAvatarUrl: string | null
  readonly reviewerProfileUrl: string | null
  readonly rating: number
  readonly comment: string | null
  readonly reviewCreatedAt: Date
  readonly reviewUpdatedAt: Date
  readonly language: string | null
  readonly ownerReply: string | null
  readonly ownerReplyAt: Date | null
  readonly isVisible: boolean
  readonly isFeatured: boolean
  readonly isPinned: boolean
  readonly archivedAt: Date | null
  readonly internalNotes: string | null
  readonly aiSummary: string | null
  readonly aiSentiment: ReviewSentiment | null
  readonly aiCategories: string[]
  readonly spamScore: number | null
  readonly deletedOnGoogleAt: Date | null
  readonly syncedAt: Date
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    googleReviewId: string
    locationId: string
    reviewerName: string
    reviewerAvatarUrl: string | null
    reviewerProfileUrl: string | null
    rating: number
    comment: string | null
    reviewCreatedAt: Date
    reviewUpdatedAt: Date
    language: string | null
    ownerReply: string | null
    ownerReplyAt: Date | null
    isVisible: boolean
    isFeatured: boolean
    isPinned: boolean
    archivedAt: Date | null
    internalNotes: string | null
    aiSummary: string | null
    aiSentiment: ReviewSentiment | null
    aiCategories: string[]
    spamScore: number | null
    deletedOnGoogleAt: Date | null
    syncedAt: Date
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.googleReviewId = props.googleReviewId
    this.locationId = props.locationId
    this.reviewerName = props.reviewerName
    this.reviewerAvatarUrl = props.reviewerAvatarUrl
    this.reviewerProfileUrl = props.reviewerProfileUrl
    this.rating = props.rating
    this.comment = props.comment
    this.reviewCreatedAt = props.reviewCreatedAt
    this.reviewUpdatedAt = props.reviewUpdatedAt
    this.language = props.language
    this.ownerReply = props.ownerReply
    this.ownerReplyAt = props.ownerReplyAt
    this.isVisible = props.isVisible
    this.isFeatured = props.isFeatured
    this.isPinned = props.isPinned
    this.archivedAt = props.archivedAt
    this.internalNotes = props.internalNotes
    this.aiSummary = props.aiSummary
    this.aiSentiment = props.aiSentiment
    this.aiCategories = props.aiCategories
    this.spamScore = props.spamScore
    this.deletedOnGoogleAt = props.deletedOnGoogleAt
    this.syncedAt = props.syncedAt
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateGoogleReviewInput): GoogleReview {
    const now = new Date()
    return new GoogleReview({
      id: crypto.randomUUID(),
      googleReviewId: input.googleReviewId,
      locationId: input.locationId,
      reviewerName: input.reviewerName,
      reviewerAvatarUrl: input.reviewerAvatarUrl ?? null,
      reviewerProfileUrl: input.reviewerProfileUrl ?? null,
      rating: input.rating,
      comment: input.comment ?? null,
      reviewCreatedAt: input.reviewCreatedAt,
      reviewUpdatedAt: input.reviewUpdatedAt,
      language: input.language ?? null,
      ownerReply: null,
      ownerReplyAt: null,
      isVisible: false, // opt-in publishing
      isFeatured: false,
      isPinned: false,
      archivedAt: null,
      internalNotes: null,
      aiSummary: null,
      aiSentiment: null,
      aiCategories: [],
      spamScore: null,
      deletedOnGoogleAt: null,
      syncedAt: now,
      createdAt: now,
      updatedAt: now,
    })
  }

  /**
   * Applies fresh content from a sync reconciliation pass. Moderation fields
   * (isVisible/isFeatured/isPinned/archivedAt/internalNotes/AI fields) and
   * timestamps outside this set are deliberately untouched — admin curation
   * must never be clobbered by a Google sync (see plan Phase 2).
   */
  withSyncedContent(content: SyncedGoogleReviewContent): GoogleReview {
    return new GoogleReview({
      ...this,
      reviewerName: content.reviewerName,
      reviewerAvatarUrl: content.reviewerAvatarUrl,
      reviewerProfileUrl: content.reviewerProfileUrl,
      rating: content.rating,
      comment: content.comment,
      reviewUpdatedAt: content.reviewUpdatedAt,
      language: content.language,
      ownerReply: content.ownerReply,
      ownerReplyAt: content.ownerReplyAt,
      deletedOnGoogleAt: null,
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  markDeletedOnGoogle(): GoogleReview {
    return new GoogleReview({ ...this, deletedOnGoogleAt: new Date(), syncedAt: new Date(), updatedAt: new Date() })
  }

  show(): GoogleReview {
    return new GoogleReview({ ...this, isVisible: true, updatedAt: new Date() })
  }

  hide(): GoogleReview {
    return new GoogleReview({ ...this, isVisible: false, updatedAt: new Date() })
  }

  setFeatured(isFeatured: boolean): GoogleReview {
    return new GoogleReview({ ...this, isFeatured, updatedAt: new Date() })
  }

  setPinned(isPinned: boolean): GoogleReview {
    return new GoogleReview({ ...this, isPinned, updatedAt: new Date() })
  }

  archive(): GoogleReview {
    return new GoogleReview({ ...this, archivedAt: new Date(), updatedAt: new Date() })
  }

  restore(): GoogleReview {
    return new GoogleReview({ ...this, archivedAt: null, updatedAt: new Date() })
  }

  withInternalNotes(internalNotes: string | null): GoogleReview {
    return new GoogleReview({ ...this, internalNotes, updatedAt: new Date() })
  }

  /** Publishes an owner reply locally; the caller is responsible for the Google API call. */
  withOwnerReply(reply: string): GoogleReview {
    return new GoogleReview({ ...this, ownerReply: reply, ownerReplyAt: new Date(), updatedAt: new Date() })
  }

  withoutOwnerReply(): GoogleReview {
    return new GoogleReview({ ...this, ownerReply: null, ownerReplyAt: null, updatedAt: new Date() })
  }

  withAiEnrichment(enrichment: AiEnrichment): GoogleReview {
    return new GoogleReview({
      ...this,
      aiSummary: enrichment.summary,
      aiSentiment: enrichment.sentiment,
      aiCategories: enrichment.categories,
      spamScore: enrichment.spamScore,
      updatedAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    googleReviewId: string
    locationId: string
    reviewerName: string
    reviewerAvatarUrl: string | null
    reviewerProfileUrl: string | null
    rating: number
    comment: string | null
    reviewCreatedAt: Date
    reviewUpdatedAt: Date
    language: string | null
    ownerReply: string | null
    ownerReplyAt: Date | null
    isVisible: boolean
    isFeatured: boolean
    isPinned: boolean
    archivedAt: Date | null
    internalNotes: string | null
    aiSummary: string | null
    aiSentiment: ReviewSentiment | null
    aiCategories: string[]
    spamScore: number | null
    deletedOnGoogleAt: Date | null
    syncedAt: Date
    createdAt: Date
    updatedAt: Date
  }): GoogleReview {
    return new GoogleReview(props)
  }
}
