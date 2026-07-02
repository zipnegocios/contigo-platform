'use client'

import FlippableServiceCard from './FlippableServiceCard'
import type { ServiceCardData } from '../ServicesSection'

interface ServiceRowMobileProps {
  items: ServiceCardData[]
}

export default function ServiceRowMobile({ items }: ServiceRowMobileProps) {
  return (
    <div
      className="flex gap-4 overflow-x-auto px-4 pb-1"
      style={{
        scrollSnapType: 'x proximity',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
      }}
    >
      {items.map((item) => (
        <FlippableServiceCard
          key={item.slug}
          slug={item.slug}
          name={item.name}
          imageUrl={item.imageUrl}
          categorySlug={item.categorySlug}
          categoryName={item.categoryName}
          className="service-card-mobile"
          style={{ scrollSnapAlign: 'start' }}
        />
      ))}
    </div>
  )
}
