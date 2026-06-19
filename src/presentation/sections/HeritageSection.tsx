'use client'
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BRAND_LOCKUP_VIEWBOX, brandLetterGlyphs, brandSeparatorRects } from '@/presentation/components/brand-lockup-paths';

const HIDDEN_TRANSFORM = 'translate(-20%, 100%) rotateX(-80deg)';
const REVEALED_TRANSFORM = 'translate(0, 0) rotateX(0)';
const HIDDEN_COLOR = '#3A3028';
const REVEALED_COLOR = '#E3C064';

export default function HeritageSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Symmetric in/out: the trigger spans exactly one section-height of
      // scroll (top-at-center -> bottom-at-center), so the section is fully
      // revealed exactly when it's vertically centered (the timeline
      // midpoint), then unwinds in mirror as it continues toward exit.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
        },
      });

      const HALF = 2;
      // Letter stagger + each letter's own tween must fully resolve *within*
      // HALF, otherwise the reveal is still mid-flight when the exit phase
      // (scheduled to start at HALF) kicks in, and the two fight each other.
      const LETTER_DURATION = 1.2;
      const LETTER_STAGGER_SPREAD = 0.7; // total spread across all letters
      const letters = '.flip-letter-shape';
      const separator = '.flip-separator-group';

      // ── Enter (0 -> HALF): section approaches center, brand lockup assembles ──
      tl.from('.flip-text-block.left', { x: -50, opacity: 0, duration: HALF }, 0);
      tl.from('.flip-text-block.right', { x: 50, opacity: 0, duration: HALF }, 0);
      tl.to(
        letters,
        {
          color: REVEALED_COLOR,
          transform: REVEALED_TRANSFORM,
          duration: LETTER_DURATION,
          stagger: { from: 'end', amount: LETTER_STAGGER_SPREAD },
        },
        0
      );
      tl.to(separator, { scaleX: 1, duration: HALF, ease: 'none' }, 0);

      // ── Exit (HALF -> 2*HALF): mirror image of the entrance, unwinding as
      // the section leaves center heading toward the bottom of the viewport ──
      tl.to('.flip-text-block.left', { x: -50, opacity: 0, duration: HALF }, HALF);
      tl.to('.flip-text-block.right', { x: 50, opacity: 0, duration: HALF }, HALF);
      tl.to(
        letters,
        {
          color: HIDDEN_COLOR,
          transform: HIDDEN_TRANSFORM,
          duration: LETTER_DURATION,
          stagger: { from: 'start', amount: LETTER_STAGGER_SPREAD },
        },
        HALF
      );
      tl.to(separator, { scaleX: 0, duration: HALF, ease: 'none' }, HALF);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="heritage"
      ref={sectionRef}
      className="flip-section"
    >
      <div className="flip-container flex-wrap lg:flex-nowrap">
        {/* Left text block */}
        <div className="flip-text-block left w-full lg:w-auto text-center lg:text-left mb-8 lg:mb-0">
          <h2 className="mb-4">Built on Tradition</h2>
          <p>
            Our craftsmanship honors the time-tested methods of Australian
            building heritage while embracing modern precision.
          </p>
        </div>

        {/* Center brand lockup — exact vector letterforms from the logo file */}
        <div className="flip-word">
          <svg viewBox={BRAND_LOCKUP_VIEWBOX} aria-label="Contigo Constructions Pty">
            {brandLetterGlyphs.map((glyph, i) =>
              glyph.type === 'path' ? (
                <path key={i} className="flip-letter-shape" fill="currentColor" d={glyph.d} />
              ) : (
                <polygon key={i} className="flip-letter-shape" fill="currentColor" points={glyph.points} />
              )
            )}
            <g className="flip-separator-group">
              {brandSeparatorRects.map((r, i) => (
                <rect key={i} fill="var(--brand-gold)" x={r.x} y={r.y} width={r.width} height={r.height} />
              ))}
            </g>
          </svg>
        </div>

        {/* Right text block */}
        <div className="flip-text-block right w-full lg:w-auto text-center lg:text-right mt-8 lg:mt-0">
          <h2 className="mb-4">Future-Ready</h2>
          <p>
            Every project we undertake is engineered for longevity,
            sustainability, and the demands of tomorrow.
          </p>
        </div>
      </div>
    </section>
  );
}
