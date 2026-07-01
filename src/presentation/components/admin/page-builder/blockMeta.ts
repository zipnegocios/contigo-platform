import type { LucideIcon } from 'lucide-react'
import {
  LayoutTemplate, AlignLeft, Images, ListOrdered,
  Columns2, LayoutGrid, MousePointerClick, Film,
  BarChart2, MessageCircle, Code2, FileText,
} from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'

export const BLOCK_ICONS: Record<PageBlock['type'], LucideIcon> = {
  'hero':             LayoutTemplate,
  'rich-text':        AlignLeft,
  'gallery':          Images,
  'process':          ListOrdered,
  'two-column':       Columns2,
  'features-grid':    LayoutGrid,
  'cta':              MousePointerClick,
  'image-carousel':   Film,
  'comparison-cards': BarChart2,
  'whatsapp-cta':     MessageCircle,
  'custom':           Code2,
  'form':             FileText,
}

export const ELEMENT_CATEGORIES: { label: string; types: PageBlock['type'][] }[] = [
  { label: 'Layout',   types: ['hero', 'two-column', 'features-grid'] },
  { label: 'Content',  types: ['rich-text', 'process'] },
  { label: 'Media',    types: ['gallery', 'image-carousel'] },
  { label: 'Actions',  types: ['cta', 'whatsapp-cta', 'form'] },
  { label: 'Advanced', types: ['comparison-cards', 'custom'] },
]
