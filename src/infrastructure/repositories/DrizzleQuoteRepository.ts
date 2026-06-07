import { eq, gte, count as countFn } from 'drizzle-orm'
import { db } from '../db/client'
import { quotes } from '../db/schema'
import { Quote } from '@/core/entities/Quote'
import { Email } from '@/core/value-objects/Email'
import { Phone } from '@/core/value-objects/Phone'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'
import { QuoteStatus } from '@/core/entities/Quote'

export class DrizzleQuoteRepository implements IQuoteRepository {
  async save(quote: Quote): Promise<void> {
    await db.insert(quotes).values({
      id: quote.id,
      name: quote.name,
      email: quote.email.toString(),
      phone: quote.phone?.toString() || null,
      service: quote.service,
      message: quote.message,
      trackingToken: quote.trackingToken,
      status: quote.status,
      attachmentUrls: quote.attachmentUrls,
      createdAt: quote.createdAt,
      updatedAt: new Date(),
    })
  }

  async findById(id: string): Promise<Quote | null> {
    const row = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1)

    if (!row || row.length === 0) return null

    return this.mapRowToQuote(row[0])
  }

  async findByToken(token: string): Promise<Quote | null> {
    const row = await db
      .select()
      .from(quotes)
      .where(eq(quotes.trackingToken, token))
      .limit(1)

    if (!row || row.length === 0) return null

    return this.mapRowToQuote(row[0])
  }

  async findAll(limit = 20, offset = 0): Promise<Quote[]> {
    const rows = await db
      .select()
      .from(quotes)
      .limit(limit)
      .offset(offset)

    return rows.map((row) => this.mapRowToQuote(row))
  }

  async update(quote: Quote): Promise<void> {
    await db
      .update(quotes)
      .set({
        name: quote.name,
        email: quote.email.toString(),
        phone: quote.phone?.toString() || null,
        service: quote.service,
        message: quote.message,
        status: quote.status,
        attachmentUrls: quote.attachmentUrls,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quote.id))
  }

  async count(): Promise<number> {
    const result = await db.select({ count: countFn() }).from(quotes)
    return result[0]?.count || 0
  }

  async countByStatus(status: QuoteStatus): Promise<number> {
    const result = await db
      .select({ count: countFn() })
      .from(quotes)
      .where(eq(quotes.status, status))
    return result[0]?.count || 0
  }

  /**
   * Returns real quote counts per day for the last `days` days.
   * Buckets by local calendar day in JS to avoid DB/JS timezone mismatches.
   */
  async countByDay(days = 7): Promise<{ date: string; count: number }[]> {
    const since = new Date()
    since.setHours(0, 0, 0, 0)
    since.setDate(since.getDate() - (days - 1))

    const rows = await db
      .select({ createdAt: quotes.createdAt })
      .from(quotes)
      .where(gte(quotes.createdAt, since))

    const buckets = new Map<string, number>()
    for (const r of rows) {
      const key = new Date(r.createdAt).toDateString()
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }

    return Array.from({ length: days }).map((_, i) => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - (days - 1 - i))
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: buckets.get(d.toDateString()) ?? 0,
      }
    })
  }

  private mapRowToQuote(row: any): Quote {
    const email = Email.create(row.email)
    const phone = row.phone ? Phone.create(row.phone) : null

    return Quote.reconstruct({
      id: row.id,
      name: row.name,
      email,
      phone,
      service: row.service,
      message: row.message,
      trackingToken: row.trackingToken,
      status: row.status,
      attachmentUrls: (row.attachmentUrls as string[]) || [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
