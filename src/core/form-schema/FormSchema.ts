import { z } from 'zod'
import { FIELD_TYPE_REGISTRY, type RendererPrimitive } from './fieldTypes'

/**
 * Form Builder core types (Task 4.2.2).
 *
 * `FormSchema` is the shape stored in `form_versions.schema` (jsonb) — see
 * `src/infrastructure/db/schema.ts` and the seed migration
 * `20260622193729_seed_request_a_quote_form.sql`. It describes the *form
 * definition* (what fields exist, in what order, with what config) — not a
 * particular submission's answers. `buildZodValidator` below is what turns
 * a `FormSchema` into a validator for actual submission payloads.
 */

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  /**
   * Custom error message to use instead of Zod's generic default, applied
   * to whichever constraint check is relevant for this field's type (e.g.
   * the `.min()` call for a minLength-validated string, or the enum check
   * for a required select). See Task 4.2.3 fix-up: the original public
   * quote form had branded copy (e.g. "Please select a service") that a
   * bare Zod default would otherwise silently replace.
   */
  message?: string
}

export interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  helpText?: string
  required: boolean
  defaultValue?: unknown
  validation?: FieldValidation
  options?: string[]
  colSpan?: number
  visibilityConditions?: unknown
  mapsToSystemField?: string
  locked?: boolean
}

export interface FormStep {
  fields: FormField[]
}

export interface FormSchema {
  steps: FormStep[]
}

/**
 * Field types whose `required: true` constitutes the "consent always
 * mandatory" guarantee (see `buildZodValidator`'s hard rule below).
 */
const CONSENT_GATE_TYPES = ['consent_checkbox', 'terms_acceptance'] as const

/**
 * Builds the base (pre-required) Zod type for a single field, grouped by
 * the field type's renderer primitive — not by individual type name — to
 * keep this tractable across ~80 type strings. See Task 4.2.2 brief for the
 * per-primitive recipe.
 */
function buildBaseSchema(field: FormField, renderer: RendererPrimitive): z.ZodTypeAny {
  const validation = field.validation

  switch (renderer) {
    case 'TextInputRenderer': {
      if (field.type === 'number' || field.type === 'currency' || field.type === 'percentage') {
        let numberSchema = z.coerce.number()
        if (validation?.min !== undefined) numberSchema = numberSchema.min(validation.min, validation.message)
        if (validation?.max !== undefined) numberSchema = numberSchema.max(validation.max, validation.message)
        return numberSchema
      }

      let stringSchema = z.string()
      if (field.type === 'email') stringSchema = stringSchema.email(validation?.message)
      if (validation?.minLength !== undefined)
        stringSchema = stringSchema.min(validation.minLength, validation.message)
      if (validation?.maxLength !== undefined)
        stringSchema = stringSchema.max(validation.maxLength, validation.message)
      if (validation?.pattern !== undefined)
        stringSchema = stringSchema.regex(new RegExp(validation.pattern), validation.message)
      return stringSchema
    }

    case 'TextareaRenderer': {
      let stringSchema = z.string()
      if (validation?.minLength !== undefined)
        stringSchema = stringSchema.min(validation.minLength, validation.message)
      if (validation?.maxLength !== undefined)
        stringSchema = stringSchema.max(validation.maxLength, validation.message)
      return stringSchema
    }

    case 'ChoiceRenderer': {
      if (field.type === 'checkbox' || field.type === 'switch' || field.type === 'yes_no') {
        return z.boolean()
      }

      if (field.type === 'multi_select' || field.type === 'checkbox_group' || field.type === 'tags_input') {
        return z.array(z.string())
      }

      // Single-choice types: select, radio_group, segmented, button_group,
      // combobox.
      if (field.options && field.options.length > 0) {
        return z.enum(field.options as [string, ...string[]], validation?.message)
      }
      return z.string()
    }

    case 'DateTimeRenderer':
      return z.coerce.date()

    case 'RangeRenderer': {
      let numberSchema = z.coerce.number()
      if (validation?.min !== undefined) numberSchema = numberSchema.min(validation.min, validation.message)
      if (validation?.max !== undefined) numberSchema = numberSchema.max(validation.max, validation.message)
      return numberSchema
    }

    case 'FileRenderer':
      // Schema-validation level: a stored file key/URL string. Raw upload
      // handling is a later task's UI concern.
      return z.string()

    case 'CompositeRenderer':
    case 'LocationRenderer':
      // Simplest reasonable default — no bespoke nested-object validation
      // in this pass.
      return z.string()

    case 'AdvancedRenderer':
      // repeater/matrix/conditional_group/computed/lookup don't have a
      // sensible generic Zod shape without real design work. z.unknown() is
      // the honest, correct choice here.
      return z.unknown()

    case 'ConsentRenderer':
      // "Must be checked" is z.literal(true), not z.boolean() (which would
      // also accept false).
      return field.required ? z.literal(true) : z.boolean()

    default:
      // LayoutRenderer / NavRenderer / SystemFieldRenderer never reach here
      // — callers skip non-data fields before calling buildBaseSchema.
      return z.unknown()
  }
}

/**
 * Applies the field's `required` flag on top of the base schema built by
 * `buildBaseSchema`. Keyed off the *actual* Zod type (z.ZodString) rather
 * than the renderer name, since TextInputRenderer, TextareaRenderer, and
 * the z.string() defaults used by CompositeRenderer/LocationRenderer/
 * FileRenderer all produce string schemas and should behave the same way.
 */
function applyRequired(baseSchema: z.ZodTypeAny, field: FormField): z.ZodTypeAny {
  if (baseSchema instanceof z.ZodString) {
    if (!field.required) {
      return baseSchema.optional()
    }
    const hadMinLength = field.validation?.minLength !== undefined
    return hadMinLength ? baseSchema : baseSchema.min(1, field.validation?.message ?? 'Required')
  }

  // Non-string types (number/date/boolean/array/enum/literal/unknown/...):
  // required: false -> optional(); required: true -> already enforces
  // presence by type, leave as-is.
  return field.required ? baseSchema : baseSchema.optional()
}

/**
 * Turns a `FormSchema` (the form *definition*) into a Zod validator for an
 * actual submission payload: `{ [field.id]: value, ... }` flattened across
 * all steps.
 *
 * Hard rule: a `FormSchema` is not valid to build a validator for unless it
 * contains at least one required `consent_checkbox` or `terms_acceptance`
 * field — this materializes the "consent is always mandatory" decision and
 * is enforced regardless of what the (future) builder UI allows an admin to
 * configure.
 */
export function buildZodValidator(schema: FormSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const allFields = schema.steps.flatMap((step) => step.fields)

  const hasRequiredConsent = allFields.some(
    (field) =>
      (CONSENT_GATE_TYPES as readonly string[]).includes(field.type) && field.required === true
  )

  if (!hasRequiredConsent) {
    throw new Error(
      'Form schema must include at least one required consent_checkbox or terms_acceptance field'
    )
  }

  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of allFields) {
    const descriptor = FIELD_TYPE_REGISTRY[field.type]

    // Unknown type names and non-data-field types (layout/nav/system) never
    // get a Zod entry — they don't collect a value the way the z.object(...)
    // shape implies.
    if (!descriptor || descriptor.isDataField === false) {
      continue
    }

    const baseSchema = buildBaseSchema(field, descriptor.renderer)
    shape[field.id] = applyRequired(baseSchema, field)
  }

  return z.object(shape)
}
