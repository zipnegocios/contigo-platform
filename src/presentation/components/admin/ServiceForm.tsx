'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { CoverMediaSelector } from '@/presentation/components/admin/CoverMediaSelector'
import { GalleryManagerModal } from '@/presentation/components/admin/GalleryManagerModal'
import type { GalleryItem } from '@/types/media'

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
    published: boolean
  }
}

function generateSlugClient(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type TabId = 'info' | 'media'

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: service?.name || '',
    slug: service?.slug || '',
    shortDescription: service?.shortDescription || '',
    fullDescription: service?.fullDescription || '',
    imageUrl: service?.imageUrl || '',
    posterUrl: service?.posterUrl || null as string | null,
    galleryItems: service?.galleryItems || [] as GalleryItem[],
    published: service?.published ?? true,
  })

  // Auto-generate slug when name changes (create mode only)
  useEffect(() => {
    if (!service) {
      setFormData((prev) => ({ ...prev, slug: generateSlugClient(prev.name) }))
    }
  }, [formData.name, service])

  const mediaLocked = !formData.name.trim()

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
          shortDescription: formData.shortDescription,
          fullDescription: formData.fullDescription,
          imageUrl: formData.imageUrl,
          posterUrl: formData.posterUrl,
          galleryItems: formData.galleryItems,
          published: formData.published,
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
        <div className="flex gap-1 border-b" style={{ borderColor: '#E5DDD0' }}>
          {tabs.map((tab) => {
            const disabled = tab.id === 'media' && mediaLocked
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setActiveTab(tab.id)}
                className="px-6 py-3 text-sm font-medium transition-all relative"
                style={{
                  color:
                    activeTab === tab.id
                      ? '#2D2924'
                      : disabled
                      ? '#C5BDB4'
                      : '#6B6560',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {tab.label}
                {disabled && (
                  <span className="ml-1.5 text-[10px]" style={{ color: '#C5BDB4' }}>
                    (enter name first)
                  </span>
                )}
                {activeTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: '#E2C063' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
              {service ? 'Edit Service' : 'New Service'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeTab === 'info' && (
              <>
                <div>
                  <label className="text-sm font-medium" style={{ color: '#2D2924' }}>Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Service name"
                    className="mt-2"
                    style={{ borderColor: '#E5DDD0' }}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: '#2D2924' }}>
                    Slug
                    <span className="ml-2 text-xs font-normal" style={{ color: '#A89E8C' }}>
                      (auto-generated)
                    </span>
                  </label>
                  <Input
                    value={formData.slug}
                    readOnly
                    className="mt-2 font-mono text-sm"
                    style={{ borderColor: '#E5DDD0', backgroundColor: '#FAF6F0', color: '#6B6560' }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: '#2D2924' }}>Short Description</label>
                  <Textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Brief description shown in listings"
                    className="mt-2"
                    style={{ borderColor: '#E5DDD0' }}
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: '#2D2924' }}>Full Description</label>
                  <Textarea
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    placeholder="Detailed description shown on the service page"
                    className="mt-2 min-h-32"
                    style={{ borderColor: '#E5DDD0' }}
                  />
                </div>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, published: checked as boolean })
                    }
                  />
                  <span className="text-sm font-medium" style={{ color: '#2D2924' }}>Published</span>
                </label>
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
                />

                <div
                  className="pt-4"
                  style={{ borderTop: '1px solid #E5DDD0' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium" style={{ color: '#2D2924' }}>
                      Gallery
                      <span className="ml-2 text-xs font-normal" style={{ color: '#A89E8C' }}>
                        ({formData.galleryItems.length} items)
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setGalleryModalOpen(true)}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={{ border: '1px solid rgba(226,192,99,0.4)', color: '#E2C063', backgroundColor: 'rgba(226,192,99,0.08)' }}
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
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {formData.galleryItems.length > 8 && (
                        <div
                          className="overflow-hidden rounded-lg flex-shrink-0 flex items-center justify-center text-xs"
                          style={{ width: 64, height: 48, backgroundColor: 'rgba(226,192,99,0.1)', color: '#E2C063' }}
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
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: loading ? '#C8A55C' : '#E2C063',
                  color: '#1E1A16',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#D4AF37' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#E2C063' }}
              >
                {loading ? 'Saving…' : service ? 'Update Service' : 'Create Service'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ border: '1px solid #E5DDD0', color: '#6B6560', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E2C063'; e.currentTarget.style.color = '#E2C063' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5DDD0'; e.currentTarget.style.color = '#6B6560' }}
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
