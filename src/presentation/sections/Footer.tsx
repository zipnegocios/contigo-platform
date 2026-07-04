'use client'
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { IconLogo } from '@/presentation/components/IconLogo';
import { SOCIAL_LINKS } from '@/presentation/components/social-links';

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
        backgroundColor: 'var(--petrol-800)',
        padding: '3rem clamp(1.5rem, 4vw, 4rem)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Left - Logo */}
          <div className="flex justify-center md:justify-start">
            <IconLogo
              className="h-[3rem] w-auto"
              style={{ color: 'var(--neutral-50)' }}
              label="Contigo Constructions"
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
                className="text-fluid-sm transition-colors relative group"
                style={{ color: 'var(--neutral-50)' }}
              >
                {item.label}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                  style={{ backgroundColor: 'var(--contigo-primary)' }}
                />
              </button>
            ))}
          </div>

          {/* Right - Social icons */}
          <div className="flex justify-center md:justify-end gap-4">
            {SOCIAL_LINKS.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors"
                style={{
                  color: 'var(--neutral-50)',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--contigo-primary)';
                  e.currentTarget.style.borderColor = 'var(--contigo-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--neutral-50)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                aria-label={label}
              >
                <Icon
                  className="w-[clamp(1.125rem,2vw,1.375rem)] h-[clamp(1.125rem,2vw,1.375rem)]"
                  strokeWidth={1.5}
                />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid var(--neutral-700)' }}
        >
          <p
            className="text-fluid-xs"
            style={{ color: 'var(--neutral-600)' }}
          >
            &copy; 2025 Contigo Constructions Pty Ltd. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 items-center sm:items-end text-right">
            <p
              className="text-fluid-xs"
              style={{ color: 'var(--neutral-600)' }}
            >
              ABN: 25 698 028 394
            </p>
            <p
              className="text-fluid-xs"
              style={{ color: 'var(--neutral-600)' }}
            >
              BLD Licence No. 357596
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
