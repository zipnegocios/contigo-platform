import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  y?: number;
  x?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  start?: string;
  childSelector?: string;
}

export function useScrollReveal<T extends HTMLElement>(options: ScrollRevealOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const {
      y = 30,
      x = 0,
      duration = 0.8,
      stagger = 0.1,
      delay = 0,
      start = 'top 85%',
      childSelector,
    } = options;

    const targets = childSelector ? el.querySelectorAll(childSelector) : el;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(targets, { opacity: 1, y: 0, x: 0 });
      return;
    }

    gsap.set(targets, { opacity: 0, y, x });

    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      x: 0,
      duration,
      stagger,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: 'play none none none',
      },
    });

    return () => {
      tween.kill();
    };
  }, []);

  return ref;
}
