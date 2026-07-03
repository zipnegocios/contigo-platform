import { Category } from '../entities/Category'
import type { FlatCategory, CategoryType, ReorderItem } from '@/types/category'

export interface ICategoryRepository {
  findAll(type?: CategoryType, activeOnly?: boolean): Promise<Category[]>
  findFlat(type: CategoryType, activeOnly?: boolean): Promise<FlatCategory[]>
  findTrashed(type?: CategoryType): Promise<Category[]>
  findById(id: string): Promise<Category | null>
  findBySlug(slug: string, type?: CategoryType): Promise<Category | null>
  save(category: Category): Promise<void>
  update(category: Category): Promise<void>
  reorder(updates: ReorderItem[]): Promise<void>
  trash(id: string): Promise<void>
  restore(id: string): Promise<void>
  delete(id: string): Promise<void>
}
