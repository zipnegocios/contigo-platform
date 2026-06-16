'use client'

import { useState } from 'react'
import type { FlatCategory } from '@/types/category'
import { CategoryTreeView } from './CategoryTreeView'

interface CategoryManagerClientProps {
  serviceFlat: FlatCategory[]
  projectFlat: FlatCategory[]
}

export function CategoryManagerClient({ serviceFlat, projectFlat }: CategoryManagerClientProps) {
  const [activeTab, setActiveTab] = useState<'service' | 'project'>('service')

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid #E5DDD0' }}>
        {(['service', 'project'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2.5 text-sm font-medium capitalize transition-all"
            style={
              activeTab === tab
                ? { color: 'var(--contigo-primary)', borderBottom: '2px solid #E2C063' }
                : { color: '#6B6560' }
            }
          >
            {tab === 'service' ? 'Services' : 'Projects'}
          </button>
        ))}
      </div>

      {activeTab === 'service' ? (
        <CategoryTreeView initialFlat={serviceFlat} type="service" />
      ) : (
        <CategoryTreeView initialFlat={projectFlat} type="project" />
      )}
    </div>
  )
}
