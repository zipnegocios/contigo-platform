import type { HeroBlockData } from '@/types/pageBlocks'

interface HeroBlockProps { data: HeroBlockData }

export function HeroBlock({ data }: HeroBlockProps) {
  const isVideo = data.videoUrl && /\.(mp4|webm|ogg|mov)$/i.test(data.videoUrl)
  const overlay = `rgba(0,0,0,${data.overlayOpacity / 100})`

  return (
    <section className="relative w-full" style={{ minHeight: '70vh', maxHeight: '600px' }}>
      {isVideo ? (
        <video
          src={data.videoUrl}
          poster={data.imageUrl || undefined}
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : data.imageUrl ? (
        <img
          src={data.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#2D2924]" />
      )}
      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${overlay} 0%, transparent 60%)` }} />
      <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-10 max-w-4xl mx-auto" style={{ minHeight: '70vh' }}>
        {data.title && (
          <h1
            className="text-fluid-3xl font-semibold mb-2"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0', lineHeight: 1.2 }}
          >
            {data.title}
          </h1>
        )}
        {data.subtitle && (
          <p className="text-fluid-base" style={{ color: 'rgba(250,246,240,0.85)' }}>
            {data.subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
