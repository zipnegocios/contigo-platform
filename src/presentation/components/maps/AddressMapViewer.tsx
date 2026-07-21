'use client'

import { useState } from 'react'
import { MapPin, Copy, Check, ExternalLink, Navigation, Share2 } from 'lucide-react'

interface AddressMapViewerProps {
  address: string
  className?: string
  title?: string
}

export function AddressMapViewer({ address, className = '', title }: AddressMapViewerProps) {
  const [copied, setCopied] = useState(false)

  if (!address || !address.trim()) {
    return null
  }

  const encodedAddress = encodeURIComponent(address.trim())
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  
  // Use official Embed API if key available, fallback to public embed iframe if key is absent
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}`
    : `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Dirección del proyecto: ' + address.trim())}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address.trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm flex flex-col ${className}`}
    >
      {/* Header with location label */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-gray-800 font-medium text-sm">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate">{title || 'Project Location'}</span>
        </div>
        <span className="text-xs text-gray-500 truncate max-w-[200px]" title={address}>
          {address}
        </span>
      </div>

      {/* Embedded Map */}
      <div className="relative w-full h-[250px] bg-gray-100">
        <iframe
          title={`Map location for ${address}`}
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Action Buttons Bar */}
      <div className="p-3 bg-white border-t border-gray-100 flex flex-wrap items-center gap-2">
        {/* Copy Address */}
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            copied
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title="Copy address to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-gray-500" />
              <span>Copy Address</span>
            </>
          )}
        </button>

        {/* Open in Google Maps / GPS */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="Open location in Google Maps"
        >
          <Navigation className="w-3.5 h-3.5 text-amber-600" />
          <span>Open in Maps</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </a>

        {/* Send to WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/70 transition-colors"
          title="Share address on WhatsApp"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Send via WhatsApp</span>
          <ExternalLink className="w-3 h-3 text-emerald-400" />
        </a>
      </div>
    </div>
  )
}
