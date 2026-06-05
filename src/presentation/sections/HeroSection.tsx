'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import dynamic from 'next/dynamic'

const ParticleScene = dynamic(() => import('../components/ParticleScene'), {
  ssr: false,
  loading: () => <div style={{ position: 'absolute', inset: 0, background: '#1E1A16' }} />,
})

export default function HeroSection() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const overlineRef = useRef<HTMLSpanElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.8 });

    tl.to(overlineRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
    })
      .to(
        headlineRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.3'
      )
      .to(
        subtitleRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
        },
        '-=0.4'
      )
      .to(
        ctaRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
        },
        '-=0.3'
      );

    return () => {
      tl.kill();
    };
  }, []);

  // Scroll-driven fade out
  useEffect(() => {
    const onScroll = () => {
      if (!overlayRef.current) return;
      const scrollProgress = Math.min(window.scrollY / window.innerHeight, 1);
      overlayRef.current.style.opacity = String(1 - scrollProgress);
      overlayRef.current.style.transform = `translateY(${-scrollProgress * 50}px)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
    >
      {/* 3D Particle Scene */}
      <ParticleScene />

      {/* Gradient overlay at bottom */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: '15%',
          background: 'linear-gradient(to bottom, transparent, var(--atelier-ivory))',
          zIndex: 1,
        }}
      />

      {/* Text overlay */}
      <div
        ref={overlayRef}
        className="absolute bottom-0 left-0 w-full page-padding"
        style={{ zIndex: 2, paddingBottom: 'clamp(3rem, 8vh, 6rem)' }}
      >
        <span
          ref={overlineRef}
          className="label block mb-4"
          style={{
            color: '#E8D5A3',
            opacity: 0,
            transform: 'translateY(20px)',
          }}
        >
          ADELAIDE, SOUTH AUSTRALIA
        </span>

        <h1
          ref={headlineRef}
          style={{
            color: '#FAF6F0',
            opacity: 0,
            transform: 'translateY(20px)',
            maxWidth: '800px',
          }}
        >
          Building Dreams
          <br />
          Together
        </h1>

        <p
          ref={subtitleRef}
          className="mt-6 text-base md:text-lg"
          style={{
            color: 'rgba(250, 246, 240, 0.8)',
            maxWidth: '480px',
            opacity: 0,
            transform: 'translateY(20px)',
            lineHeight: 1.6,
          }}
        >
          We don&apos;t build for you, we build with you. Premium construction
          services tailored to your vision.
        </p>

        <div
          ref={ctaRef}
          className="flex flex-wrap gap-4 mt-8"
          style={{ opacity: 0, transform: 'translateY(20px)' }}
        >
          <button
            onClick={() =>
              document
                .getElementById('services')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            className="btn-secondary"
            style={{ borderColor: 'var(--brand-gold)', color: 'var(--brand-gold)' }}
          >
            Our Services
          </button>
          <button
            onClick={() =>
              document
                .getElementById('contact')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            className="btn-primary"
          >
            Get a Quote
          </button>
        </div>
      </div>
    </section>
  );
}
