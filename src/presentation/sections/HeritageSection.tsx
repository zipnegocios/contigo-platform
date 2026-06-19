'use client'
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Renders one line of the center brand lockup as individually
// flip-animated letters, matching the original HERITAGE behaviour.
// Spaces are rendered as non-breaking so they don't collapse as
// inline-block spans.
function renderFlipWord(word: string, keyPrefix: string) {
  return word.split('').map((char, i) => (
    <span key={`${keyPrefix}-${i}`} className="flip-letter">
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));
}

export default function HeritageSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          // The flip resolves fully (rotateX(0), straight, gold) exactly
          // when the section is vertically centered in the viewport —
          // not at an arbitrary scroll distance.
          start: 'top center',
          end: 'center center',
          scrub: 1,
        },
      });

      // Text blocks slide in
      tl.from(
        '.flip-text-block.left',
        {
          x: -50,
          opacity: 0,
          duration: 1,
        },
        0
      );

      tl.from(
        '.flip-text-block.right',
        {
          x: 50,
          opacity: 0,
          duration: 1,
        },
        0
      );

      // Letters flip
      tl.to(
        '.flip-letter',
        {
          color: '#E3C064',
          transform: 'translate(0, 0) rotateX(0)',
          duration: 2,
          stagger: {
            from: 'end',
            each: 0.05,
          },
        },
        0
      );

      // Separator line between "Contigo" and "Constructions Pty"
      // reveals in sync with the letters, finishing fully drawn
      // (scaleX: 1, perfectly straight) at the same point they do.
      tl.to(
        '.flip-separator',
        {
          scaleX: 1,
          duration: 2,
          ease: 'none',
        },
        0
      );
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

        {/* Center flip word — brand lockup */}
        <div className="flip-word" aria-label="Contigo Constructions Pty">
          <div className="flip-line flip-line--primary">
            {renderFlipWord('Contigo', 'primary')}
          </div>

          <span className="flip-separator" aria-hidden="true" />

          <div className="flip-line flip-line--secondary">
            {renderFlipWord('Constructions Pty', 'secondary')}
          </div>
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
