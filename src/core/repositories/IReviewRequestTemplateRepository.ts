import { ReviewRequestTemplate } from '@/core/entities/ReviewRequestTemplate'

export interface IReviewRequestTemplateRepository {
  save(template: ReviewRequestTemplate): Promise<void>
  update(template: ReviewRequestTemplate): Promise<void>
  findById(id: string): Promise<ReviewRequestTemplate | null>
  findDefault(): Promise<ReviewRequestTemplate | null>
  findAll(): Promise<ReviewRequestTemplate[]>
}
