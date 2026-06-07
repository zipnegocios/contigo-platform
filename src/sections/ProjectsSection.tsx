import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  location?: string;
  coverImageUrl: string;
}

const FALLBACK_PROJECTS: ProjectItem[] = [
  { id: '1', slug: 'seaton-residence', title: 'Seaton Residence', category: 'New Home', coverImageUrl: '/assets/project-seatons.jpg' },
  { id: '2', slug: 'henley-beach-extension', title: 'Henley Beach Extension', category: 'Extension', coverImageUrl: '/assets/project-henley.jpg' },
  { id: '3', slug: 'glenelg-renovation', title: 'Glenelg Renovation', category: 'Renovation', coverImageUrl: '/assets/project-glenelg.jpg' },
  { id: '4', slug: 'prospect-commercial', title: 'Prospect Commercial', category: 'Commercial', coverImageUrl: '/assets/project-prospect.jpg' },
  { id: '5', slug: 'adelaide-heritage-restore', title: 'Adelaide Heritage Restore', category: 'Restoration', coverImageUrl: '/assets/project-heritage.jpg' },
];

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  const [projects, setProjects] = useState<ProjectItem[]>(FALLBACK_PROJECTS);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    fetch('/api/projects/featured')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setProjects(data);
      })
      .catch(() => {});
  }, []);

  const isCarousel = projects.length > 5;

  useEffect(() => {
    const ctx = gsap.context(() => {
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

      if (!isCarousel) {
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
      }

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
  }, [isCarousel, projects.length]);

  function prev() {
    setCarouselIndex((i) => (i - 1 + projects.length) % projects.length);
  }

  function next() {
    setCarouselIndex((i) => (i + 1) % projects.length);
  }

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--monolith-concrete)' }}
    >
      {/* Header */}
      <div ref={headerRef}>
        <span className="label block mb-4" style={{ color: 'var(--monolith-slate)' }}>
          PORTFOLIO
        </span>
        <h2 style={{ color: 'var(--monolith-ink)' }}>Featured Projects</h2>
      </div>

      {isCarousel ? (
        /* ── Carousel (>5 projects) ─────────────────────────────────────────── */
        <div ref={carouselRef} className="relative mt-8">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
            >
              {projects.map((project) => (
                <div key={project.id} className="min-w-full">
                  <a
                    href={`/projects/${project.slug}`}
                    className="block relative overflow-hidden"
                    style={{ height: '420px' }}
                  >
                    <img
                      src={project.coverImageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                      style={{ transition: 'transform 0.6s ease' }}
                    />
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-8"
                      style={{ background: 'linear-gradient(to top, rgba(30,26,22,0.85) 0%, transparent 60%)' }}
                    >
                      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>
                        {project.category}
                      </p>
                      <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}>
                        {project.title}
                      </p>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200"
            style={{ backgroundColor: 'rgba(226,192,99,0.18)', color: '#E2C063', border: '1px solid rgba(226,192,99,0.4)' }}
            aria-label="Previous project"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200"
            style={{ backgroundColor: 'rgba(226,192,99,0.18)', color: '#E2C063', border: '1px solid rgba(226,192,99,0.4)' }}
            aria-label="Next project"
          >
            ›
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {projects.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i)}
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{ backgroundColor: i === carouselIndex ? '#E2C063' : 'rgba(226,192,99,0.25)' }}
                aria-label={`Go to project ${i + 1}`}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ── Accordion (≤5 projects) ────────────────────────────────────────── */
        <ul ref={listRef} className="accordion-list">
          {projects.map((project) => (
            <li key={project.id} className="accordion-item">
              <div
                className="accordion-img"
                style={{ backgroundImage: `url(${project.coverImageUrl})` }}
              />
              <a href={`/projects/${project.slug}`} className="accordion-link">
                <p className="accordion-title">{project.title}</p>
                <p className="accordion-desc">{project.category}</p>
              </a>
            </li>
          ))}
        </ul>
      )}

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
