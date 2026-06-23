import type { FieldComponentProps } from '../types'

/**
 * Not yet implemented. No schema in this codebase uses an AdvancedRenderer
 * field type (repeater/matrix/conditional_group/computed/lookup/
 * image_choice_single/image_choice_multi) today — this stub exists only so
 * `FormRenderer` has something to dispatch to. These need real design work
 * (see FormSchema.ts's `buildBaseSchema` z.unknown() note) and are out of
 * scope for Task 4.2.3.
 */
export function AdvancedRenderer({ field }: FieldComponentProps) {
  return <div>Unsupported field type: {field.type}</div>
}
