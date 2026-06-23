import { FIELD_TYPE_REGISTRY, type FieldTypeName } from '@/core/form-schema/fieldTypes'

/**
 * Palette grouping for the Form Builder (Task 4.2.4).
 *
 * This is a purely presentational taxonomy: 14 semantically-clean category
 * names, each mapping to a list of `FIELD_TYPE_REGISTRY` keys. The palette
 * (`FieldPalette.tsx`) renders ONLY these category headers and the field
 * type's own label — the underlying renderer primitive name from
 * `fieldTypes.ts` (e.g. `TextInputRenderer`) is an internal dispatch detail
 * and never shown to the admin.
 *
 * Every one of the 89 keys in `FIELD_TYPE_REGISTRY` must appear in exactly
 * one category below — verified against the registry by the dev-time
 * assertion at the bottom of this file (throws on module load if the two
 * ever drift apart, e.g. a future field type added to the registry without
 * a palette category).
 */
export interface FieldCategory {
  name: string
  types: FieldTypeName[]
}

export const FIELD_CATEGORIES: FieldCategory[] = [
  {
    name: 'Text',
    types: ['text', 'slug', 'masked', 'postcode', 'password', 'hidden', 'textarea', 'rich_text', 'paragraph_block'],
  },
  {
    name: 'Numeric',
    types: ['number', 'currency', 'percentage'],
  },
  {
    name: 'Contact',
    types: ['email', 'phone', 'url'],
  },
  {
    name: 'Date & Time',
    types: ['date', 'time', 'datetime', 'date_range', 'month_year', 'duration'],
  },
  {
    name: 'Single Selection',
    types: ['select', 'radio_group', 'segmented', 'button_group', 'combobox', 'switch', 'yes_no'],
  },
  {
    name: 'Multiple Selection',
    types: ['checkbox', 'checkbox_group', 'multi_select', 'tags_input'],
  },
  {
    name: 'Range & Rating',
    types: ['number_stepper', 'slider', 'range_slider', 'rating'],
  },
  {
    name: 'Files & Media',
    types: [
      'file_upload_single',
      'file_upload_multi',
      'image_upload',
      'dropzone',
      'media_library_picker',
      'signature',
      'camera_capture',
    ],
  },
  {
    name: 'Composite & Location',
    types: ['full_name', 'address', 'country_select', 'state_select', 'map_picker', 'address_autocomplete', 'geolocation'],
  },
  {
    name: 'Advanced & Logic',
    types: ['repeater', 'matrix', 'conditional_group', 'computed', 'lookup', 'image_choice_single', 'image_choice_multi'],
  },
  {
    name: 'Consent & Verification',
    types: ['consent_checkbox', 'terms_acceptance', 'captcha'],
  },
  {
    name: 'Layout & Structure',
    types: [
      'step',
      'page',
      'section',
      'fieldset',
      'group',
      'grid',
      'row',
      'column',
      'card_section',
      'accordion_section',
      'tabs_section',
      'divider',
      'spacer',
      'heading_block',
      'media_block',
      'html_embed',
    ],
  },
  {
    name: 'Navigation',
    types: ['stepper', 'progress_bar', 'breadcrumbs', 'next_button', 'back_button', 'submit_button', 'save_and_continue'],
  },
  {
    name: 'System (Hidden)',
    types: ['hidden_field', 'utm_source', 'referrer', 'submitted_at', 'honeypot', 'submission_id'],
  },
]

/** Title-cases a `field_type_name` into a human label, e.g. `consent_checkbox` -> `Consent Checkbox`. */
export function fieldTypeLabel(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ---- Dev-time integrity check: every registry key categorized exactly once ----
function assertCategoriesCoverRegistry() {
  const registryKeys = Object.keys(FIELD_TYPE_REGISTRY)
  const seen = new Map<string, number>()

  for (const category of FIELD_CATEGORIES) {
    for (const type of category.types) {
      seen.set(type, (seen.get(type) ?? 0) + 1)
    }
  }

  const missing = registryKeys.filter((key) => !seen.has(key))
  const duplicated = [...seen.entries()].filter(([, count]) => count > 1).map(([key]) => key)
  const unknown = [...seen.keys()].filter((key) => !(key in FIELD_TYPE_REGISTRY))

  if (missing.length > 0 || duplicated.length > 0 || unknown.length > 0) {
    throw new Error(
      `FIELD_CATEGORIES drifted from FIELD_TYPE_REGISTRY — missing: [${missing.join(', ')}], duplicated: [${duplicated.join(', ')}], unknown: [${unknown.join(', ')}]`,
    )
  }
}

assertCategoriesCoverRegistry()
