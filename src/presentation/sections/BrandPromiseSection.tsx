'use client'
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MoveRight } from 'lucide-react';
import { BRAND_LOCKUP_VIEWBOX, brandLetterGlyphs, brandSeparatorRects } from '@/presentation/components/brand-lockup-paths';

const REVEALED_COLOR = '#E3C064';
const HIDDEN_COLOR = '#3A3028';
const OPEN_CLIP = 'inset(0 0 0 0)';

export default function BrandPromiseSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      gsap.set('.flip-letter-shape', { opacity: 1, transform: 'none', filter: 'none', color: REVEALED_COLOR });
      gsap.set('.flip-separator-bar', { clipPath: OPEN_CLIP });
      gsap.set(['.flip-text-block.left', '.flip-text-block.right'], { opacity: 1, x: 0 });
      return;
    }

    // Narrow viewports: .flip-text-block already sits close to the section's
    // padded edge (see globals.css .flip-section padding: 10vh 4vw), and this
    // timeline is scrubbed to scroll position — not a one-off transient — so
    // the full -50/+50 desktop travel held a real horizontal overflow for as
    // long as the user scrolled through the section's enter/exit range. Use a
    // smaller travel distance on mobile so the block never leaves the viewport.
    const isNarrow = window.matchMedia('(max-width: 640px)').matches;
    const enterX = isNarrow ? 20 : 50;
    const exitX = isNarrow ? 12 : 20;

    const ctx = gsap.context(() => {
      // Symmetric in/out: the trigger spans exactly one section-height of
      // scroll (top-at-center -> bottom-at-center), so the section is fully
      // assembled exactly when it's vertically centered (the timeline
      // midpoint), then disassembles in mirror as it continues toward exit.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
        },
      });

      const HALF = 2;
      const letters = '.flip-letter-shape';
      const leftBar = '.flip-separator-bar:not(.flip-separator-bar--right)';
      const rightBar = '.flip-separator-bar--right';

      // ── Enter: the rule draws outward first (the foundation), then the
      // letterforms materialize on top of it (the structure) — a small
      // construction narrative, not just a generic reveal. Letters lift +
      // sharpen into focus rather than flip, with each one's own stagger
      // window fitted inside HALF so it fully resolves before exit begins. ──
      tl.from('.flip-text-block.left', { x: -enterX, opacity: 0, filter: 'blur(6px)', duration: HALF, ease: 'power3.out' }, 0);
      tl.from('.flip-text-block.right', { x: enterX, opacity: 0, filter: 'blur(6px)', duration: HALF, ease: 'power3.out' }, 0);

      tl.to(leftBar, { clipPath: OPEN_CLIP, duration: 1, ease: 'power2.out' }, 0);
      tl.to(rightBar, { clipPath: OPEN_CLIP, duration: 1, ease: 'power2.out' }, 0);

      tl.to(
        letters,
        {
          opacity: 1,
          color: REVEALED_COLOR,
          transform: 'translateY(0) scale(1)',
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
          stagger: { from: 'start', amount: 0.55 },
        },
        0.3
      );

      // ── Exit: deliberately subtler than the entrance — smaller lift,
      // lighter blur, faster — the section is leaving, not re-arriving. ──
      tl.to('.flip-text-block.left', { x: -exitX, opacity: 0, filter: 'blur(4px)', duration: 1.2, ease: 'power2.in' }, HALF);
      tl.to('.flip-text-block.right', { x: exitX, opacity: 0, filter: 'blur(4px)', duration: 1.2, ease: 'power2.in' }, HALF);

      tl.to(
        letters,
        {
          opacity: 0,
          color: HIDDEN_COLOR,
          transform: 'translateY(-8px) scale(0.98)',
          filter: 'blur(4px)',
          duration: 0.6,
          ease: 'power2.in',
          stagger: { from: 'end', amount: 0.35 },
        },
        HALF
      );

      tl.to(leftBar, { clipPath: 'inset(0 0 0 100%)', duration: 0.8, ease: 'power2.in' }, HALF + 0.5);
      tl.to(rightBar, { clipPath: 'inset(0 100% 0 0)', duration: 0.8, ease: 'power2.in' }, HALF + 0.5);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="brand-promise"
      ref={sectionRef}
      className="flip-section"
    >
      <div className="flip-container flex-wrap lg:flex-nowrap">
        {/* Left text block */}
        <div className="flip-text-block left w-full lg:w-auto text-center lg:text-left mb-8 lg:mb-0">
          <h2 className="mb-4">Built With You</h2>
          <p>
            At Contigo Constructions, we&apos;re with you every step of the way.
            We believe in clear communication, personalized service, and
            quality results that reflect the needs and vision of every
            client. Our commitment is to create functional, long-lasting
            spaces that families can enjoy for years to come.
          </p>
        </div>

        {/* Center brand lockup — exact vector letterforms from the logo file */}
        <div className="flex flex-col items-center gap-6">
          <div className="flip-word">
            <svg viewBox={BRAND_LOCKUP_VIEWBOX} aria-label="Contigo Constructions Pty">
              {brandLetterGlyphs.map((glyph, i) =>
                glyph.type === 'path' ? (
                  <path key={i} className="flip-letter-shape" fill="currentColor" d={glyph.d} />
                ) : (
                  <polygon key={i} className="flip-letter-shape" fill="currentColor" points={glyph.points} />
                )
              )}
              {brandSeparatorRects.map((r, i) => (
                <rect
                  key={i}
                  className={i === 0 ? 'flip-separator-bar' : 'flip-separator-bar flip-separator-bar--right'}
                  fill="var(--brand-gold)"
                  x={r.x}
                  y={r.y}
                  width={r.width}
                  height={r.height}
                />
              ))}
            </svg>
          </div>

          <Link
            href="/about"
            className="group inline-flex items-center gap-2 text-fluid-sm relative"
            style={{ color: 'var(--brand-gold)' }}
          >
            <span className="relative">
              Get to Know Us
              <span
                className="absolute -bottom-1 left-0 w-full h-[1px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ backgroundColor: 'var(--brand-gold)' }}
              />
            </span>
            <MoveRight
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.5}
            />
          </Link>
        </div>

        {/* Right text block */}
        <div className="flip-text-block right w-full lg:w-auto text-center lg:text-right mt-8 lg:mt-0">
          <h2 className="mb-4">Built to Last</h2>
          <p>
            Quality, trust, and attention to detail are at the heart of
            everything we do. We strive to deliver lasting results and a
            positive experience for our clients, because building is about
            more than completing a project — it&apos;s about creating spaces
            designed for everyday living and for the future.
          </p>
        </div>
      </div>
    </section>
  );
}
