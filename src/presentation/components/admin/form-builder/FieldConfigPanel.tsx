'use client'

import { Lock, Trash2, X } from 'lucide-react'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import type { FormField } from '@/core/form-schema/FormSchema'
import { fieldTypeLabel } from './fieldCategories'
import { FIELD_TYPE_REGISTRY } from '@/core/form-schema/fieldTypes'

interface FieldConfigPanelProps {
  field: FormField
  onChange: (updated: FormField) => void
  onDelete: () => void
  onClose: () => void
}

const CURRENCY_OPTIONS = [
  { code: 'AUD', label: 'AUD — Australian Dollar ($)' },
  { code: 'USD', label: 'USD — US Dollar ($)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
  { code: 'GBP', label: 'GBP — British Pound (£)' },
  { code: 'NZD', label: 'NZD — New Zealand Dollar ($)' },
  { code: 'CAD', label: 'CAD — Canadian Dollar ($)' },
  { code: 'JPY', label: 'JPY — Japanese Yen (¥)' },
  { code: 'CHF', label: 'CHF — Swiss Franc (Fr)' },
  { code: 'SGD', label: 'SGD — Singapore Dollar ($)' },
  { code: 'HKD', label: 'HKD — Hong Kong Dollar ($)' },
] as const

export function FieldConfigPanel({ field, onChange, onDelete, onClose }: FieldConfigPanelProps) {
  const requiredToggleDisabled = field.locked === true && field.required === true
  const deleteDisabled = field.locked === true

  function patch(partial: Partial<FormField>) {
    onChange({ ...field, ...partial })
  }

  function patchValidation(partial: Partial<FormField['validation']>) {
    onChange({ ...field, validation: { ...field.validation, ...partial } })
  }

  const optionsText = (field.options ?? []).join('\n')

  function handleOptionsChange(text: string) {
    const options = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    patch({ options: options.length > 0 ? options : undefined })
  }

  // Renderer-derived flags
  const descriptor       = FIELD_TYPE_REGISTRY[field.type]
  const renderer         = descriptor?.renderer
  const isChoiceRenderer = renderer === 'ChoiceRenderer'
  const isTextInput      = renderer === 'TextInputRenderer'
  const isTextarea       = renderer === 'TextareaRenderer'
  const isRange          = renderer === 'RangeRenderer'
  const isFile           = renderer === 'FileRenderer'
  const isLayoutRenderer = renderer === 'LayoutRenderer'
  const isNavRenderer    = renderer === 'NavRenderer'
  const isSystemRenderer = renderer === 'SystemFieldRenderer'
  const isNonInteractive = isLayoutRenderer || isNavRenderer || isSystemRenderer
  const isCurrency       = field.type === 'currency'
  const isRating         = field.type === 'rating'
  const isParagraphBlock = field.type === 'paragraph_block'
  const isHeadingBlock   = field.type === 'heading_block'
  const isHtmlEmbed      = field.type === 'html_embed'
  const isStepMarker     = field.type === 'step'
  const isContentBlock   = isParagraphBlock || isHeadingBlock || isHtmlEmbed
  const showPlaceholder  = !isNonInteractive && !isContentBlock && !isChoiceRenderer
  const showRequired     = !isNonInteractive
  const showValidation   = isTextInput || isTextarea
  const showOptions      = isChoiceRenderer
  const showSystemMapping = descriptor?.isDataField === true
  const showVisibility   = descriptor?.isDataField === true

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.4rem 0.6rem',
    borderRadius: 6,
    border: '1px solid rgba(226,192,99,0.2)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--neutral-800)',
    fontSize: '0.875rem',
  }

  return (
    <aside
      className="flex-shrink-0 rounded-2xl p-4 overflow-y-auto space-y-4"
      style={{
        width: 'var(--field-config-width, 320px)',
        backgroundColor: 'rgba(226,192,99,0.03)',
        border: '1px solid rgba(226,192,99,0.1)',
        maxHeight: 'var(--field-config-max-height, calc(100vh - 220px))',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-sm font-semibold" style={{ color: 'var(--neutral-800)' }}>
            {fieldTypeLabel(field.type)}
          </p>
          {field.locked && (
            <span
              className="inline-flex items-center gap-1 text-[10px] mt-1 px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(82,183,136,0.15)', color: '#52B788' }}
            >
              <Lock className="w-[clamp(0.6rem,1.2vw,0.7rem)] h-[clamp(0.6rem,1.2vw,0.7rem)]" />
              locked
            </span>
          )}
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded" style={{ color: 'var(--neutral-600)' }}>
          <X className="w-[clamp(0.875rem,1.75vw,1rem)] h-[clamp(0.875rem,1.75vw,1rem)]" />
        </button>
      </div>

      {/* Locked-field explanation banner */}
      {field.locked && (
        <div
          style={{
            background: 'rgba(226,192,99,0.08)',
            border: '1px solid rgba(226,192,99,0.25)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            fontSize: '0.75rem',
            color: '#6B6560',
          }}
        >
          <strong style={{ color: '#2D2924', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <Lock style={{ width: 12, height: 12 }} />
            System field
          </strong>
          {field.mapsToSystemField && (
            <p style={{ marginBottom: 4 }}>
              Maps to <code style={{ color: '#E2C063', background: 'rgba(226,192,99,0.12)', padding: '1px 4px', borderRadius: 3 }}>{field.mapsToSystemField}</code> in the quote record.
            </p>
          )}
          <p>
            <strong style={{ color: '#2D2924' }}>Editable:</strong> label, placeholder, help text.
            <br />
            <strong style={{ color: '#2D2924' }}>Locked:</strong> required status, field type, delete.
          </p>
        </div>
      )}

      {/* 1. Label */}
      {!isSystemRenderer && (
        <div className="space-y-1.5">
          <Label htmlFor="field-label" className="text-fluid-xs">Label</Label>
          <Input id="field-label" value={field.label} onChange={(e) => patch({ label: e.target.value })} />
        </div>
      )}

      {/* 2. Content editor — paragraph_block, heading_block, html_embed */}
      {isContentBlock && (
        <div className="space-y-1.5">
          <Label htmlFor="field-content" className="text-fluid-xs">
            {isHtmlEmbed ? 'HTML content' : 'Block content'}
          </Label>
          <Textarea
            id="field-content"
            value={field.content ?? ''}
            onChange={(e) => patch({ content: e.target.value || undefined })}
            rows={isHtmlEmbed ? 5 : 3}
            placeholder={
              isHtmlEmbed
                ? '<p>Your HTML here…</p>'
                : isParagraphBlock
                ? 'Enter the text shown to the user…'
                : 'Heading text…'
            }
          />
        </div>
      )}

      {/* 3. Heading level */}
      {isHeadingBlock && (
        <div className="space-y-1.5">
          <Label htmlFor="field-heading-level" className="text-fluid-xs">Heading level</Label>
          <select
            id="field-heading-level"
            value={field.headingLevel ?? 2}
            onChange={(e) => patch({ headingLevel: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 })}
            style={selectStyle}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>H{n}</option>
            ))}
          </select>
        </div>
      )}

      {/* 4. Step title/description */}
      {isStepMarker && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="field-step-title" className="text-fluid-xs">Step title</Label>
            <Input
              id="field-step-title"
              value={field.stepTitle ?? ''}
              onChange={(e) => patch({ stepTitle: e.target.value || undefined })}
              placeholder="Step 1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="field-step-desc" className="text-fluid-xs">Step description</Label>
            <Textarea
              id="field-step-desc"
              value={field.stepDescription ?? ''}
              onChange={(e) => patch({ stepDescription: e.target.value || undefined })}
              rows={2}
              placeholder="Describe this step…"
            />
          </div>
        </>
      )}

      {/* 5. Placeholder */}
      {showPlaceholder && (
        <div className="space-y-1.5">
          <Label htmlFor="field-placeholder" className="text-fluid-xs">Placeholder</Label>
          <Input
            id="field-placeholder"
            value={field.placeholder ?? ''}
            onChange={(e) => patch({ placeholder: e.target.value || undefined })}
          />
        </div>
      )}

      {/* 6. Help text */}
      {!isNonInteractive && (
        <div className="space-y-1.5">
          <Label htmlFor="field-help" className="text-fluid-xs">Help text</Label>
          <Textarea
            id="field-help"
            value={field.helpText ?? ''}
            onChange={(e) => patch({ helpText: e.target.value || undefined })}
            rows={2}
          />
        </div>
      )}

      {/* 7. Currency code */}
      {isCurrency && (
        <div className="space-y-1.5">
          <Label htmlFor="field-currency" className="text-fluid-xs">Currency</Label>
          <select
            id="field-currency"
            value={field.currencyCode ?? 'AUD'}
            onChange={(e) => patch({ currencyCode: e.target.value })}
            style={selectStyle}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* 8. Options — ChoiceRenderer only */}
      {showOptions && (
        <div className="space-y-1.5">
          <Label htmlFor="field-options" className="text-fluid-xs">Options (one per line)</Label>
          <Textarea
            id="field-options"
            value={optionsText}
            onChange={(e) => handleOptionsChange(e.target.value)}
            rows={5}
            placeholder={'Option A\nOption B\nOption C'}
          />
        </div>
      )}

      {/* 9. Range config (slider, range_slider, number_stepper — not rating) */}
      {isRange && !isRating && (
        <div className="space-y-2">
          <p className="text-fluid-xs font-medium" style={{ color: 'var(--neutral-800)' }}>Range</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="field-range-min" className="text-[10px]">Min</Label>
              <Input
                id="field-range-min"
                type="number"
                value={field.validation?.min ?? ''}
                onChange={(e) => patchValidation({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="field-range-max" className="text-[10px]">Max</Label>
              <Input
                id="field-range-max"
                type="number"
                value={field.validation?.max ?? ''}
                onChange={(e) => patchValidation({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="field-step" className="text-[10px]">Step</Label>
              <Input
                id="field-step"
                type="number"
                value={field.step ?? ''}
                onChange={(e) => patch({ step: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      )}

      {/* 10. Rating config */}
      {isRating && (
        <div className="space-y-2">
          <p className="text-fluid-xs font-medium" style={{ color: 'var(--neutral-800)' }}>Rating</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="field-max-rating" className="text-[10px]">Max stars</Label>
              <Input
                id="field-max-rating"
                type="number"
                min={2}
                max={10}
                value={field.maxRating ?? 5}
                onChange={(e) => patch({ maxRating: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="field-rating-style" className="text-[10px]">Style</Label>
              <select
                id="field-rating-style"
                value={field.ratingStyle ?? 'star'}
                onChange={(e) => patch({ ratingStyle: e.target.value as 'star' | 'heart' | 'number' })}
                style={{ ...selectStyle, fontSize: '0.8rem' }}
              >
                <option value="star">⭐ Stars</option>
                <option value="heart">❤️ Hearts</option>
                <option value="number">🔢 Numbers</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 11. File constraints */}
      {isFile && (
        <div className="space-y-2">
          <p className="text-fluid-xs font-medium" style={{ color: 'var(--neutral-800)' }}>File constraints</p>
          <div className="space-y-1.5">
            <Label htmlFor="field-accept" className="text-[10px]">Accepted types (comma-separated)</Label>
            <Input
              id="field-accept"
              value={(field.acceptedFileTypes ?? []).join(', ')}
              onChange={(e) => {
                const types = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                patch({ acceptedFileTypes: types.length > 0 ? types : undefined })
              }}
              placeholder="image/*, application/pdf"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="field-max-size" className="text-[10px]">Max size (MB)</Label>
              <Input
                id="field-max-size"
                type="number"
                min={0}
                value={field.maxFileSize ?? ''}
                onChange={(e) => patch({ maxFileSize: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            {['file_upload_multi', 'dropzone'].includes(field.type) && (
              <div className="space-y-1">
                <Label htmlFor="field-max-files" className="text-[10px]">Max files</Label>
                <Input
                  id="field-max-files"
                  type="number"
                  min={1}
                  value={field.maxFiles ?? ''}
                  onChange={(e) => patch({ maxFiles: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 12. Validation — type-aware */}
      {showValidation && (
        <div className="space-y-2">
          <p className="text-fluid-xs font-medium" style={{ color: 'var(--neutral-800)' }}>Validation</p>
          {isTextInput && !isCurrency && field.type !== 'number' && field.type !== 'percentage' ? (
            // String validations
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="field-minlength" className="text-[10px]">Min length</Label>
                <Input
                  id="field-minlength"
                  type="number"
                  value={field.validation?.minLength ?? ''}
                  onChange={(e) => patchValidation({ minLength: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="field-maxlength" className="text-[10px]">Max length</Label>
                <Input
                  id="field-maxlength"
                  type="number"
                  value={field.validation?.maxLength ?? ''}
                  onChange={(e) => patchValidation({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="field-pattern" className="text-[10px]">Pattern (regex)</Label>
                <Input
                  id="field-pattern"
                  value={field.validation?.pattern ?? ''}
                  onChange={(e) => patchValidation({ pattern: e.target.value || undefined })}
                />
              </div>
            </div>
          ) : isTextInput ? (
            // Numeric validations (currency, number, percentage)
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="field-min" className="text-[10px]">Min value</Label>
                <Input
                  id="field-min"
                  type="number"
                  value={field.validation?.min ?? ''}
                  onChange={(e) => patchValidation({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="field-max" className="text-[10px]">Max value</Label>
                <Input
                  id="field-max"
                  type="number"
                  value={field.validation?.max ?? ''}
                  onChange={(e) => patchValidation({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>
          ) : (
            // Textarea validations
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="field-minlength" className="text-[10px]">Min length</Label>
                <Input
                  id="field-minlength"
                  type="number"
                  value={field.validation?.minLength ?? ''}
                  onChange={(e) => patchValidation({ minLength: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="field-maxlength" className="text-[10px]">Max length</Label>
                <Input
                  id="field-maxlength"
                  type="number"
                  value={field.validation?.maxLength ?? ''}
                  onChange={(e) => patchValidation({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="field-message" className="text-[10px]">Custom error message</Label>
            <Input
              id="field-message"
              value={field.validation?.message ?? ''}
              onChange={(e) => patchValidation({ message: e.target.value || undefined })}
            />
          </div>
        </div>
      )}

      {/* 13. Required toggle */}
      {showRequired && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="field-required"
            checked={field.required}
            disabled={requiredToggleDisabled}
            onCheckedChange={(checked) => patch({ required: checked === true })}
          />
          <Label htmlFor="field-required" className="text-fluid-xs">Required</Label>
          {requiredToggleDisabled && (
            <span className="text-[10px]" style={{ color: 'var(--neutral-600)' }}>
              locked — always required
            </span>
          )}
        </div>
      )}

      {/* 14. Default value */}
      {(isTextInput || isTextarea) && !isContentBlock && (
        <div className="space-y-1.5">
          <Label htmlFor="field-default" className="text-fluid-xs">Default value</Label>
          <Input
            id="field-default"
            value={typeof field.defaultValue === 'string' ? field.defaultValue : ''}
            onChange={(e) => patch({ defaultValue: e.target.value || undefined })}
          />
        </div>
      )}

      {/* 15. Column span */}
      <div className="space-y-1.5">
        <Label htmlFor="field-colspan" className="text-fluid-xs">Column span (1–12)</Label>
        <Input
          id="field-colspan"
          type="number"
          min={1}
          max={12}
          value={field.colSpan ?? ''}
          onChange={(e) => patch({ colSpan: e.target.value === '' ? undefined : Number(e.target.value) })}
        />
      </div>

      {/* 16. System field mapping */}
      {showSystemMapping && (
        <div className="space-y-1.5">
          <Label htmlFor="field-maps-to" className="text-fluid-xs">Maps to system field</Label>
          <Input
            id="field-maps-to"
            value={field.mapsToSystemField ?? ''}
            onChange={(e) => patch({ mapsToSystemField: e.target.value || undefined })}
            disabled={field.locked === true}
            placeholder="e.g. name, email, phone"
          />
        </div>
      )}

      {/* 17. Visibility conditions */}
      {showVisibility && (
        <div className="space-y-1.5">
          <Label htmlFor="field-visibility" className="text-fluid-xs">Visibility conditions (JSON)</Label>
          <Textarea
            id="field-visibility"
            rows={3}
            defaultValue={field.visibilityConditions ? JSON.stringify(field.visibilityConditions, null, 2) : ''}
            placeholder="null = always visible"
            onBlur={(e) => {
              const raw = e.target.value.trim()
              if (!raw) {
                patch({ visibilityConditions: undefined })
                return
              }
              try {
                patch({ visibilityConditions: JSON.parse(raw) })
              } catch {
                // Invalid JSON — leave the field's stored value untouched
              }
            }}
          />
        </div>
      )}

      {/* 18. Delete */}
      <div className="pt-2" style={{ borderTop: '1px solid rgba(226,192,99,0.1)' }}>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleteDisabled}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-fluid-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: deleteDisabled ? 'rgba(107,101,96,0.08)' : 'rgba(232,112,112,0.1)',
            color: deleteDisabled ? 'var(--neutral-600)' : '#e87070',
          }}
          title={deleteDisabled ? 'Locked fields cannot be deleted' : 'Delete field'}
        >
          <Trash2 className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
          {deleteDisabled ? 'Locked — cannot delete' : 'Delete field'}
        </button>
      </div>
    </aside>
  )
}
