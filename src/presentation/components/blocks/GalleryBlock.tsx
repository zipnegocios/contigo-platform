import type { GalleryBlockData } from '@/types/pageBlocks'
import { ProjectGallery } from '@/presentation/components/ProjectGallery'

interface GalleryBlockProps { data: GalleryBlockData }

export function GalleryBlock({ data }: GalleryBlockProps) {
  if (data.items.length === 0) return null
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <ProjectGallery items={data.items} />
    </section>
  )
}
