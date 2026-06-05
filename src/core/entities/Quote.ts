import { Email } from '../value-objects/Email'
import { Phone } from '../value-objects/Phone'

export type QuoteStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed'

export interface CreateQuoteInput {
  name: string
  email: string
  phone?: string
  service: string
  message: string
}

export class Quote {
  readonly id: string
  readonly name: string
  readonly email: Email
  readonly phone: Phone | null
  readonly service: string
  readonly message: string
  readonly trackingToken: string
  readonly status: QuoteStatus
  readonly createdAt: Date

  private constructor(props: {
    id: string
    name: string
    email: Email
    phone: Phone | null
    service: string
    message: string
    trackingToken: string
    status: QuoteStatus
    createdAt: Date
  }) {
    this.id = props.id
    this.name = props.name
    this.email = props.email
    this.phone = props.phone
    this.service = props.service
    this.message = props.message
    this.trackingToken = props.trackingToken
    this.status = props.status
    this.createdAt = props.createdAt
  }

  static create(input: CreateQuoteInput): Quote {
    const email = Email.create(input.email)
    const phone = Phone.create(input.phone)

    const id = crypto.randomUUID()
    const trackingToken = crypto.randomUUID()

    return new Quote({
      id,
      name: input.name.trim(),
      email,
      phone,
      service: input.service.trim(),
      message: input.message.trim(),
      trackingToken,
      status: 'new',
      createdAt: new Date(),
    })
  }
}
