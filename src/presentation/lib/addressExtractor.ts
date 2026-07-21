/**
 * Helper to extract a project/location address from form_data submission payloads.
 * Looks for exact address keys or inspects submission object keys for address-related data.
 */
export function extractAddressFromFormData(formData: Record<string, unknown> | null | undefined): string | null {
  if (!formData || typeof formData !== 'object') {
    return null
  }

  // Preferred exact keys
  const preferredKeys = [
    'address_autocomplete',
    'address',
    'location',
    'project_address',
    'site_address',
    'street_address',
  ]

  for (const key of preferredKeys) {
    const val = formData[key]
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim()
    }
  }

  // Fallback: search all key-values for any key containing "address" or "location"
  for (const [key, val] of Object.entries(formData)) {
    const lowerKey = key.toLowerCase()
    if ((lowerKey.includes('address') || lowerKey.includes('location')) && typeof val === 'string' && val.trim().length > 0) {
      return val.trim()
    }
  }

  return null
}
