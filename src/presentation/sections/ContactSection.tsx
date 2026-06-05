'use client'
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function ContactSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your inquiry! We will contact you shortly.');
    setFormData({ name: '', email: '', phone: '', service: '', message: '' });
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(leftColRef.current, {
        x: -30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });

      gsap.from(rightColRef.current, {
        x: 30,
        opacity: 0,
        duration: 0.7,
        delay: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="section-gap page-padding relative"
      style={{ backgroundColor: 'var(--heritage-sand)' }}
    >
      {/* SVG Filter for Gooey Effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Column - Gooey Form */}
          <div ref={leftColRef} className="lg:w-1/2">
            <div className="gooey-container">
              <div className="gooey-blob blob-1" />
              <div className="gooey-blob blob-2" />
              <div className="gooey-blob blob-3" />
              <div className="form-overlay">
                <form onSubmit={handleSubmit} className="contact-form">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                  <select
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a Service</option>
                    <option value="new-home">New Home Building</option>
                    <option value="extensions">Home Extensions</option>
                    <option value="renovations">Home Renovations</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    placeholder="Tell us about your project..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                  />
                  <button type="submit" className="btn-primary w-full">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Info */}
          <div ref={rightColRef} className="lg:w-1/2 flex flex-col justify-center">
            <span
              className="label block mb-4"
              style={{ color: 'var(--heritage-terracotta)' }}
            >
              GET IN TOUCH
            </span>
            <h2
              className="mb-6"
              style={{ color: 'var(--heritage-charcoal)' }}
            >
              Start Your Project
            </h2>
            <p
              className="mb-8 text-base"
              style={{
                color: 'var(--heritage-charcoal)',
                opacity: 0.8,
                lineHeight: 1.7,
              }}
            >
              Ready to build? Contact us for a free consultation and quote. Our
              team is here to help bring your vision to life.
            </p>

            {/* Contact Details */}
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <Phone
                  size={20}
                  style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--heritage-charcoal)' }}
                  >
                    Phone
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--heritage-charcoal)', opacity: 0.7 }}
                  >
                    (08) 8123 4567
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail
                  size={20}
                  style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--heritage-charcoal)' }}
                  >
                    Email
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--heritage-charcoal)', opacity: 0.7 }}
                  >
                    info@contigoconstructions.com.au
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin
                  size={20}
                  style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--heritage-charcoal)' }}
                  >
                    Address
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--heritage-charcoal)', opacity: 0.7 }}
                  >
                    25 Green Avenue, Seaton SA 5023
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock
                  size={20}
                  style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--heritage-charcoal)' }}
                  >
                    Business Hours
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--heritage-charcoal)', opacity: 0.7 }}
                  >
                    Mon - Fri: 7:00 AM - 5:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CC Monogram watermark */}
      <img
        src="/assets/isotipo.png"
        alt=""
        className="absolute bottom-8 right-8 pointer-events-none hidden lg:block"
        style={{ width: '200px', opacity: 0.15 }}
      />
    </section>
  );
}
