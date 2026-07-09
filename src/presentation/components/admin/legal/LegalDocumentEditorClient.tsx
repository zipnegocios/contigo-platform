'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Check, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/presentation/components/ui/dialog'
import { legalMarkdownRemarkPlugins, legalMarkdownRehypePlugins } from '@/infrastructure/markdown/legal-markdown'

type LegalStatus = 'draft' | 'in_review' | 'published' | 'archived'

interface DocumentData {
  id: string
  slug: string
  domain: 'website' | 'service' | 'general'
  title: string
  content: string
  version: number
  status: LegalStatus
  effectiveDate: string | null
  reviewNote: string | null
  contentHash: string | null
}

interface RequirementRow {
  anchorId: string
  requiredBy: string
  active: boolean
  present: boolean
}

interface VersionRow {
  id: string
  version: number
  status: LegalStatus
  contentHash: string | null
  publishedAt: string | null
  publishedByName: string | null
}

function diffSummary(oldText: string, newText: string): { added: number; removed: number } {
  const oldLines = new Set(oldText.split('\n').map((l) => l.trim()).filter(Boolean))
  const newLines = newText.split('\n').map((l) => l.trim()).filter(Boolean)
  const newSet = new Set(newLines)
  let added = 0
  for (const line of newSet) if (!oldLines.has(line)) added++
  let removed = 0
  for (const line of oldLines) if (!newSet.has(line)) removed++
  return { added, removed }
}

export function LegalDocumentEditorClient({
  document,
  previousPublishedContent,
  requirements,
  versions,
}: {
  document: DocumentData
  previousPublishedContent: string | null
  requirements: RequirementRow[]
  versions: VersionRow[]
}) {
  const router = useRouter()
  const editable = document.status === 'draft' || document.status === 'in_review'
  const [title, setTitle] = useState(document.title)
  const [content, setContent] = useState(document.content)
  const [saving, setSaving] = useState(false)
  const [reviewNote, setReviewNote] = useState(document.reviewNote ?? '')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishNote, setPublishNote] = useState('')
  const [publishing, setPublishing] = useState(false)

  const missingActive = requirements.filter((r) => r.active && !r.present)
  const softMissing = requirements.filter((r) => !r.active && !r.present)

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/legal/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save draft')
      }
      toast.success('Draft saved')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitForReview() {
    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/admin/legal/${document.id}/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNote: reviewNote || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to submit for review')
      }
      toast.success('Submitted for review')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit for review')
    } finally {
      setSubmittingReview(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/legal/${document.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNote: publishNote || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to publish')
      }
      toast.success('Published')
      setPublishOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  const diff = previousPublishedContent ? diffSummary(previousPublishedContent, content) : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-fluid-3xl font-semibold truncate" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
            {document.title}
          </h1>
          <p className="text-fluid-xs" style={{ color: '#9C8F83' }}>
            /legal/{document.slug} &middot; v{document.version}
          </p>
        </div>
        <Badge>{document.status.replace('_', ' ')}</Badge>
      </div>

      {!editable && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-fluid-sm" style={{ background: '#FDF6E3', color: '#8A6D1F' }}>
          <Info className="w-4 h-4 flex-shrink-0" />
          This version is {document.status} and cannot be edited. Save a new draft from the list to make changes.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title</Label>
              <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!editable} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-content">Content (Markdown)</Label>
              <Textarea
                id="doc-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!editable}
                rows={24}
                className="font-mono text-fluid-sm"
              />
            </div>
            {editable && (
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSaveDraft} disabled={saving} variant="outline">
                  {saving ? 'Saving…' : 'Save draft'}
                </Button>
                {document.status === 'draft' && (
                  <Button onClick={handleSubmitForReview} disabled={submittingReview} variant="secondary">
                    {submittingReview ? 'Submitting…' : 'Submit for review'}
                  </Button>
                )}
                <Button onClick={() => setPublishOpen(true)} disabled={missingActive.length > 0}>
                  Publish
                </Button>
                {missingActive.length > 0 && (
                  <p className="text-fluid-xs self-center" style={{ color: '#B91C1C' }}>
                    Missing required anchors — see panel
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="doc-review-note">Review note</Label>
              <Textarea
                id="doc-review-note"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Approved by [consultant] 2026-07-20"
                rows={2}
                disabled={!editable}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <article className="prose prose-neutral max-w-none border rounded-lg p-6" style={{ borderColor: '#E5DDD0' }}>
              <ReactMarkdown remarkPlugins={legalMarkdownRemarkPlugins} rehypePlugins={legalMarkdownRehypePlugins}>
                {content}
              </ReactMarkdown>
            </article>
          </TabsContent>

          <TabsContent value="history">
            <div className="rounded-lg overflow-hidden bg-white" style={{ border: '1px solid #E5DDD0' }}>
              <table className="w-full text-fluid-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5DDD0' }}>
                    <th className="text-left px-4 py-2">Version</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Hash</th>
                    <th className="text-left px-4 py-2">Published by</th>
                    <th className="text-left px-4 py-2">Published at</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                      <td className="px-4 py-2">v{v.version}</td>
                      <td className="px-4 py-2">{v.status.replace('_', ' ')}</td>
                      <td className="px-4 py-2 font-mono text-fluid-xs">{v.contentHash ? v.contentHash.slice(0, 10) : '—'}</td>
                      <td className="px-4 py-2">{v.publishedByName ?? '—'}</td>
                      <td className="px-4 py-2">{v.publishedAt ? new Date(v.publishedAt).toLocaleString('en-AU') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Anchors panel */}
        <aside className="space-y-3">
          <h2 className="text-fluid-sm font-semibold" style={{ color: '#6B6560' }}>
            Required anchors
          </h2>
          {requirements.length === 0 ? (
            <p className="text-fluid-xs" style={{ color: '#9C8F83' }}>
              No third-party integration requires an anchor in this document.
            </p>
          ) : (
            <ul className="space-y-2">
              {requirements.map((r) => (
                <li key={r.anchorId} className="flex items-start gap-2 text-fluid-xs" style={{ color: '#2D2924' }}>
                  {r.present ? (
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${r.active ? 'text-red-600' : 'text-amber-500'}`} />
                  )}
                  <div>
                    <p>
                      #{r.anchorId} <span style={{ color: '#9C8F83' }}>({r.requiredBy})</span>
                    </p>
                    {!r.active && <p style={{ color: '#9C8F83' }}>Not yet active — warning only</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish {document.title}</DialogTitle>
            <DialogDescription>
              This archives the currently published version (if any) and makes this content live immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {diff ? (
              <p className="text-fluid-sm">
                Compared to the current published version: <strong>+{diff.added}</strong> lines added,{' '}
                <strong>-{diff.removed}</strong> lines removed.
              </p>
            ) : (
              <p className="text-fluid-sm">No previously published version for this document — this will be v1 live.</p>
            )}
            {softMissing.length > 0 && (
              <p className="text-fluid-xs" style={{ color: '#8A6D1F' }}>
                {softMissing.length} inactive integration anchor(s) still missing — non-blocking for now.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="publish-note">Review note (optional)</Label>
              <Textarea id="publish-note" value={publishNote} onChange={(e) => setPublishNote(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publishing…' : 'Confirm publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
