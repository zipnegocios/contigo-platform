import { Category } from '../entities/Category'

export interface ICategoryRepository {
  findAll(): Promise<Category[]>
  findById(id: string): Promise<Category | null>
  findBySlug(slug: string): Promise<Category | null>
  save(category: Category): Promise<void>
  update(category: Category): Promise<void>
  delete(id: string, reassignName: string): Promise<void>
}
