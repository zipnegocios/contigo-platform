import type { FieldError, UseFormRegister, FieldValues } from 'react-hook-form'
import type { FormField } from '@/core/form-schema/FormSchema'

/**
 * Props every renderer primitive (default or override) receives for a single
 * field. `FormRenderer` owns the single shared `useForm()` instance — these
 * props are how that instance's `register` + per-field `error` get threaded
 * down to whatever component ends up drawing the field, without that
 * component needing to know about the rest of the form.
 *
 * Kept intentionally small: just what's needed to call `register(field.id)`
 * and render a validation message. If a future renderer primitive needs
 * more (e.g. `watch`/`setValue` for cross-field logic), extend this — don't
 * thread the whole `useForm()` return value down, that defeats the point of
 * a narrow override contract.
 */
export interface FieldComponentProps {
  field: FormField
  register: UseFormRegister<FieldValues>
  error?: FieldError
}

/**
 * A component that knows how to render one form field end-to-end (input +
 * label + validation message), wired to the shared `useForm()` via
 * `register`. Both the renderer's own defaults (TextInputRenderer etc.) and
 * a host component's per-field overrides (e.g. `QuoteForm`'s floating-label
 * blocks) implement this same shape.
 */
export type FieldComponent = (props: FieldComponentProps) => React.ReactElement | null

/**
 * Optional per-field-type overrides a host passes into `<FormRenderer>`.
 * Keyed by `field.type` (e.g. 'text', 'email', 'select', 'textarea',
 * 'consent_checkbox') — when a field's type has an entry here, `FormRenderer`
 * renders that component instead of its own built-in default for that
 * field's renderer primitive.
 */
export type FieldComponentOverrides = Record<string, FieldComponent>
