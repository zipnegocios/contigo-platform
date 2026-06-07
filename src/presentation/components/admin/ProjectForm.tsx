'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { FileUpload } from '@/presentation/components/admin/FileUpload'
import { GalleryUpload } from '@/presentation/components/admin/GalleryUpload'

interface ProjectFormProps {
  project?: {
    id: string
    title: string
    category: string
    description: string
    location: string
    completedDate: string
    featured: boolean
    published: boolean
    coverImageUrl: string
    galleryUrls: string[]
  }
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setCategories(data))
      .catch(() => {})
  }, [])
  const [formData, setFormData] = useState({
    title: project?.title || '',
    category: project?.category || '',
    description: project?.description || '',
    location: project?.location || '',
    completedDate: project?.completedDate || '',
    featured: project?.featured || false,
    published: project?.published || false,
    coverImageUrl: project?.coverImageUrl || '',
    galleryUrls: project?.galleryUrls || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const method = project ? 'PATCH' : 'POST'
      const url = project ? `/api/admin/projects/${project.id}` : '/api/admin/projects'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{project ? 'Edit Project' : 'New Project'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Project title"
              className="mt-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={formData.category} onValueChange={(cat) => setFormData({ ...formData, category: cat })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description"
              className="mt-2 min-h-32"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Project location"
              className="mt-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Completed Date</label>
            <Input
              type="date"
              value={formData.completedDate}
              onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
              className="mt-2"
              required
            />
          </div>

          <FileUpload
            prefix="projects/cover"
            label="Cover Image"
            value={formData.coverImageUrl || null}
            onChange={(url) => setFormData({ ...formData, coverImageUrl: url })}
          />

          <GalleryUpload
            value={formData.galleryUrls}
            onChange={(urls) => setFormData({ ...formData, galleryUrls: urls })}
          />

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked as boolean })
                }
              />
              <span className="text-sm font-medium">Featured Project</span>
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked as boolean })
                }
              />
              <span className="text-sm font-medium">Published</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
