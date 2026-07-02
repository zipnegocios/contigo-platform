'use client';
import { useScrollReveal } from '@/presentation/hooks/useScrollReveal';
import { buttonVariants } from '@/presentation/design-system/components/atoms';
import MarqueeServiceRow from './services/MarqueeServiceRow';
import ServiceRowMobile from './services/ServiceRowMobile';
import { splitIntoRows } from './services/marqueeGeometry';

export interface ServiceCardData {
  slug: string;
  name: string;
  imageUrl: string;
  categorySlug: string;
  categoryName: string;
}

interface ServicesSectionProps {
  /** All active/published services, already shuffled server-side. */
  services: ServiceCardData[];
}

const ROW_COUNT = 3;

export default function ServicesSection({ services }: ServicesSectionProps) {
  const headerRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.8, start: 'top 80%' });

  // Distribute the shuffled services across exactly 3 rows. Round-robin keeps
  // the rows balanced regardless of the total service count, and each service
  // appears in exactly one row (carrying its own category for the flip + link).
  const rows = splitIntoRows(services, ROW_COUNT);

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

      {/* 3 service rows */}
      <div className="flex flex-col gap-4 md:gap-6">
        {rows.map((rowItems, idx) => (
          <div key={idx}>
            {/* Desktop: autonomous marquee */}
            <div className="hidden lg:block">
              <MarqueeServiceRow items={rowItems} direction={idx % 2 === 0 ? -1 : 1} />
            </div>
            {/* Mobile: scroll-snap row — always in DOM for SEO */}
            <div className="lg:hidden">
              <ServiceRowMobile items={rowItems} />
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <a href="/services" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
          View All Services
        </a>
      </div>
    </section>
  );
}
