export interface IReviewRequestSuppressionRepository {
  isSuppressed(email: string): Promise<boolean>
  suppress(email: string): Promise<void>
}
