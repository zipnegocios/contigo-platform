'use client'
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import { IconLogo } from '@/presentation/components/IconLogo';

type BrandIconProps = { className?: string; strokeWidth?: number };

function WhatsAppIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function TikTokIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { Icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/contigoconstructions' },
  { Icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/contigoconstructions' },
  { Icon: WhatsAppIcon, label: 'WhatsApp', href: 'https://api.whatsapp.com/send?phone=61406274096' },
  { Icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/contigo-constructions-pty-ltd/' },
  { Icon: TikTokIcon, label: 'TikTok', href: 'https://www.tiktok.com/@contigoconstructions' },
];

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
          <p
            className="text-fluid-xs"
            style={{ color: 'var(--neutral-600)' }}
          >
            ABN: 12 345 678 901
          </p>
        </div>
      </div>
    </footer>
  );
}
