'use client'
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, Facebook, Linkedin } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(footerRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 90%',
        },
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      ref={footerRef}
      className="w-full page-padding"
      style={{
        backgroundColor: 'var(--heritage-dark)',
        padding: '3rem clamp(1.5rem, 4vw, 4rem)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Left - Logo */}
          <div className="flex justify-center md:justify-start">
            <img
              src="/assets/isotipo.png"
              alt="Contigo Constructions"
              className="h-12 w-auto"
              style={{ filter: 'brightness(1)' }}
            />
          </div>

          {/* Center - Nav links */}
          <div className="flex justify-center gap-6 flex-wrap">
            {[
              { label: 'Services', id: 'services' },
              { label: 'Projects', id: 'projects' },
              { label: 'About', id: 'heritage' },
              { label: 'Contact', id: 'contact' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm transition-colors relative group"
                style={{ color: 'var(--heritage-sand)' }}
              >
                {item.label}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                  style={{ backgroundColor: 'var(--brand-gold)' }}
                />
              </button>
            ))}
          </div>

          {/* Right - Social icons */}
          <div className="flex justify-center md:justify-end gap-4">
            {[
              { Icon: Instagram, label: 'Instagram' },
              { Icon: Facebook, label: 'Facebook' },
              { Icon: Linkedin, label: 'LinkedIn' },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="p-2 rounded-full transition-colors"
                style={{
                  color: 'var(--heritage-sand)',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--brand-gold)';
                  e.currentTarget.style.borderColor = 'var(--brand-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--heritage-sand)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                aria-label={label}
              >
                <Icon size={18} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid var(--heritage-charcoal)' }}
        >
          <p
            className="text-xs"
            style={{ color: 'var(--heritage-muted)' }}
          >
            &copy; 2025 Contigo Constructions Pty Ltd. All rights reserved.
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--heritage-muted)' }}
          >
            ABN: 12 345 678 901
          </p>
        </div>
      </div>
    </footer>
  );
}
