import type { PageBlock } from '@/types/pageBlocks'

export function BlockList(_props: {
  blocks: PageBlock[]
  activeBlockId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onReorder: (blocks: PageBlock[]) => void
}) { return null }
