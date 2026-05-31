import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    name: 'Seaton Residence',
    category: 'New Home',
    image: '/assets/project-seatons.jpg',
  },
  {
    name: 'Henley Beach Extension',
    category: 'Extension',
    image: '/assets/project-henley.jpg',
  },
  {
    name: 'Glenelg Renovation',
    category: 'Renovation',
    image: '/assets/project-glenelg.jpg',
  },
  {
    name: 'Prospect Commercial',
    category: 'Commercial',
    image: '/assets/project-prospect.jpg',
  },
  {
    name: 'Adelaide Heritage Restore',
    category: 'Restoration',
    image: '/assets/project-heritage.jpg',
  },
];

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header reveal
      gsap.from(headerRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });

      // Accordion panels slide up with stagger
      const panels = listRef.current?.querySelectorAll('.accordion-item');
      if (panels) {
        gsap.from(panels, {
          y: 60,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: listRef.current,
            start: 'top 80%',
          },
        });
      }

      // Meta line reveal
      gsap.from(metaRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: metaRef.current,
          start: 'top 90%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--monolith-concrete)' }}
    >
      {/* Header */}
      <div ref={headerRef}>
        <span
          className="label block mb-4"
          style={{ color: 'var(--monolith-slate)' }}
        >
          PORTFOLIO
        </span>
        <h2 style={{ color: 'var(--monolith-ink)' }}>Featured Projects</h2>
      </div>

      {/* Accordion */}
      <ul ref={listRef} className="accordion-list">
        {projects.map((project, i) => (
          <li key={i} className="accordion-item">
            <div
              className="accordion-img"
              style={{ backgroundImage: `url(${project.image})` }}
            />
            <a href="#" className="accordion-link" onClick={(e) => e.preventDefault()}>
              <p className="accordion-title">{project.name}</p>
              <p className="accordion-desc">{project.category}</p>
            </a>
          </li>
        ))}
      </ul>

      {/* Meta */}
      <div
        ref={metaRef}
        className="data-text mt-8 text-sm"
        style={{ color: 'var(--monolith-slate)' }}
      >
        Project count: 47 | Locations: Adelaide Metro | Est. 2015
      </div>
    </section>
  );
}
