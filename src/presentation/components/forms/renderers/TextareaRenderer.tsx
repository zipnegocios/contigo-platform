import type { FieldComponentProps } from '../types'

/**
 * Default renderer for TextareaRenderer-primitive field types (textarea,
 * rich_text, paragraph_block). Plain labeled `<textarea>` — no rich-text
 * editing, that's out of scope for this task.
 */
export function TextareaRenderer({ field, register, error }: FieldComponentProps) {
  return (
    <div>
      <label htmlFor={field.id}>{field.label}</label>
      <textarea
        id={field.id}
        placeholder={field.placeholder}
        rows={4}
        aria-invalid={!!error}
        {...register(field.id)}
      />
      {field.helpText && <p>{field.helpText}</p>}
      {error && <p role="alert">{error.message}</p>}
    </div>
  )
}
