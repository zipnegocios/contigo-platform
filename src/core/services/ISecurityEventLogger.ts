export interface SecurityEventInput {
  eventType: string
  payload: Record<string, unknown>
  actorId: string | null
}

export interface ISecurityEventLogger {
  log(event: SecurityEventInput): Promise<void>
}
