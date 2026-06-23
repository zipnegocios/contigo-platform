import type { FieldComponentProps } from '../types'

/**
 * Default renderer for TextInputRenderer-primitive field types (text, email,
 * phone, url, password, number, currency, slug, masked, hidden, percentage,
 * postcode — see FIELD_TYPE_REGISTRY). Plain labeled `<input>`, no bespoke
 * styling — hosts that need exact visual parity with an existing design
 * (e.g. QuoteForm's floating-label inputs) should pass an override via
 * `fieldComponents` instead of relying on this default.
 */
function htmlInputType(fieldType: string): string {
  switch (fieldType) {
    case 'email':
      return 'email'
    case 'phone':
      return 'tel'
    case 'url':
      return 'url'
    case 'password':
      return 'password'
    case 'number':
    case 'currency':
    case 'percentage':
      return 'number'
    case 'hidden':
      return 'hidden'
    default:
      return 'text'
  }
}

export function TextInputRenderer({ field, register, error }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={field.id}>{field.label}</label>
      <input
        id={field.id}
        type={htmlInputType(field.type)}
        placeholder={field.placeholder}
        aria-invalid={!!error}
        {...register(field.id)}
      />
      {field.helpText && <p>{field.helpText}</p>}
      {error && <p role="alert">{error.message}</p>}
    </div>
  )
}
