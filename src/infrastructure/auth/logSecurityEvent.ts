import type { ISecurityEventLogger, SecurityEventInput } from '@/core/services/ISecurityEventLogger'

/** Logging a security event must never break the flow it's observing. */
export async function logSecurityEventSafely(
  logger: ISecurityEventLogger,
  event: SecurityEventInput,
): Promise<void> {
  try {
    await logger.log(event)
  } catch (error) {
    console.error('Failed to log security event:', event.eventType, error)
  }
}
