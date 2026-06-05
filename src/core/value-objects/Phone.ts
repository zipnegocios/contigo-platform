export class Phone {
  private constructor(readonly value: string) {}

  static create(raw?: string): Phone | null {
    if (!raw || !raw.trim()) {
      return null
    }

    const phone = raw.trim().replace(/\D/g, '')

    // Optional: validate Australian phone numbers
    if (phone.length < 7) {
      throw new Error(`Invalid phone number: ${raw}`)
    }

    return new Phone(raw.trim())
  }

  toString(): string {
    return this.value
  }
}
