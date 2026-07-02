'use client';
import { useScrollReveal } from '@/presentation/hooks/useScrollReveal';
import { buttonVariants } from '@/presentation/design-system/components/atoms';
import MarqueeServiceRow from './services/MarqueeServiceRow';
import ServiceRowMobile from './services/ServiceRowMobile';

export interface ServiceRowData {
  categorySlug: string;
  categoryName: string;
  items: { slug: string; name: string; imageUrl: string }[];
}

interface ServicesSectionProps {
  categories: ServiceRowData[];
}

export default function ServicesSection({ categories }: ServicesSectionProps) {
  const headerRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.8, start: 'top 80%' });

  return (
    <section id="services" className="section-gap">
      {/* Header */}
      <div ref={headerRef} className="text-center mb-12 page-padding">
        <span
          className="label block mb-4"
          style={{ color: 'var(--contigo-primary)' }}
        >
          WHAT WE DO
        </span>
        <h2 style={{ color: 'var(--neutral-800)' }}>Our Services</h2>
      </div>

      {/* Service rows */}
      {categories.map((category, idx) => (
        <div key={category.categorySlug} className="mb-8">
          {/* Desktop: autonomous marquee */}
          <div className="hidden lg:block">
            <MarqueeServiceRow
              categorySlug={category.categorySlug}
              categoryName={category.categoryName}
              items={category.items}
              direction={idx % 2 === 0 ? -1 : 1}
            />
          </div>
          {/* Mobile: scroll-snap row — always in DOM for SEO */}
          <div className="lg:hidden">
            <ServiceRowMobile
              categorySlug={category.categorySlug}
              categoryName={category.categoryName}
              items={category.items}
            />
          </div>
        </div>
      ))}

      {/* CTA */}
      <div className="text-center mt-12">
        <a href="/services" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
          View All Services
        </a>
      </div>
    </section>
  );
}
