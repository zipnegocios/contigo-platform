import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

import CustomCursor from './components/CustomCursor';
import Navigation from './components/Navigation';
import HeroSection from './sections/HeroSection';
import BrandBar from './sections/BrandBar';
import ServicesSection from './sections/ServicesSection';
import HeritageSection from './sections/HeritageSection';
import ProjectsSection from './sections/ProjectsSection';
import ContactSection from './sections/ContactSection';
import Footer from './sections/Footer';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [isListening, setIsListening] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Voice search handler
  const handleVoiceSearch = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is not supported in your browser. Please use the contact form.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-AU';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);

      // Simple keyword matching to scroll to relevant section
      if (transcript.includes('service') || transcript.includes('build')) {
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
      } else if (transcript.includes('project') || transcript.includes('work')) {
        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
      } else if (transcript.includes('contact') || transcript.includes('quote')) {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      } else if (transcript.includes('about') || transcript.includes('heritage')) {
        document.getElementById('heritage')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Default to contact
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening]);

  return (
    <div className="relative">
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Navigation */}
      <Navigation onVoiceSearch={handleVoiceSearch} isListening={isListening} />

      {/* Main Content */}
      <main>
        {/* 1. Hero - Atelier Gold Theme */}
        <HeroSection />

        {/* 2. Brand Bar */}
        <BrandBar />

        {/* 3. Services - Parallax Gallery */}
        <ServicesSection />

        {/* 4. Heritage - Flip Reveal */}
        <HeritageSection />

        {/* 5. Projects - Gold-Leaf Accordion (Monolith Theme) */}
        <ProjectsSection />

        {/* 6. Contact - Gooey Form */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
