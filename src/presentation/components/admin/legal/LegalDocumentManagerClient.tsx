'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/presentation/components/ui/dialog'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'

type LegalDomain = 'website' | 'service' | 'general'
type LegalStatus = 'draft' | 'in_review' | 'published' | 'archived'

interface LegalDocumentRow {
  id: string
  slug: string
  domain: LegalDomain
  title: string
  version: number
  status: LegalStatus
  effectiveDate: string | null
  anchorsOk: boolean
  hasSoftWarnings: boolean
}

const DOMAIN_LABELS: Record<LegalDomain, string> = { website: 'Website', service: 'Service', general: 'General' }

const STATUS_VARIANT: Record<LegalStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  in_review: 'secondary',
  published: 'default',
  archived: 'outline',
}

function makeSlugPreview(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function LegalDocumentManagerClient({ documents }: { documents: LegalDocumentRow[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState<LegalDomain>('website')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const slug = makeSlugPreview(title)
  const grouped: Record<LegalDomain, LegalDocumentRow[]> = { website: [], service: [], general: [] }
  for (const doc of documents) grouped[doc.domain].push(doc)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, domain, title: title.trim(), content }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create document')
      }
      const data = await res.json()
      toast.success('Draft created')
      setCreating(false)
      router.push(`/admin/legal/${data.document.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create document')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" />
          New document
        </Button>
      </div>

      {(['website', 'service', 'general'] as LegalDomain[]).map((d) =>
        grouped[d].length === 0 ? null : (
          <div key={d} className="mb-8">
            <h2 className="text-fluid-sm font-semibold mb-2" style={{ color: '#6B6560' }}>
              {DOMAIN_LABELS[d]}
            </h2>
            <div
              className="rounded-lg overflow-hidden bg-white"
              style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
            >
              <ul>
                {grouped[d].map((doc, idx) => (
                  <li key={doc.id} style={{ borderBottom: idx < grouped[d].length - 1 ? '1px solid #F0E8DC' : 'none' }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/legal/${doc.id}`)}
                      className="w-full flex items-center justify-between px-6 py-4 gap-4 text-left hover:bg-black/[0.02] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-fluid-sm font-semibold truncate" style={{ color: '#2D2924' }}>
                          {doc.title}
                        </p>
                        <p className="text-fluid-xs truncate" style={{ color: '#9C8F83' }}>
                          /legal/{doc.slug} &middot; v{doc.version}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {doc.effectiveDate && (
                          <span className="text-fluid-xs" style={{ color: '#9C8F83' }}>
                            {new Date(doc.effectiveDate).toLocaleDateString('en-AU')}
                          </span>
                        )}
                        <span title={doc.anchorsOk ? 'Required anchors present' : 'Missing required anchors'}>
                          {doc.anchorsOk ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                        <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status.replace('_', ' ')}</Badge>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ),
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New legal document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="legal-title">Title</Label>
              <Input id="legal-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              {slug && (
                <p className="text-fluid-xs" style={{ color: '#9C8F83' }}>
                  /legal/{slug}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legal-domain">Domain</Label>
              <Select value={domain} onValueChange={(v) => setDomain(v as LegalDomain)}>
                <SelectTrigger id="legal-domain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legal-content">Content (Markdown)</Label>
              <Textarea
                id="legal-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create draft'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
