import type { FieldComponentProps } from '../types'

/**
 * Not yet implemented. No schema in this codebase uses a CompositeRenderer
 * field type (full_name/address/country_select/state_select) today — this
 * stub exists only so `FormRenderer` has something to dispatch to. Real
 * composite/nested-field UI is out of scope for Task 4.2.3.
 */
export function CompositeRenderer({ field }: FieldComponentProps) {
  return <div>Unsupported field type: {field.type}</div>
}
