import { ReviewRequest } from '@/core/entities/ReviewRequest'
import { IReviewRequestRepository } from '@/core/repositories/IReviewRequestRepository'

export class CancelReviewRequestUseCase {
  constructor(private reviewRequestRepository: IReviewRequestRepository) {}

  async execute(id: string): Promise<ReviewRequest> {
    const request = await this.reviewRequestRepository.findById(id)
    if (!request) throw new Error('Review request not found')

    const cancelled = request.cancel()
    await this.reviewRequestRepository.update(cancelled)
    return cancelled
  }
}
