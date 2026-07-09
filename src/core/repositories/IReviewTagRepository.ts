export interface ReviewTag {
  id: string
  name: string
  color: string
  createdAt: Date
}

export interface IReviewTagRepository {
  findAll(): Promise<ReviewTag[]>
  create(input: { name: string; color?: string }): Promise<ReviewTag>
  delete(id: string): Promise<void>
  findTagIdsForReview(reviewId: string): Promise<string[]>
  assignToReview(reviewId: string, tagId: string): Promise<void>
  removeFromReview(reviewId: string, tagId: string): Promise<void>
}
