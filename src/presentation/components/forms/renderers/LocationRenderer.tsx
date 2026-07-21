'use client'

import { useEffect, useRef } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import type { FieldComponentProps } from '../types'

const LIBRARIES: any = ['places']

/**
 * LocationRenderer component that implements the `address_autocomplete` field type
 * using Google's new PlaceAutocompleteElement Web Component. Fallback remains for
 * unsupported location types (`map_picker` and `geolocation`).
 */
export function LocationRenderer({ field, register, error, setValue }: FieldComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  })

  useEffect(() => {
    if (!isLoaded || loadError || !containerRef.current) return

    const google = (window as any).google
    if (!google || !google.maps || !google.maps.places || !google.maps.places.PlaceAutocompleteElement) {
      console.warn('PlaceAutocompleteElement is not available on google.maps.places')
      return
    }

    // Clear any existing children to prevent duplicates on re-render
    containerRef.current.innerHTML = ''

    const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement()
    // Make sure the element expands to full width of the parent container
    placeAutocomplete.style.width = '100%'

    const handlePlaceSelect = async (event: any) => {
      const place = event.place
      if (!place) return

      let addressString = place.formattedAddress
      if (!addressString) {
        try {
          await place.fetchFields({ fields: ['formattedAddress'] })
          addressString = place.formattedAddress
        } catch (e) {
          console.error('Error fetching formattedAddress:', e)
        }
      }

      if (addressString) {
        // Update primary field.id
        setValue?.(field.id, addressString, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        })
        // Also update mapsToSystemField if defined (e.g. 'address')
        if (field.mapsToSystemField && field.mapsToSystemField !== field.id) {
          setValue?.(field.mapsToSystemField, addressString, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          })
        }
      }
    }

    placeAutocomplete.addEventListener('gmp-placeselect', handlePlaceSelect)
    containerRef.current.appendChild(placeAutocomplete)

    return () => {
      if (placeAutocomplete) {
        placeAutocomplete.removeEventListener('gmp-placeselect', handlePlaceSelect)
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [isLoaded, loadError, field.id, setValue])

  if (field.type === 'address_autocomplete') {
    return (
      <div className="flex flex-col gap-1 w-full">
        {field.label && (
          <label htmlFor={field.id} className="text-sm font-medium text-gray-700">
            {field.label}
          </label>
        )}
        
        <div className="w-full flex" style={{ minHeight: '38px' }}>
          {(!isLoaded || loadError) && (
            <input
              type="text"
              placeholder={loadError ? 'Error loading address search' : 'Loading address search...'}
              disabled
              className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 cursor-not-allowed ${
                loadError ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-400'
              }`}
            />
          )}
          <div
            ref={containerRef}
            className={`w-full ${(!isLoaded || loadError) ? 'hidden' : 'block'}`}
          />
        </div>

        <input type="hidden" {...register(field.id)} />
        {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
        {error && <p role="alert" className="text-xs text-red-600 mt-1">{error.message}</p>}
      </div>
    )
  }

  return <div>Unsupported field type: {field.type}</div>
}
