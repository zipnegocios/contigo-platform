'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Category } from '@/core/entities/Category'

const SeoMetadataSchema = z.object({
  metaTitle: z.string().max(60, 'Max 60 characters').optional().or(z.literal('')),
  metaDescription: z.string().max(155, 'Max 155 characters').optional().or(z.literal('')),
  metaKeywords: z.array(z.string()).optional(),
})

type SeoMetadataFormData = z.infer<typeof SeoMetadataSchema>

interface CategorySeoTabProps {
  category: Category
  onSave?: () => void
}

export function CategorySeoTab({ category, onSave }: CategorySeoTabProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [keywordInput, setKeywordInput] = useState<string>('')

  const form = useForm<SeoMetadataFormData>({
    resolver: zodResolver(SeoMetadataSchema),
    defaultValues: {
      metaTitle: category.metaTitle || '',
      metaDescription: category.metaDescription || '',
      metaKeywords: category.metaKeywords || [],
    },
  })

  const { register, watch, formState, handleSubmit, setValue } = form
  const metaTitle = watch('metaTitle') || category.name
  const metaDescription = watch('metaDescription') || category.description || ''
  const metaKeywords = watch('metaKeywords') || []

  const onSubmit = async (data: SeoMetadataFormData) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/categories/${category.id}/seo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          metaKeywords: data.metaKeywords || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save SEO metadata')
      }

      toast.success('SEO metadata updated')
      onSave?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save SEO metadata')
    } finally {
      setIsSaving(false)
    }
  }

  const addKeyword = () => {
    if (keywordInput.trim() && metaKeywords.length < 5) {
      setValue('metaKeywords', [...metaKeywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (index: number) => {
    setValue(
      'metaKeywords',
      metaKeywords.filter((_, i) => i !== index),
    )
  }

  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-4)', fontSize: 'var(--text-fluid-base)', fontWeight: 600 }}>
        SEO Metadata
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 'var(--spacing-6)' }}>
        {/* Meta Title */}
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 500 }}>
            Meta Title (60 chars max)
          </label>
          <input
            {...register('metaTitle')}
            type="text"
            placeholder={category.name}
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
            placeholder={category.description || 'Enter description'}
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

        {/* Meta Keywords */}
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 500 }}>
            Meta Keywords (up to 5)
          </label>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addKeyword()
                }
              }}
              placeholder="Add keyword and press Enter"
              style={{
                flex: 1,
                padding: 'var(--spacing-2)',
                border: '1px solid var(--neutral-300)',
                borderRadius: '0.375rem',
                fontFamily: 'monospace',
                fontSize: 'var(--text-fluid-sm)',
              }}
            />
            <button
              type="button"
              onClick={addKeyword}
              disabled={metaKeywords.length >= 5}
              style={{
                padding: 'var(--spacing-2) var(--spacing-4)',
                backgroundColor: metaKeywords.length >= 5 ? 'var(--neutral-300)' : 'var(--neutral-800)',
                color: 'white',
                borderRadius: '0.375rem',
                cursor: metaKeywords.length >= 5 ? 'not-allowed' : 'pointer',
                border: 'none',
                fontSize: 'var(--text-fluid-sm)',
                fontWeight: 500,
              }}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
            {metaKeywords.map((keyword, index) => (
              <div
                key={index}
                style={{
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  backgroundColor: 'var(--neutral-200)',
                  borderRadius: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  fontSize: 'var(--text-fluid-sm)',
                }}
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--neutral-600)',
                    fontSize: 'var(--text-fluid-sm)',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
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
          disabled={isSaving || !formState.isDirty}
          style={{
            padding: 'var(--spacing-2) var(--spacing-4)',
            backgroundColor: formState.isDirty && !isSaving ? 'var(--neutral-800)' : 'var(--neutral-400)',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: formState.isDirty && !isSaving ? 'pointer' : 'not-allowed',
            fontSize: 'var(--text-fluid-sm)',
            fontWeight: 500,
          }}
        >
          {isSaving ? 'Saving...' : 'Save SEO Metadata'}
        </button>
      </form>

      <p style={{ marginTop: 'var(--spacing-4)', fontSize: 'var(--text-fluid-xs)', color: 'var(--neutral-600)' }}>
        Leave fields empty to use the category name/description as defaults. Meta Title and Description appear in Google search results.
      </p>
    </div>
  )
}
