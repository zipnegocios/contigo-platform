export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const email = raw.trim().toLowerCase()

    // Simple regex validation
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(email)) {
      throw new Error(`Invalid email format: ${raw}`)
    }

    return new Email(email)
  }

  toString(): string {
    return this.value
  }
}
