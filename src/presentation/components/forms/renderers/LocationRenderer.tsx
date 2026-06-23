import type { FieldComponentProps } from '../types'

/**
 * Not yet implemented. No schema in this codebase uses a LocationRenderer
 * field type (map_picker/address_autocomplete/geolocation) today — this
 * stub exists only so `FormRenderer` has something to dispatch to. Real
 * map/geolocation UI is out of scope for Task 4.2.3.
 */
export function LocationRenderer({ field }: FieldComponentProps) {
  return <div>Unsupported field type: {field.type}</div>
}
