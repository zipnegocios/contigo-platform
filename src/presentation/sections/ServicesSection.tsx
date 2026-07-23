'use client';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/presentation/hooks/useScrollReveal';
import MarqueeServiceRow from './services/MarqueeServiceRow';
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

const ROW_COUNT = 2;

export default function ServicesSection({ services }: ServicesSectionProps) {
  const headerRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.8, start: 'top 80%' });

  // Distribute the shuffled services across exactly 2 rows. Round-robin keeps
  // the rows balanced regardless of the total service count, and each service
  // appears in exactly one row (carrying its own category for the flip + link).
  const rows = splitIntoRows(services, ROW_COUNT);

  // Section-wide "which card is open" — only one card (across all rows,
  // desktop and mobile alike) may be flipped at a time, so opening a new one
  // implicitly closes whatever was open. Tracked as (rowIndex, loopKey) so
  // only the row that actually owns the open card pauses — the other two
  // keep scrolling. loopKey alone isn't enough to identify the owning row
  // without re-deriving it from the string, so we keep rowIndex alongside it.
  const [openCard, setOpenCard] = useState<{ rowIndex: number; loopKey: string } | null>(null);
  const handleCardToggle = (rowIndex: number, loopKey: string) => {
    setOpenCard((prev) =>
      prev && prev.rowIndex === rowIndex && prev.loopKey === loopKey ? null : { rowIndex, loopKey },
    );
  };

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

      {/* 2 service rows — same autonomous marquee behavior at every viewport size.
          Rows with no items are skipped: an empty row has nothing to loop and
          would otherwise render a marquee with no content. */}
      <div className="flex flex-col gap-4 md:gap-6">
        {rows.map((rowItems, idx) =>
          rowItems.length === 0 ? null : (
            <MarqueeServiceRow
              key={idx}
              items={rowItems}
              direction={idx % 2 === 0 ? -1 : 1}
              openCardKey={openCard?.rowIndex === idx ? openCard.loopKey : null}
              onCardToggle={(loopKey) => handleCardToggle(idx, loopKey)}
              isPaused={openCard?.rowIndex === idx}
            />
          ),
        )}
      </div>

      {/* CTA — brand-gold button with a light sweep + lift on hover */}
      <div className="text-center mt-14">
        <a
          href="/services"
          className="service-cta-gold group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-9 py-4 text-fluid-sm font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: 'linear-gradient(135deg, var(--gold-400, #E2C063) 0%, var(--gold-600, #C9A04E) 100%)',
            color: 'var(--petrol-950, #051E27)',
            fontFamily: 'var(--font-alegreya-sans)',
          }}
        >
          {/* Light sweep */}
          <span
            aria-hidden
            className="service-cta-sweep pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-white/35 blur-md transition-[left] duration-700 ease-out group-hover:left-[140%]"
          />
          <span className="relative z-10">View All Services</span>
          <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
