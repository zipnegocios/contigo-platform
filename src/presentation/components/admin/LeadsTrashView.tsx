'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/presentation/components/ui/alert-dialog'
import type { QuoteDTO } from '@/presentation/types/QuoteDTO'
import type { PipelineStageDTO } from '@/presentation/types/PipelineStageDTO'

interface LeadsTrashViewProps {
  leads: Array<{
    id: string
    quoteId: string
    stageId: string
    estimatedValue: number | null
    updatedAt: Date
    quote: QuoteDTO | null
  }>
  pipelineStages: PipelineStageDTO[]
}

export function LeadsTrashView({ leads, pipelineStages }: LeadsTrashViewProps) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const restoreLead = async (leadId: string) => {
    setRestoringId(leadId)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/restore-trash`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore lead')
      toast.success('Lead restored')
      router.refresh()
    } catch {
      toast.error('Could not restore lead')
    } finally {
      setRestoringId(null)
    }
  }

  const deleteForever = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/leads/${deleteTarget.id}/delete-permanently`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to delete lead')
      toast.success('Lead permanently deleted')
      setDeleteTarget(null)
      setConfirmText('')
      router.refresh()
    } catch {
      toast.error('Could not delete lead')
    } finally {
      setDeleting(false)
    }
  }

  const closeDialog = () => {
    setDeleteTarget(null)
    setConfirmText('')
  }

  return (
    <div
      className="rounded-lg overflow-hidden bg-white"
      style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
    >
      <Table>
        <TableHeader>
          <TableRow style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid #E5DDD0' }}>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Name</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Email</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Service</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}>Stage</TableHead>
            <TableHead className="text-fluid-xs font-medium uppercase tracking-wider py-3" style={{ color: '#6B6560' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                Trash is empty
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id} style={{ borderBottom: '1px solid #F0E8DC' }}>
                <TableCell className="font-medium py-3.5" style={{ color: 'var(--neutral-800)' }}>{lead.quote?.name || 'Unknown'}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{lead.quote?.email ?? '—'}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>{lead.quote?.service ?? '—'}</TableCell>
                <TableCell className="py-3.5 text-fluid-sm" style={{ color: '#6B6560' }}>
                  {pipelineStages.find((s) => s.id === lead.stageId)?.label ?? '—'}
                </TableCell>
                <TableCell className="py-3.5 flex gap-2">
                  <Button size="sm" variant="outline" disabled={restoringId === lead.id} onClick={() => restoreLead(lead.id)}>
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget({ id: lead.id, name: lead.quote?.name || 'this lead' })}
                  >
                    Delete Forever
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lead, its quote, and all associated data
              (documents, notes, messages, tasks, events). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-fluid-sm" style={{ color: '#6B6560' }}>
            Type <strong>{deleteTarget?.name}</strong> to confirm.
          </div>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={deleteTarget?.name}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting || confirmText !== deleteTarget?.name}
              onClick={deleteForever}
            >
              Delete Forever
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
