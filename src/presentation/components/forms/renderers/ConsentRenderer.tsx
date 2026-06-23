import type { FieldComponentProps } from '../types'

/**
 * Default renderer for ConsentRenderer-primitive field types
 * (consent_checkbox, terms_acceptance, captcha). A checkbox + label;
 * `required: true` is enforced by `buildZodValidator` via `z.literal(true)`
 * (Task 4.2.2) — unchecked submission fails validation with `error` below.
 */
export function ConsentRenderer({ field, register, error }: FieldComponentProps) {
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
