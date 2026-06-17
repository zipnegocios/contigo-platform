'use client'
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function BrandBar() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.brand-logo', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
        },
      });

      gsap.from(ruleRef.current, {
        scaleX: 0,
        duration: 0.4,
        ease: 'power3.out',
        delay: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="w-full flex flex-col items-center justify-center"
      style={{
        backgroundColor: 'var(--neutral-50)',
        padding: '3rem 0',
      }}
    >
      <div className="brand-logo">
        <Image
          src="/assets/logo-principal.png"
          alt="Contigo Constructions"
          width={200}
          height={60}
          style={{ width: 'auto', height: '80px' }}
          priority
        />
      </div>
      <div
        ref={ruleRef}
        className="gold-rule mt-4"
        style={{ transformOrigin: 'center' }}
      />
    </div>
  );
}
