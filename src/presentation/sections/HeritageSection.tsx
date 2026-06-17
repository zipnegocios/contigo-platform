'use client'
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const LETTERS = 'HERITAGE'.split('');

export default function HeritageSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top center',
          end: '+=800',
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

        {/* Center flip word */}
        <div className="flip-word" aria-label="HERITAGE">
          {LETTERS.map((letter, i) => (
            <span key={i} className="flip-letter">
              {letter}
            </span>
          ))}
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
