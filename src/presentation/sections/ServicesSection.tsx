'use client'
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const serviceImages = [
  '/assets/service-new-home.jpg',
  '/assets/service-extension.jpg',
  '/assets/service-renovation.jpg',
  '/assets/service-carpentry.jpg',
  '/assets/service-cladding.jpg',
  '/assets/service-painting.jpg',
];

const serviceImages2 = [
  '/assets/service-gyprock.jpg',
  '/assets/service-landscaping.jpg',
  '/assets/service-rendering.jpg',
  '/assets/service-plaster.jpg',
  '/assets/service-renovation.jpg',
  '/assets/service-extension.jpg',
];

const serviceImages3 = [
  '/assets/service-carpentry.jpg',
  '/assets/service-cladding.jpg',
  '/assets/service-new-home.jpg',
  '/assets/service-painting.jpg',
  '/assets/service-gyprock.jpg',
  '/assets/service-landscaping.jpg',
];

const serviceNames = [
  'New Home Building',
  'Home Extensions',
  'Home Renovations',
  'Carpentry',
  'Cladding',
  'Painting',
];

const serviceNames2 = [
  'Gyprock Fixing',
  'Landscaping',
  'Rendering',
  'Venetian Plaster',
  'Renovations',
  'Extensions',
];

const serviceNames3 = [
  'Carpentry',
  'Cladding',
  'New Homes',
  'Painting',
  'Gyprock',
  'Landscaping',
];

interface ImageStripProps {
  images: string[];
  names: string[];
  index: number;
}

function ImageStrip({ images, names, index }: ImageStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={stripRef} className="parallax-work-item" data-strip-index={index}>
      {images.map((img, i) => (
        <div
          key={`${index}-${i}`}
          className="parallax-work-img group relative"
          style={{ backgroundImage: `url(${img})` }}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end p-4">
            <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
              {names[i]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header reveal
      gsap.from(headerRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });

      // Wrapper scale + fade
      gsap.from(wrapperRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top 85%',
        },
      });

      // Parallax strips
      const strips = gsap.utils.toArray<HTMLDivElement>('.parallax-work-item');
      strips.forEach((item, idx) => {
        const direction = idx % 2 === 0 ? -1 : 1;
        const scrollAmount = (item.scrollWidth - window.innerWidth) * direction;

        gsap.to(item, {
          x: scrollAmount,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
      });

      // CTA reveal
      gsap.from(ctaRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 90%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="parallax-work-section"
    >
      {/* Header */}
      <div ref={headerRef} className="text-center mb-12 page-padding">
        <span
          className="label block mb-4"
          style={{ color: 'var(--brand-gold)' }}
        >
          WHAT WE DO
        </span>
        <h2 style={{ color: 'var(--atelier-ink)' }}>Our Services</h2>
      </div>

      {/* Parallax Gallery */}
      <div ref={wrapperRef} className="parallax-work-wrapper">
        <ImageStrip images={serviceImages} names={serviceNames} index={0} />
        <ImageStrip images={serviceImages2} names={serviceNames2} index={1} />
        <ImageStrip images={serviceImages3} names={serviceNames3} index={2} />
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <Link
          ref={ctaRef}
          href="/services"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors group"
          style={{ color: 'var(--atelier-ink)' }}
        >
          View All Services
          <span
            className="block h-[1px] w-0 group-hover:w-12 transition-all duration-300"
            style={{ backgroundColor: 'var(--brand-gold)' }}
          />
        </Link>
      </div>
    </section>
  );
}
