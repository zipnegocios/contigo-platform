import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { quotes } from '../db/schema'
import { Quote } from '@/core/entities/Quote'
import { Email } from '@/core/value-objects/Email'
import { Phone } from '@/core/value-objects/Phone'
import { IQuoteRepository } from '@/core/repositories/IQuoteRepository'

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
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quote.id))
  }

  private mapRowToQuote(row: any): Quote {
    const email = Email.create(row.email)
    const phone = row.phone ? Phone.create(row.phone) : null

    return {
      id: row.id,
      name: row.name,
      email,
      phone,
      service: row.service,
      message: row.message,
      trackingToken: row.trackingToken,
      status: row.status,
      createdAt: row.createdAt,
    } as Quote
  }
}
