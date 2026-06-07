'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { FileUpload } from '@/presentation/components/admin/FileUpload'

interface ServiceFormProps {
  service?: {
    id: string
    name: string
    slug: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
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

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: service?.name || '',
    slug: service?.slug || '',
    shortDescription: service?.shortDescription || '',
    fullDescription: service?.fullDescription || '',
    imageUrl: service?.imageUrl || '',
    published: service?.published ?? true,
  })

  // Auto-generate slug when name changes (create mode only)
  useEffect(() => {
    if (!service) {
      setFormData((prev) => ({ ...prev, slug: generateSlugClient(prev.name) }))
    }
  }, [formData.name, service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.imageUrl) {
      toast.error('Please upload a service image')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
            {service ? 'Edit Service' : 'New Service'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <FileUpload
            prefix="services"
            label="Service Image"
            value={formData.imageUrl || null}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            folder={formData.slug || undefined}
          />

          <label className="flex items-center gap-2">
            <Checkbox
              checked={formData.published}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, published: checked as boolean })
              }
            />
            <span className="text-sm font-medium" style={{ color: '#2D2924' }}>Published</span>
          </label>

          <div className="flex gap-3">
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
  )
}
