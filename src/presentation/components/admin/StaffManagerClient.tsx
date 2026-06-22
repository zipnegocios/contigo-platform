'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { StaffTable, StaffRow } from '@/presentation/components/admin/StaffTable'
import { StaffFormModal } from '@/presentation/components/admin/StaffFormModal'

export function StaffManagerClient({ initialStaff }: { initialStaff: StaffRow[] }) {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2 text-fluid-sm font-semibold rounded-lg min-h-[44px]"
          style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
        >
          <Plus className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
          Create staff user
        </button>
      </div>

      <StaffTable staff={initialStaff} />

      {showCreateModal && (
        <StaffFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
