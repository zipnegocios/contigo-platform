import type { FieldComponentProps } from '../types'

/**
 * Not yet implemented. No schema in this codebase uses a RangeRenderer
 * field type (number_stepper/slider/range_slider/rating) today — this stub
 * exists only so `FormRenderer` has something to dispatch to. Real
 * slider/stepper UI is out of scope for Task 4.2.3.
 */
export function RangeRenderer({ field }: FieldComponentProps) {
  return <div>Unsupported field type: {field.type}</div>
}
