import type { FormField, FormSchema } from '@/core/form-schema/FormSchema'

/**
 * Robust address extractor for Form Builder submission payloads.
 * Implements Defense 1 (Schema Matching) and Defense 2 (Strict Phone & Non-Address Exclusion).
 */
export function extractAddressFromFormData(
  formData: Record<string, unknown> | null | undefined,
  schemaOrFields?: FormSchema | FormField[] | null
): string | null {
  if (!formData || typeof formData !== 'object') {
    return null
  }

  // Defensa 1: Schema / Field Matching (Más seguro)
  if (schemaOrFields) {
    let fields: FormField[] = []
    if ('steps' in schemaOrFields && Array.isArray(schemaOrFields.steps)) {
      fields = schemaOrFields.steps.flatMap((step) => step.fields)
    } else if (Array.isArray(schemaOrFields)) {
      fields = schemaOrFields
    }

    for (const field of fields) {
      if (['address_autocomplete', 'address', 'map_picker', 'geolocation'].includes(field.type)) {
        const val = formData[field.id]
        if (typeof val === 'string' && isValidAddressString(val)) {
          return val.trim()
        }
      }
    }
  }

  // Defensa 1.2: Llaves semánticas conocidas
  const semanticKeys = [
    'address_autocomplete',
    'address',
    'location',
    'project_address',
    'site_address',
    'street_address',
    'direccion',
    'ubicacion',
  ]

  for (const key of semanticKeys) {
    const val = formData[key]
    if (typeof val === 'string' && isValidAddressString(val)) {
      return val.trim()
    }
    if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      const str = obj.formattedAddress || obj.formatted_address || obj.address
      if (typeof str === 'string' && isValidAddressString(str)) {
        return str.trim()
      }
    }
  }

  // Defensa 2: Iteración con heurística estricta (Excluyendo teléfonos y no-direcciones)
  for (const [key, val] of Object.entries(formData)) {
    if (typeof val === 'string') {
      if (isValidAddressString(val)) {
        return val.trim()
      }
    } else if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      const str = obj.formattedAddress || obj.formatted_address || obj.address
      if (typeof str === 'string' && isValidAddressString(str)) {
        return str.trim()
      }
    }
  }

  return null
}

/**
 * Strict Phone Number exclusion check.
 * Returns true if the string matches phone number formats or consists mostly of numbers/symbols.
 */
function isPhoneNumberString(str: string): boolean {
  const trimmed = str.trim()

  // Matches typical phone formats e.g. "(08) 8240 3056", "+61 412 345 678", "0412345678", "08-8240-3056"
  const phoneCharOnlyRegex = /^[\d\s+\-().]{6,25}$/
  if (phoneCharOnlyRegex.test(trimmed)) {
    return true
  }

  const letters = (trimmed.match(/[a-zA-Z]/g) || []).length
  const digits = (trimmed.match(/\d/g) || []).length

  // If mostly numbers and very few or no letters (e.g. <= 2 letters like 'ext')
  if (digits >= 6 && letters <= 2) {
    return true
  }

  return false
}

/**
 * Validates that a string is a real formatted street address.
 * Must contain letters, digits, must not be a phone number, and should match address indicators.
 */
function isValidAddressString(str: string): boolean {
  const trimmed = str.trim()
  if (trimmed.length < 6 || trimmed.length > 300) return false

  // DEFENSA 2: Excluir teléfonos obligatoriamente
  if (isPhoneNumberString(trimmed)) {
    return false
  }

  // Debe contener al menos 3 letras (A-Z)
  const hasLetters = /[a-zA-Z]{3,}/.test(trimmed)
  if (!hasLetters) return false

  // Debe contener números (número de calle, casa o código postal)
  const hasDigits = /\d/.test(trimmed)
  if (!hasDigits) return false

  // Indicadores de tipo de calle
  const streetTypes = /\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|court|ct|way|place|pl|highway|hwy|parade|pde|circuit|cct|close|cl|crescent|cres|terrace|tce|esplanade|esp|calle|carrera|av|avenida)\b/i

  // Indicadores de región / estado / país
  const regionTypes = /\b(australia|sa|nsw|vic|qld|wa|tas|act|nt|adelaide|sydney|melbourne|brisbane|perth|canberra|hobart|darwin|usa|uk)\b/i

  // Código postal (4 dígitos)
  const postcodePattern = /\b\d{4}\b/

  // Si tiene formato de Google Places (contiene comas + tipo de calle o región)
  const hasComma = trimmed.includes(',')

  if (streetTypes.test(trimmed) || regionTypes.test(trimmed) || postcodePattern.test(trimmed) || hasComma) {
    return true
  }

  return false
}
