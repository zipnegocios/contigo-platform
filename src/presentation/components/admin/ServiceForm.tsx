'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { CoverMediaSelector } from '@/presentation/components/admin/CoverMediaSelector'
import { GalleryManagerModal } from '@/presentation/components/admin/GalleryManagerModal'
import { HierarchicalCategorySelect } from '@/presentation/components/admin/HierarchicalCategorySelect'
import { GalleryThumbnail } from '@/presentation/components/GalleryThumbnail'
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import type { GalleryItem } from '@/types/media'
import type { ContentStatus } from '@/types/status'

interface ServiceFormProps {
  service?: {
    id: string
    name: string
    slug: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
    posterUrl?: string | null
    galleryItems?: GalleryItem[]
    categoryId?: string | null
    status: ContentStatus
  }
}

type TabId = 'info' | 'media'

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [formData, setFormData] = useState({
    name: service?.name || '',
    slug: service?.slug || '',
    shortDescription: service?.shortDescription || '',
    fullDescription: service?.fullDescription || '',
    imageUrl: service?.imageUrl || '',
    posterUrl: service?.posterUrl || null as string | null,
    galleryItems: service?.galleryItems || [] as GalleryItem[],
    categoryId: service?.categoryId || null as string | null,
    status: service?.status ?? 'active' as ContentStatus,
  })

  const mediaLocked = !formData.name.trim()
  const entityCtx = service
    ? { type: 'service' as const, id: service.id, name: formData.name }
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.imageUrl) {
      toast.error('Please set a cover image')
      return
    }

    setLoading(true)

    try {
      const method = service ? 'PATCH' : 'POST'
      const url = service ? `/api/admin/services/${service.id}` : '/api/admin/services'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          shortDescription: formData.shortDescription,
          fullDescription: formData.fullDescription,
          imageUrl: formData.imageUrl,
          posterUrl: formData.posterUrl,
          galleryItems: formData.galleryItems,
          categoryId: formData.categoryId,
          status: formData.status,
        }),
      })

      if (!response.ok) throw new Error('Failed to save service')

      toast.success(service ? 'Service updated' : 'Service created')
      router.push('/admin/services')
    } catch (error) {
      toast.error('Failed to save service')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'info', label: 'Info' },
    { id: 'media', label: 'Media' },
  ]

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Tab bar */}
        <div className="flex gap-1 border-b" style={{ borderColor: 'var(--neutral-200)' }}>
          {tabs.map((tab) => {
            const disabled = tab.id === 'media' && mediaLocked
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setActiveTab(tab.id)}
                className="px-6 py-3 text-fluid-sm font-medium transition-all relative min-h-[44px]"
                style={{
                  color:
                    activeTab === tab.id
                      ? 'var(--neutral-800)'
                      : disabled
                      ? '#C5BDB4'
                      : '#6B6560',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {tab.label}
                {disabled && (
                  <span className="ml-1.5 text-fluid-xs" style={{ color: '#C5BDB4' }}>
                    (enter name first)
                  </span>
                )}
                {activeTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--contigo-primary)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}>
              {service ? 'Edit Service' : 'New Service'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeTab === 'info' && (
              <>
                <div>
                  <label className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        // Keeps auto-following the name until the admin edits
                        // the slug field directly (see slug input below).
                        slug: slugTouched ? prev.slug : generateSlug(name),
                      }))
                    }}
                    placeholder="Service name"
                    className="mt-2"
                    style={{ borderColor: 'var(--neutral-200)' }}
                    required
                  />
                </div>

                <div>
                  <label className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>
                    URL Slug
                    <span className="ml-2 text-fluid-xs font-normal" style={{ color: 'var(--neutral-400)' }}>
                      /services/[category]/{formData.slug || '…'}
                    </span>
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={formData.slug}
                      onChange={(e) => {
                        setSlugTouched(true)
                        setFormData({ ...formData, slug: e.target.value })
                      }}
                      onBlur={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                      placeholder="auto-generated-from-name"
                      className="font-mono text-fluid-sm"
                      style={{ borderColor: 'var(--neutral-200)' }}
                    />
                    {slugTouched && (
                      <button
                        type="button"
                        onClick={() => {
                          setSlugTouched(false)
                          setFormData({ ...formData, slug: generateSlug(formData.name) })
                        }}
                        className="px-3 py-2 text-fluid-xs font-medium rounded-lg whitespace-nowrap min-h-[44px]"
                        style={{ border: '1px solid var(--neutral-200)', color: 'var(--neutral-600)' }}
                      >
                        Reset to auto
                      </button>
                    )}
                  </div>
                  {service && formData.slug !== service.slug && (
                    <p className="text-fluid-xs mt-1.5" style={{ color: '#B45309' }}>
                      Changing the slug moves the service&apos;s public URL. Old links will no longer resolve.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Short Description</label>
                  <Textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Brief description shown in listings"
                    className="mt-2"
                    style={{ borderColor: 'var(--neutral-200)' }}
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Full Description</label>
                  <Textarea
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    placeholder="Detailed description shown on the service page"
                    className="mt-2 min-h-32"
                    style={{ borderColor: 'var(--neutral-200)' }}
                  />
                </div>

                <HierarchicalCategorySelect
                  type="shared"
                  value={formData.categoryId}
                  onChange={(id) => setFormData({ ...formData, categoryId: id })}
                  label="Category"
                />

                <div>
                  <label className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                    className="mt-2 w-full px-3 py-2 rounded-lg text-fluid-sm outline-none"
                    style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'media' && (
              <>
                <CoverMediaSelector
                  coverUrl={formData.imageUrl || null}
                  posterUrl={formData.posterUrl}
                  onChange={(coverUrl, posterUrl) =>
                    setFormData({ ...formData, imageUrl: coverUrl || '', posterUrl })
                  }
                  folder={service?.slug || formData.slug || undefined}
                  entityContext={entityCtx}
                  entityType="service"
                />

                <div
                  className="pt-4"
                  style={{ borderTop: '1px solid #E5DDD0' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>
                      Gallery
                      <span className="ml-2 text-fluid-xs font-normal" style={{ color: 'var(--neutral-600)' }}>
                        ({formData.galleryItems.length} items)
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setGalleryModalOpen(true)}
                      className="px-4 py-1.5 rounded-lg text-fluid-sm font-medium transition-all min-h-[44px]"
                      style={{ border: '1px solid rgba(226,192,99,0.4)', color: 'var(--contigo-primary)', backgroundColor: 'rgba(226,192,99,0.08)' }}
                    >
                      Manage Gallery
                    </button>
                  </div>

                  {formData.galleryItems.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {formData.galleryItems.slice(0, 8).map((item, i) => (
                        <div
                          key={i}
                          className="overflow-hidden rounded-lg flex-shrink-0"
                          style={{ width: 64, height: 48, backgroundColor: '#F5EFE8' }}
                        >
                          <GalleryThumbnail url={item.url} />
                        </div>
                      ))}
                      {formData.galleryItems.length > 8 && (
                        <div
                          className="overflow-hidden rounded-lg flex-shrink-0 flex items-center justify-center text-xs"
                          style={{ width: 64, height: 48, backgroundColor: 'rgba(226,192,99,0.1)', color: 'var(--contigo-primary)' }}
                        >
                          +{formData.galleryItems.length - 8}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-fluid-sm font-semibold transition-all duration-200 min-h-[44px]"
                style={{
                  backgroundColor: loading ? '#C8A55C' : 'var(--contigo-primary)',
                  color: 'var(--petrol-800)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--gold-600)' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--contigo-primary)' }}
              >
                {loading ? 'Saving…' : service ? 'Update Service' : 'Create Service'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-lg text-fluid-sm font-medium transition-all duration-200 min-h-[44px]"
                style={{ border: '1px solid #E5DDD0', color: '#6B6560', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--contigo-primary)'; e.currentTarget.style.color = 'var(--contigo-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--neutral-200)'; e.currentTarget.style.color = '#6B6560' }}
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      </form>

      {galleryModalOpen && (
        <GalleryManagerModal
          items={formData.galleryItems}
          folder={service?.slug || formData.slug || undefined}
          entityContext={entityCtx}
          entityType="service"
          onSave={(items) => {
            setFormData({ ...formData, galleryItems: items })
            setGalleryModalOpen(false)
          }}
          onClose={() => setGalleryModalOpen(false)}
        />
      )}
    </>
  )
}
