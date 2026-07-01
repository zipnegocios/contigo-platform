'use client'

import { Lock, Trash2, X } from 'lucide-react'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import type { FormField } from '@/core/form-schema/FormSchema'
import { fieldTypeLabel } from './fieldCategories'

interface FieldConfigPanelProps {
  field: FormField
  onChange: (updated: FormField) => void
  onDelete: () => void
  onClose: () => void
}

/**
 * Per-field configuration form (Task 4.2.4). Edits every `FormField`
 * property the brief calls out: label/placeholder/helpText/required/
 * defaultValue/validation/options/colSpan/visibilityConditions/
 * mapsToSystemField.
 *
 * Locked-field protections (the seeded "Request a Quote" fields, all
 * `locked: true`):
 *  - `locked && required` -> the required toggle is disabled outright. The
 *    brief's rule is "cannot UNCHECK required" for a locked+required field;
 *    since the checkbox is already checked in that state and there's
 *    nothing else useful to do with it, disabling it entirely satisfies the
 *    rule (no code path can ever flip it off).
 *  - `locked` alone (regardless of `required`) -> delete is always
 *    disabled/hidden. A locked field can never be removed, full stop.
 */
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

  return (
    <aside
      className="flex-shrink-0 rounded-2xl p-4 overflow-y-auto space-y-4"
      style={{
        width: 320,
        backgroundColor: 'rgba(226,192,99,0.03)',
        border: '1px solid rgba(226,192,99,0.1)',
        maxHeight: 'calc(100vh - 220px)',
      }}
    >
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

      {/* Label */}
      <div className="space-y-1.5">
        <Label htmlFor="field-label" className="text-fluid-xs">
          Label
        </Label>
        <Input
          id="field-label"
          value={field.label}
          onChange={(e) => patch({ label: e.target.value })}
        />
      </div>

      {/* Placeholder */}
      <div className="space-y-1.5">
        <Label htmlFor="field-placeholder" className="text-fluid-xs">
          Placeholder
        </Label>
        <Input
          id="field-placeholder"
          value={field.placeholder ?? ''}
          onChange={(e) => patch({ placeholder: e.target.value || undefined })}
        />
      </div>

      {/* Help text */}
      <div className="space-y-1.5">
        <Label htmlFor="field-help" className="text-fluid-xs">
          Help text
        </Label>
        <Textarea
          id="field-help"
          value={field.helpText ?? ''}
          onChange={(e) => patch({ helpText: e.target.value || undefined })}
          rows={2}
        />
      </div>

      {/* Default value */}
      <div className="space-y-1.5">
        <Label htmlFor="field-default" className="text-fluid-xs">
          Default value
        </Label>
        <Input
          id="field-default"
          value={typeof field.defaultValue === 'string' ? field.defaultValue : ''}
          onChange={(e) => patch({ defaultValue: e.target.value || undefined })}
        />
      </div>

      {/* Required */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="field-required"
          checked={field.required}
          disabled={requiredToggleDisabled}
          onCheckedChange={(checked) => patch({ required: checked === true })}
        />
        <Label htmlFor="field-required" className="text-fluid-xs">
          Required
        </Label>
        {requiredToggleDisabled && (
          <span className="text-[10px]" style={{ color: 'var(--neutral-600)' }}>
            locked — always required
          </span>
        )}
      </div>

      {/* Options (choice-type fields) */}
      <div className="space-y-1.5">
        <Label htmlFor="field-options" className="text-fluid-xs">
          Options (one per line)
        </Label>
        <Textarea
          id="field-options"
          value={optionsText}
          onChange={(e) => handleOptionsChange(e.target.value)}
          rows={4}
          placeholder={'Option A\nOption B'}
        />
      </div>

      {/* Validation */}
      <div className="space-y-2">
        <p className="text-fluid-xs font-medium" style={{ color: 'var(--neutral-800)' }}>
          Validation
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="field-minlength" className="text-[10px]">
              Min length
            </Label>
            <Input
              id="field-minlength"
              type="number"
              value={field.validation?.minLength ?? ''}
              onChange={(e) =>
                patchValidation({ minLength: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="field-maxlength" className="text-[10px]">
              Max length
            </Label>
            <Input
              id="field-maxlength"
              type="number"
              value={field.validation?.maxLength ?? ''}
              onChange={(e) =>
                patchValidation({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="field-min" className="text-[10px]">
              Min value
            </Label>
            <Input
              id="field-min"
              type="number"
              value={field.validation?.min ?? ''}
              onChange={(e) => patchValidation({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="field-max" className="text-[10px]">
              Max value
            </Label>
            <Input
              id="field-max"
              type="number"
              value={field.validation?.max ?? ''}
              onChange={(e) => patchValidation({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="field-pattern" className="text-[10px]">
            Pattern (regex)
          </Label>
          <Input
            id="field-pattern"
            value={field.validation?.pattern ?? ''}
            onChange={(e) => patchValidation({ pattern: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="field-message" className="text-[10px]">
            Custom error message
          </Label>
          <Input
            id="field-message"
            value={field.validation?.message ?? ''}
            onChange={(e) => patchValidation({ message: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-1.5">
        <Label htmlFor="field-colspan" className="text-fluid-xs">
          Column span (1–12)
        </Label>
        <Input
          id="field-colspan"
          type="number"
          min={1}
          max={12}
          value={field.colSpan ?? ''}
          onChange={(e) => patch({ colSpan: e.target.value === '' ? undefined : Number(e.target.value) })}
        />
      </div>

      {/* Maps to system field */}
      <div className="space-y-1.5">
        <Label htmlFor="field-maps-to" className="text-fluid-xs">
          Maps to system field
        </Label>
        <Input
          id="field-maps-to"
          value={field.mapsToSystemField ?? ''}
          onChange={(e) => patch({ mapsToSystemField: e.target.value || undefined })}
          disabled={field.locked === true}
          placeholder="e.g. name, email, phone"
        />
      </div>

      {/* Visibility conditions — raw JSON editor, no bespoke condition builder UI yet */}
      <div className="space-y-1.5">
        <Label htmlFor="field-visibility" className="text-fluid-xs">
          Visibility conditions (JSON)
        </Label>
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
              // rather than silently corrupting the schema.
            }
          }}
        />
      </div>

      {/* Delete */}
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
