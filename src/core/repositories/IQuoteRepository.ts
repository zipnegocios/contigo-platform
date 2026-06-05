import { Quote } from '../entities/Quote'

export interface IQuoteRepository {
  save(quote: Quote): Promise<void>
  findById(id: string): Promise<Quote | null>
  findByToken(token: string): Promise<Quote | null>
  findAll(limit?: number, offset?: number): Promise<Quote[]>
  update(quote: Quote): Promise<void>
}
