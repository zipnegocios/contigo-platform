import type { RichTextBlockData } from '@/types/pageBlocks'

interface RichTextBlockProps { data: RichTextBlockData }

export function RichTextBlock({ data }: RichTextBlockProps) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div
        className="prose prose-lg max-w-none"
        style={{ color: '#3D3530', fontFamily: 'var(--font-cormorant)' }}
        dangerouslySetInnerHTML={{ __html: data.html }}
      />
    </section>
  )
}
