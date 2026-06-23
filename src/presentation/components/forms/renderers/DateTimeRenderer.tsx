import type { FieldComponentProps } from '../types'

/**
 * Not yet implemented. No schema in this codebase uses a DateTimeRenderer
 * field type (date/time/datetime/date_range/month_year/duration) today —
 * this stub exists only so `FormRenderer` has something to dispatch to.
 * Real date/time UI is out of scope for Task 4.2.3.
 */
export function DateTimeRenderer({ field }: FieldComponentProps) {
  return <div>Unsupported field type: {field.type}</div>
}
