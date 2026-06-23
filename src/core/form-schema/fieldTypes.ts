/**
 * Field-type registry for the Form Builder (Task 4.2.2).
 *
 * This is the taxonomy's single source of truth: every field `type` string
 * that a `FormSchema` (see `FormSchema.ts`) can carry is listed here, mapped
 * to the renderer primitive that will draw/configure it (Task 4.2.3's
 * `<FormRenderer>` and Task 4.2.4's `<FormBuilder>` palette both consume this
 * registry — neither of those tasks is implemented yet, this file is pure
 * data) and whether it is a "data field" (collects an end-user value that
 * belongs in a submission payload) or not.
 *
 * `isDataField: false` is reserved for the three renderers that never
 * collect a value the way a normal field does:
 *  - `LayoutRenderer` — structural/decorative (sections, grids, dividers...)
 *  - `NavRenderer` — buttons/progress indicators, not form values
 *  - `SystemFieldRenderer` — auto-populated from request context (UTM,
 *    timestamps, honeypot...), never typed by the end user
 *
 * Every other renderer's types — including `ConsentRenderer` (a checkbox the
 * user must actively tick) — are `isDataField: true`.
 *
 * Source taxonomy: docs/superpowers/plans/2026-06-21-leads-crm-expansion.md,
 * Task 4.2.2 renderer-primitive table (13 primitives, 89 field types).
 */

export const RENDERER_PRIMITIVES = [
  'TextInputRenderer',
  'TextareaRenderer',
  'ChoiceRenderer',
  'DateTimeRenderer',
  'RangeRenderer',
  'FileRenderer',
  'CompositeRenderer',
  'LocationRenderer',
  'LayoutRenderer',
  'NavRenderer',
  'AdvancedRenderer',
  'ConsentRenderer',
  'SystemFieldRenderer',
] as const

export type RendererPrimitive = (typeof RENDERER_PRIMITIVES)[number]

export interface FieldTypeDescriptor {
  renderer: RendererPrimitive
  isDataField: boolean
}

export const FIELD_TYPE_REGISTRY: Record<string, FieldTypeDescriptor> = {
  // ---- TextInputRenderer (12) ----
  text: { renderer: 'TextInputRenderer', isDataField: true },
  email: { renderer: 'TextInputRenderer', isDataField: true },
  phone: { renderer: 'TextInputRenderer', isDataField: true },
  url: { renderer: 'TextInputRenderer', isDataField: true },
  password: { renderer: 'TextInputRenderer', isDataField: true },
  number: { renderer: 'TextInputRenderer', isDataField: true },
  currency: { renderer: 'TextInputRenderer', isDataField: true },
  slug: { renderer: 'TextInputRenderer', isDataField: true },
  masked: { renderer: 'TextInputRenderer', isDataField: true },
  hidden: { renderer: 'TextInputRenderer', isDataField: true },
  percentage: { renderer: 'TextInputRenderer', isDataField: true },
  postcode: { renderer: 'TextInputRenderer', isDataField: true },

  // ---- TextareaRenderer (3) ----
  textarea: { renderer: 'TextareaRenderer', isDataField: true },
  rich_text: { renderer: 'TextareaRenderer', isDataField: true },
  paragraph_block: { renderer: 'TextareaRenderer', isDataField: true },

  // ---- ChoiceRenderer (11) ----
  select: { renderer: 'ChoiceRenderer', isDataField: true },
  radio_group: { renderer: 'ChoiceRenderer', isDataField: true },
  segmented: { renderer: 'ChoiceRenderer', isDataField: true },
  button_group: { renderer: 'ChoiceRenderer', isDataField: true },
  combobox: { renderer: 'ChoiceRenderer', isDataField: true },
  switch: { renderer: 'ChoiceRenderer', isDataField: true },
  yes_no: { renderer: 'ChoiceRenderer', isDataField: true },
  checkbox: { renderer: 'ChoiceRenderer', isDataField: true },
  checkbox_group: { renderer: 'ChoiceRenderer', isDataField: true },
  multi_select: { renderer: 'ChoiceRenderer', isDataField: true },
  tags_input: { renderer: 'ChoiceRenderer', isDataField: true },

  // ---- DateTimeRenderer (6) ----
  date: { renderer: 'DateTimeRenderer', isDataField: true },
  time: { renderer: 'DateTimeRenderer', isDataField: true },
  datetime: { renderer: 'DateTimeRenderer', isDataField: true },
  date_range: { renderer: 'DateTimeRenderer', isDataField: true },
  month_year: { renderer: 'DateTimeRenderer', isDataField: true },
  duration: { renderer: 'DateTimeRenderer', isDataField: true },

  // ---- RangeRenderer (4) ----
  number_stepper: { renderer: 'RangeRenderer', isDataField: true },
  slider: { renderer: 'RangeRenderer', isDataField: true },
  range_slider: { renderer: 'RangeRenderer', isDataField: true },
  rating: { renderer: 'RangeRenderer', isDataField: true },

  // ---- FileRenderer (7) ----
  file_upload_single: { renderer: 'FileRenderer', isDataField: true },
  file_upload_multi: { renderer: 'FileRenderer', isDataField: true },
  image_upload: { renderer: 'FileRenderer', isDataField: true },
  dropzone: { renderer: 'FileRenderer', isDataField: true },
  media_library_picker: { renderer: 'FileRenderer', isDataField: true },
  signature: { renderer: 'FileRenderer', isDataField: true },
  camera_capture: { renderer: 'FileRenderer', isDataField: true },

  // ---- CompositeRenderer (4) ----
  full_name: { renderer: 'CompositeRenderer', isDataField: true },
  address: { renderer: 'CompositeRenderer', isDataField: true },
  country_select: { renderer: 'CompositeRenderer', isDataField: true },
  state_select: { renderer: 'CompositeRenderer', isDataField: true },

  // ---- LocationRenderer (3) ----
  map_picker: { renderer: 'LocationRenderer', isDataField: true },
  address_autocomplete: { renderer: 'LocationRenderer', isDataField: true },
  geolocation: { renderer: 'LocationRenderer', isDataField: true },

  // ---- LayoutRenderer (16, no input) ----
  step: { renderer: 'LayoutRenderer', isDataField: false },
  page: { renderer: 'LayoutRenderer', isDataField: false },
  section: { renderer: 'LayoutRenderer', isDataField: false },
  fieldset: { renderer: 'LayoutRenderer', isDataField: false },
  group: { renderer: 'LayoutRenderer', isDataField: false },
  grid: { renderer: 'LayoutRenderer', isDataField: false },
  row: { renderer: 'LayoutRenderer', isDataField: false },
  column: { renderer: 'LayoutRenderer', isDataField: false },
  card_section: { renderer: 'LayoutRenderer', isDataField: false },
  accordion_section: { renderer: 'LayoutRenderer', isDataField: false },
  tabs_section: { renderer: 'LayoutRenderer', isDataField: false },
  divider: { renderer: 'LayoutRenderer', isDataField: false },
  spacer: { renderer: 'LayoutRenderer', isDataField: false },
  heading_block: { renderer: 'LayoutRenderer', isDataField: false },
  media_block: { renderer: 'LayoutRenderer', isDataField: false },
  html_embed: { renderer: 'LayoutRenderer', isDataField: false },

  // ---- NavRenderer (7, no input) ----
  stepper: { renderer: 'NavRenderer', isDataField: false },
  progress_bar: { renderer: 'NavRenderer', isDataField: false },
  breadcrumbs: { renderer: 'NavRenderer', isDataField: false },
  next_button: { renderer: 'NavRenderer', isDataField: false },
  back_button: { renderer: 'NavRenderer', isDataField: false },
  submit_button: { renderer: 'NavRenderer', isDataField: false },
  save_and_continue: { renderer: 'NavRenderer', isDataField: false },

  // ---- AdvancedRenderer (7) ----
  repeater: { renderer: 'AdvancedRenderer', isDataField: true },
  matrix: { renderer: 'AdvancedRenderer', isDataField: true },
  conditional_group: { renderer: 'AdvancedRenderer', isDataField: true },
  computed: { renderer: 'AdvancedRenderer', isDataField: true },
  lookup: { renderer: 'AdvancedRenderer', isDataField: true },
  image_choice_single: { renderer: 'AdvancedRenderer', isDataField: true },
  image_choice_multi: { renderer: 'AdvancedRenderer', isDataField: true },

  // ---- ConsentRenderer (3) ----
  consent_checkbox: { renderer: 'ConsentRenderer', isDataField: true },
  terms_acceptance: { renderer: 'ConsentRenderer', isDataField: true },
  captcha: { renderer: 'ConsentRenderer', isDataField: true },

  // ---- SystemFieldRenderer (6, no input) ----
  hidden_field: { renderer: 'SystemFieldRenderer', isDataField: false },
  utm_source: { renderer: 'SystemFieldRenderer', isDataField: false },
  referrer: { renderer: 'SystemFieldRenderer', isDataField: false },
  submitted_at: { renderer: 'SystemFieldRenderer', isDataField: false },
  honeypot: { renderer: 'SystemFieldRenderer', isDataField: false },
  submission_id: { renderer: 'SystemFieldRenderer', isDataField: false },
}

export type FieldTypeName = keyof typeof FIELD_TYPE_REGISTRY
