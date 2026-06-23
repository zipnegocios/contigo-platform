'use client'

import { useForm, type FieldValues, type FieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { buildZodValidator, type FormSchema } from '@/core/form-schema/FormSchema'
import { FIELD_TYPE_REGISTRY, type RendererPrimitive } from '@/core/form-schema/fieldTypes'
import type { FieldComponent, FieldComponentOverrides } from './types'
import { TextInputRenderer } from './renderers/TextInputRenderer'
import { TextareaRenderer } from './renderers/TextareaRenderer'
import { ChoiceRenderer } from './renderers/ChoiceRenderer'
import { DateTimeRenderer } from './renderers/DateTimeRenderer'
import { RangeRenderer } from './renderers/RangeRenderer'
import { FileRenderer } from './renderers/FileRenderer'
import { CompositeRenderer } from './renderers/CompositeRenderer'
import { LocationRenderer } from './renderers/LocationRenderer'
import { AdvancedRenderer } from './renderers/AdvancedRenderer'
import { ConsentRenderer } from './renderers/ConsentRenderer'

/**
 * Built-in default component per renderer primitive. LayoutRenderer /
 * NavRenderer / SystemFieldRenderer are intentionally absent — fields whose
 * `FIELD_TYPE_REGISTRY` descriptor has `isDataField === false` are skipped
 * before this map is ever consulted (see `renderableFields` below), since
 * no schema in this codebase uses them yet and they render nothing.
 */
const DEFAULT_RENDERERS: Partial<Record<RendererPrimitive, FieldComponent>> = {
  TextInputRenderer,
  TextareaRenderer,
  ChoiceRenderer,
  DateTimeRenderer,
  RangeRenderer,
  FileRenderer,
  CompositeRenderer,
  LocationRenderer,
  AdvancedRenderer,
  ConsentRenderer,
}

export interface FormRendererProps {
  schema: FormSchema
  onSubmit: (data: FieldValues) => void | Promise<void>
  /**
   * Per-field-type overrides, keyed by `field.type` (e.g. 'text', 'email',
   * 'select', 'textarea', 'consent_checkbox'). When a field's type has an
   * entry here, that component renders instead of the built-in default for
   * its renderer primitive. See `src/presentation/components/forms/types.ts`
   * for the exact contract a host implements.
   */
  fieldComponents?: FieldComponentOverrides
  /** Which step to render (this task's schemas have exactly one). */
  stepIndex?: number
  className?: string
  /**
   * Extra content rendered before the schema-driven fields but still inside
   * the `<form>` (e.g. a host's heading/overline markup that must be the
   * form's first child for its existing CSS to apply correctly).
   */
  beforeFields?: React.ReactNode
  /**
   * Extra content rendered after the schema-driven fields but still inside
   * the `<form>` (e.g. a host's non-schema sidecar UI, a submit button).
   * Render-prop form so hosts can drive their own submit button's
   * busy/disabled state off the same `isSubmitting` this renderer's
   * `useForm()` instance tracks, without `FormRenderer` exposing its whole
   * `useForm()` return value.
   */
  children?: React.ReactNode | ((state: { isSubmitting: boolean }) => React.ReactNode)
}

/**
 * Shared, schema-driven form component (Task 4.2.3). Owns a single
 * `useForm()` instance validated by the schema's dynamically-built Zod
 * validator (Task 4.2.2's `buildZodValidator`). Renders `schema.steps[stepIndex]`'s
 * fields in order, dispatching each field to either a host-supplied override
 * (`fieldComponents[field.type]`) or this renderer's own default for that
 * field's renderer primitive.
 *
 * Multi-step navigation (Next/Back/progress UI) is explicitly NOT built
 * here — this task's seeded schema has exactly one step, and a real wizard
 * UI is out of scope. Rendering `stepIndex`'s fields with no step-to-step
 * wiring is the deliberately minimal, forward-compatible shape.
 */
export function FormRenderer({
  schema,
  onSubmit,
  fieldComponents,
  stepIndex = 0,
  className,
  beforeFields,
  children,
}: FormRendererProps) {
  const validator = buildZodValidator(schema)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validator),
  })

  const step = schema.steps[stepIndex]
  const fields = step?.fields ?? []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      {beforeFields}
      {fields.map((field) => {
        const descriptor = FIELD_TYPE_REGISTRY[field.type]

        // Non-data fields (layout/nav/system) and unknown type names have no
        // default renderer in this task — they render nothing.
        if (!descriptor || descriptor.isDataField === false) {
          return null
        }

        const Component = fieldComponents?.[field.type] ?? DEFAULT_RENDERERS[descriptor.renderer]

        if (!Component) {
          return (
            <div key={field.id}>Unsupported field type: {field.type}</div>
          )
        }

        // react-hook-form's FieldErrors value type is broader than
        // FieldError (it can recurse for nested fields); this renderer's
        // fields are always flat/top-level so narrowing to FieldError here
        // matches what every renderer primitive's props actually expect.
        const error = errors[field.id] as FieldError | undefined

        return (
          <Component key={field.id} field={field} register={register} error={error} />
        )
      })}
      {typeof children === 'function' ? children({ isSubmitting }) : children}
    </form>
  )
}
