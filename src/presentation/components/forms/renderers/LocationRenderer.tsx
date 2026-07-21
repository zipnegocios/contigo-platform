'use client'

import { useEffect, useRef } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import type { FieldComponentProps } from '../types'

const LIBRARIES: any = ['places']

/**
 * LocationRenderer component that implements the `address_autocomplete` field type
 * using Google Places Autocomplete. Fallback remains for unsupported location types
 * (`map_picker` and `geolocation`).
 */
export function LocationRenderer({ field, register, error, setValue }: FieldComponentProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteInstanceRef = useRef<any>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  })

  useEffect(() => {
    if (!isLoaded || loadError || !inputRef.current) return

    const google = (window as any).google
    if (!google || !google.maps || !google.maps.places) return

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current)
    autocompleteInstanceRef.current = autocomplete

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place && place.formatted_address && setValue) {
        setValue(field.id, place.formatted_address, { shouldValidate: true })
      }
    })

    return () => {
      if (listener && google.maps.event) {
        google.maps.event.removeListener(listener)
      }
    }
  }, [isLoaded, loadError, field.id, setValue])

  if (field.type === 'address_autocomplete') {
    const { ref, ...rest } = register(field.id)

    return (
      <div className="flex flex-col gap-1">
        {field.label && (
          <label htmlFor={field.id} className="text-sm font-medium text-gray-700">
            {field.label}
          </label>
        )}
        <input
          id={field.id}
          type="text"
          placeholder={field.placeholder || 'Enter your address'}
          aria-invalid={!!error}
          disabled={!isLoaded || !!loadError}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
          {...rest}
          ref={(el) => {
            ref(el)
            inputRef.current = el
          }}
        />
        {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
        {error && <p role="alert" className="text-xs text-red-600 mt-1">{error.message}</p>}
      </div>
    )
  }

  return <div>Unsupported field type: {field.type}</div>
}
