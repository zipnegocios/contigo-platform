'use client'

import FlippableServiceCard from './FlippableServiceCard'

interface ServiceRowMobileProps {
  categorySlug: string
  categoryName: string
  items: { slug: string; name: string; imageUrl: string }[]
}

export default function ServiceRowMobile({
  categorySlug,
  categoryName,
  items,
}: ServiceRowMobileProps) {
  return (
    <div
      className="flex gap-4 overflow-x-auto px-4"
      style={{
        scrollSnapType: 'x proximity',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
      }}
    >
      {items.map((item) => (
        <div
          key={item.slug}
          className="shrink-0"
          style={{
            scrollSnapAlign: 'start',
            width: 'min(78vw, 320px)',
            aspectRatio: '4 / 5',
          }}
        >
          <FlippableServiceCard
            slug={item.slug}
            name={item.name}
            imageUrl={item.imageUrl}
            categorySlug={categorySlug}
            categoryName={categoryName}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ))}
    </div>
  )
}
