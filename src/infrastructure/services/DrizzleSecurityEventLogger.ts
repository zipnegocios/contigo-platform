import { db } from '../db/client'
import { securityEvents } from '../db/schema'
import type { ISecurityEventLogger, SecurityEventInput } from '@/core/services/ISecurityEventLogger'

export class DrizzleSecurityEventLogger implements ISecurityEventLogger {
  async log(event: SecurityEventInput): Promise<void> {
    await db.insert(securityEvents).values({
      eventType: event.eventType,
      payload: event.payload,
      actorId: event.actorId,
    })
  }
}
