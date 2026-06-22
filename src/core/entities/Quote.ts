import { Email } from '../value-objects/Email'
import { Phone } from '../value-objects/Phone'

export type QuoteStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed'

export interface CreateQuoteInput {
  name: string
  email: string
  phone?: string
  service: string
  message: string
  attachmentUrls?: string[]
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
  readonly attachmentUrls: string[]
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    name: string
    email: Email
    phone: Phone | null
    service: string
    message: string
    trackingToken: string
    status: QuoteStatus
    attachmentUrls: string[]
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.name = props.name
    this.email = props.email
    this.phone = props.phone
    this.service = props.service
    this.message = props.message
    this.trackingToken = props.trackingToken
    this.status = props.status
    this.attachmentUrls = props.attachmentUrls
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateQuoteInput): Quote {
    const email = Email.create(input.email)
    const phone = Phone.create(input.phone)

    const id = crypto.randomUUID()
    const trackingToken = crypto.randomUUID()
    const now = new Date()

    return new Quote({
      id,
      name: input.name.trim(),
      email,
      phone,
      service: input.service.trim(),
      message: input.message.trim(),
      trackingToken,
      status: 'new',
      attachmentUrls: input.attachmentUrls ?? [],
      createdAt: now,
      updatedAt: now,
    })
  }

  withStatus(status: QuoteStatus): Quote {
    return new Quote({
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      service: this.service,
      message: this.message,
      trackingToken: this.trackingToken,
      status,
      attachmentUrls: this.attachmentUrls,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  withContact(contact: { name: string; email: Email; phone: Phone | null }): Quote {
    return new Quote({
      id: this.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      service: this.service,
      message: this.message,
      trackingToken: this.trackingToken,
      status: this.status,
      attachmentUrls: this.attachmentUrls,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    name: string
    email: Email
    phone: Phone | null
    service: string
    message: string
    trackingToken: string
    status: QuoteStatus
    attachmentUrls: string[]
    createdAt: Date
    updatedAt: Date
  }): Quote {
    return new Quote(props)
  }
}
