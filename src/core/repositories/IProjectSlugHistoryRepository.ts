export interface IProjectSlugHistoryRepository {
  record(projectId: string, oldSlug: string): Promise<void>
  /** Returns the project id that previously used this slug, if any. */
  findProjectIdByOldSlug(oldSlug: string): Promise<string | null>
}
