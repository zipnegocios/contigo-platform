'use client'

import type { PageBlock } from '@/types/pageBlocks'

interface ServicePageBuilderProps {
  service: {
    id: string
    name: string
    shortDescription: string
    imageUrl: string
    published: boolean
    pageBlocks: PageBlock[] | null
    categoryId: string | null
    slug: string
  }
  categorySlug: string
}

export function ServicePageBuilder(_props: ServicePageBuilderProps) {
  return <div>Builder coming in Task 8</div>
}
