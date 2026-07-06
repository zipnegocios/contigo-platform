'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Service } from '@/core/entities/Service'

const SeoMetadataSchema = z.object({
  metaTitle: z.string().max(60).optional().or(z.literal('')),
  metaDescription: z.string().max(155).optional().or(z.literal('')),
  metaKeywords: z.array(z.string()).optional(),
  noIndex: z.boolean().optional(),
})

type SeoMetadataFormData = z.infer<typeof SeoMetadataSchema>

interface ServiceSeoTabProps {
  service: Service
  onSave?: () => void
}

export function ServiceSeoTab({ service, onSave }: ServiceSeoTabProps) {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<SeoMetadataFormData>({
    resolver: zodResolver(SeoMetadataSchema),
    defaultValues: {
      metaTitle: service.metaTitle || '',
      metaDescription: service.metaDescription || '',
      metaKeywords: service.metaKeywords || [],
      noIndex: service.noIndex || false,
    },
  })

  const { register, watch, handleSubmit } = form
  const metaTitle = watch('metaTitle') || service.name
  const metaDescription = watch('metaDescription') || service.shortDescription
  const noIndex = watch('noIndex') || false

  const onSubmit = async (data: SeoMetadataFormData) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/services/${service.id}/seo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          metaKeywords: data.metaKeywords || null,
          noIndex: data.noIndex || false,
        }),
      })

      if (!response.ok) throw new Error('Failed to save')
      toast.success('SEO metadata updated')
      onSave?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-4)', fontSize: 'var(--text-fluid-base)', fontWeight: 600 }}>
        SEO Metadata
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 'var(--spacing-6)' }}>
        {/* noIndex Warning */}
        {noIndex && (
          <div
            style={{
              padding: 'var(--spacing-4)',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '0.375rem',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            <p style={{ margin: 0, color: '#856404', fontWeight: 500, fontSize: 'var(--text-fluid-sm)' }}>
              Warning: This service is marked as not indexable. Search engines will not index this page.
            </p>
          </div>
        )}

        {/* Meta Title */}
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 500 }}>
            Meta Title (60 chars max)
          </label>
          <input
            {...register('metaTitle')}
            type="text"
            placeholder={service.name}
            maxLength={60}
            style={{
              width: '100%',
              padding: 'var(--spacing-2)',
              border: '1px solid var(--neutral-300)',
              borderRadius: '0.375rem',
              fontFamily: 'monospace',
              fontSize: 'var(--text-fluid-sm)',
            }}
          />
          <p style={{ fontSize: 'var(--text-fluid-xs)', color: 'var(--neutral-600)', marginTop: 'var(--spacing-1)' }}>
            {(metaTitle || '').length} / 60 chars
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 500 }}>
            Meta Description (155 chars max)
          </label>
          <textarea
            {...register('metaDescription')}
            placeholder={service.shortDescription}
            maxLength={155}
            rows={4}
            style={{
              width: '100%',
              padding: 'var(--spacing-2)',
              border: '1px solid var(--neutral-300)',
              borderRadius: '0.375rem',
              fontFamily: 'monospace',
              fontSize: 'var(--text-fluid-sm)',
              resize: 'vertical',
            }}
          />
          <p style={{ fontSize: 'var(--text-fluid-xs)', color: 'var(--neutral-600)', marginTop: 'var(--spacing-1)' }}>
            {(metaDescription || '').length} / 155 chars
          </p>
        </div>

        {/* noIndex Toggle */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
            <input
              {...register('noIndex')}
              type="checkbox"
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 500 }}>
              Prevent search engines from indexing this service
            </span>
          </label>
        </div>

        {/* Live SERP Preview */}
        <div
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--neutral-100)',
            border: '1px solid var(--neutral-300)',
            borderRadius: '0.375rem',
          }}
        >
          <p style={{ fontSize: 'var(--text-fluid-xs)', fontWeight: 600, marginBottom: 'var(--spacing-2)', color: 'var(--neutral-600)' }}>
            Live SERP Preview
          </p>
          <p style={{ fontSize: 'var(--text-fluid-sm)', color: 'var(--blue-600)', marginBottom: 'var(--spacing-1)' }}>
            {metaTitle}
          </p>
          <p style={{ fontSize: 'var(--text-fluid-sm)', color: 'var(--neutral-700)', lineHeight: 1.4 }}>
            {metaDescription.substring(0, 155)}
            {metaDescription.length > 155 ? '...' : ''}
          </p>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: 'var(--spacing-2) var(--spacing-4)',
            backgroundColor: !isSaving ? 'var(--neutral-800)' : 'var(--neutral-400)',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: !isSaving ? 'pointer' : 'not-allowed',
            fontSize: 'var(--text-fluid-sm)',
            fontWeight: 500,
          }}
        >
          {isSaving ? 'Saving...' : 'Save SEO Metadata'}
        </button>
      </form>

      <p style={{ marginTop: 'var(--spacing-4)', fontSize: 'var(--text-fluid-xs)', color: 'var(--neutral-600)' }}>
        Leave fields empty to use the service name/description as defaults. Mark as noIndex to exclude from search results.
      </p>
    </div>
  )
}
