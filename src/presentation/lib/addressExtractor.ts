/**
 * Robust address extractor for Form Builder submission payloads.
 * Can extract addresses by:
 * 1. Inspecting schema fields (if fields/schema available in context)
 * 2. Inspecting semantic keys (address, address_autocomplete, location, etc.)
 * 3. Inspecting all values in formData using regex & address detection heuristics
 */
export function extractAddressFromFormData(
  formData: Record<string, unknown> | null | undefined,
  fields?: Array<{ id: string; type: string }> | null
): string | null {
  if (!formData || typeof formData !== 'object') {
    return null
  }

  // 1. If fields schema array is provided, look for field.type === 'address_autocomplete' or 'address'
  if (fields && Array.isArray(fields)) {
    for (const field of fields) {
      if (['address_autocomplete', 'address', 'map_picker', 'geolocation'].includes(field.type)) {
        const val = formData[field.id]
        if (typeof val === 'string' && val.trim().length > 0) {
          return val.trim()
        }
      }
    }
  }

  // 2. Check semantic keys
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
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim()
    }
    if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      const str = obj.formattedAddress || obj.formatted_address || obj.address
      if (typeof str === 'string' && str.trim().length > 0) {
        return str.trim()
      }
    }
  }

  // 3. Iterate through all values in formData using heuristics
  for (const [key, val] of Object.entries(formData)) {
    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (isAddressLikeString(trimmed)) {
        return trimmed
      }
    } else if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      const str = obj.formattedAddress || obj.formatted_address || obj.address
      if (typeof str === 'string' && str.trim().length > 0) {
        return str.trim()
      }
    }
  }

  return null
}

/**
 * Heuristic regex & pattern matching to detect whether a string is a physical street address.
 */
function isAddressLikeString(str: string): boolean {
  if (str.length < 5 || str.length > 300) return false

  // Common street suffix terms (case-insensitive)
  const streetTypes = /\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|court|ct|way|place|pl|highway|hwy|parade|pde|circuit|cct|close|cl|crescent|cres|terrace|tce|esplanade|esp|calle|carrera|av|avenida)\b/i

  // Common region / country / state indicators
  const regionTypes = /\b(australia|sa|nsw|vic|qld|wa|tas|act|nt|adelaide|sydney|melbourne|brisbane|perth|canberra|hobart|darwin|usa|uk)\b/i

  // Postcode pattern e.g. 4-digit number like 5070
  const postcodePattern = /\b\d{4}\b/

  // Has at least one number (street number or house number)
  const hasDigit = /\d/.test(str)

  // Matches if it has digits AND (a street suffix OR a region term OR a postcode)
  if (hasDigit && (streetTypes.test(str) || regionTypes.test(str) || postcodePattern.test(str))) {
    return true
  }

  // Also check if string contains comma and digits and is >= 12 chars
  if (hasDigit && str.includes(',') && str.length >= 12 && streetTypes.test(str)) {
    return true
  }

  return false
}
