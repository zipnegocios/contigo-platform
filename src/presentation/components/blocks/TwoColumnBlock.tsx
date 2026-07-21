import type { TwoColumnBlockData } from '@/types/pageBlocks'
import { cfImage } from '@/presentation/lib/cloudflareImage'

interface TwoColumnBlockProps { data: TwoColumnBlockData }

export function TwoColumnBlock({ data }: TwoColumnBlockProps) {
  const imgEl = data.imageUrl ? (
    <div className="flex-1 min-h-[300px]">
      <img src={cfImage(data.imageUrl, { width: 1200 })} alt="" className="w-full h-full object-cover rounded-lg" />
    </div>
  ) : null

  const textEl = (
    <div className="flex-1 flex flex-col justify-center py-4">
      {data.title && (
        <h2 className="text-fluid-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
          {data.title}
        </h2>
      )}
      <p className="text-fluid-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#6B6560' }}>{data.text}</p>
    </div>
  )

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-10 items-center">
        {data.imageSide === 'left' ? (
          <>{imgEl}{textEl}</>
        ) : (
          <>{textEl}{imgEl}</>
        )}
      </div>
    </section>
  )
}
