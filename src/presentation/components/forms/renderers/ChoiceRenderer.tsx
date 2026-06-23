import type { FieldComponentProps } from '../types'

const BOOLEAN_TYPES = ['checkbox', 'switch', 'yes_no']
const ARRAY_TYPES = ['multi_select', 'checkbox_group', 'tags_input']

/**
 * Default renderer for ChoiceRenderer-primitive field types. Covers three
 * shapes per the Task 4.2.2 Zod recipe (see buildBaseSchema):
 *  - boolean types (checkbox/switch/yes_no) -> a single checkbox
 *  - array types (multi_select/checkbox_group/tags_input) -> a basic
 *    multi-checkbox list over `field.options`
 *  - everything else (select/radio_group/segmented/button_group/combobox)
 *    -> a plain native `<select>` over `field.options`
 * Nothing fancy — hosts needing bespoke styling (e.g. QuoteForm's custom
 * `<select>`) pass an override via `fieldComponents`.
 */
export function ChoiceRenderer({ field, register, error }: FieldComponentProps) {
  if (BOOLEAN_TYPES.includes(field.type)) {
    return (
      <div>
        <label htmlFor={field.id}>
          <input id={field.id} type="checkbox" aria-invalid={!!error} {...register(field.id)} />
          {field.label}
        </label>
        {field.helpText && <p>{field.helpText}</p>}
        {error && <p role="alert">{error.message}</p>}
      </div>
    )
  }

  if (ARRAY_TYPES.includes(field.type)) {
    return (
      <fieldset>
        <legend>{field.label}</legend>
        {(field.options ?? []).map((option) => (
          <label key={option}>
            <input type="checkbox" value={option} {...register(field.id)} />
            {option}
          </label>
        ))}
        {field.helpText && <p>{field.helpText}</p>}
        {error && <p role="alert">{error.message}</p>}
      </fieldset>
    )
  }

  // Single-choice default: select, radio_group, segmented, button_group, combobox
  return (
    <div>
      <label htmlFor={field.id}>{field.label}</label>
      <select id={field.id} aria-invalid={!!error} defaultValue="" {...register(field.id)}>
        <option value="" disabled>
          {field.placeholder ?? `Select ${field.label}`}
        </option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {field.helpText && <p>{field.helpText}</p>}
      {error && <p role="alert">{error.message}</p>}
    </div>
  )
}
