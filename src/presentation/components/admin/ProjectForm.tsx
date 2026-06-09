'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { CoverMediaSelector } from '@/presentation/components/admin/CoverMediaSelector'
import { GalleryManagerModal } from '@/presentation/components/admin/GalleryManagerModal'
import { HierarchicalCategorySelect } from '@/presentation/components/admin/HierarchicalCategorySelect'
import type { GalleryItem } from '@/types/media'

interface ProjectFormProps {
  project?: {
    id: string
    slug: string
    title: string
    category: string
    categoryId?: string | null
    description: string
    location: string
    completedDate: string
    featured: boolean
    published: boolean
    coverImageUrl: string
    coverPosterUrl?: string | null
    galleryItems?: GalleryItem[]
  }
}

type TabId = 'info' | 'media'

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    title: project?.title || '',
    category: project?.category || '',
    categoryId: project?.categoryId || null as string | null,
    description: project?.description || '',
    location: project?.location || '',
    completedDate: project?.completedDate || '',
    featured: project?.featured || false,
    published: project?.published || false,
    coverImageUrl: project?.coverImageUrl || '',
    coverPosterUrl: project?.coverPosterUrl || null as string | null,
    galleryItems: project?.galleryItems || [] as GalleryItem[],
  })

  const mediaLocked = !formData.title.trim()
  const entityCtx = project
    ? { type: 'project' as const, id: project.id, name: formData.title }
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const method = project ? 'PATCH' : 'POST'
      const url = project ? `/api/admin/projects/${project.id}` : '/api/admin/projects'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          categoryId: formData.categoryId,
          description: formData.description,
          location: formData.location,
          completedDate: formData.completedDate,
          featured: formData.featured,
          published: formData.published,
          coverImageUrl: formData.coverImageUrl,
          coverPosterUrl: formData.coverPosterUrl,
          galleryItems: formData.galleryItems,
        }),
      })

      if (!response.ok) throw new Error('Failed to save project')

      toast.success(project ? 'Project updated' : 'Project created')
      router.push('/admin/projects')
    } catch (error) {
      toast.error('Failed to save project')
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
                    (enter title first)
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
              {project ? 'Edit Project' : 'New Project'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeTab === 'info' && (
              <>
                <div>
                  <label className="text-sm font-medium" style={{ color: '#2D2924' }}>Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Project title"
                    className="mt-2"
                    style={{ borderColor: '#E5DDD0' }}
                    required
                  />
                </div>

                <div className="mt-2">
                  <HierarchicalCategorySelect
                    type="project"
                    value={formData.categoryId}
                    onChange={(id) => setFormData({ ...formData, categoryId: id })}
                    label="Category"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: '#2D2924' }}>Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Project description"
                    className="mt-2 min-h-32"
                    style={{ borderColor: '#E5DDD0' }}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: '#2D2924' }}>Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Project location"
                    className="mt-2"
                    style={{ borderColor: '#E5DDD0' }}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: '#2D2924' }}>Completed Date</label>
                  <Input
                    type="date"
                    value={formData.completedDate}
                    onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                    className="mt-2"
                    style={{ borderColor: '#E5DDD0' }}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, featured: checked as boolean })
                      }
                    />
                    <span className="text-sm font-medium" style={{ color: '#2D2924' }}>Featured Project</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.published}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, published: checked as boolean })
                      }
                    />
                    <span className="text-sm font-medium" style={{ color: '#2D2924' }}>Published</span>
                  </label>
                </div>
              </>
            )}

            {activeTab === 'media' && (
              <>
                <CoverMediaSelector
                  coverUrl={formData.coverImageUrl || null}
                  posterUrl={formData.coverPosterUrl}
                  onChange={(coverUrl, posterUrl) =>
                    setFormData({ ...formData, coverImageUrl: coverUrl || '', coverPosterUrl: posterUrl })
                  }
                  folder={project?.slug || undefined}
                  entityContext={entityCtx}
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

                  {/* Gallery strip preview */}
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
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                style={{ backgroundColor: '#E2C063', color: '#1E1A16', cursor: loading ? 'not-allowed' : 'pointer' }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#D4AF37' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#E2C063' }}
              >
                {loading ? 'Saving…' : project ? 'Update Project' : 'Create Project'}
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
          folder={project?.slug || undefined}
          entityContext={entityCtx}
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
