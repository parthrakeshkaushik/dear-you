'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NavSection {
  id: string;
  label: string;
}

interface SectionNavigationProps {
  sections: NavSection[];
}

export function SectionNavigation({ sections }: SectionNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 3;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!sections || sections.length <= 2) return null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-3 p-2 rounded-full bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] shadow-lg backdrop-blur-md">
      {sections.map((sec) => {
        const isActive = activeSection === sec.id;

        return (
          <button
            key={sec.id}
            onClick={() => scrollTo(sec.id)}
            className="group relative flex items-center justify-end cursor-pointer p-1"
            aria-label={`Scroll to ${sec.label}`}
          >
            {/* Tooltip on hover */}
            <span className="absolute right-7 px-2.5 py-1 rounded-md bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[10px] text-[var(--theme-text)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-md">
              {sec.label}
            </span>

            {/* Dot indicator */}
            <div
              className={`rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-3 h-3 bg-[var(--theme-primary)] scale-110 shadow-[0_0_8px_var(--theme-primary)]'
                  : 'w-2 h-2 bg-[var(--theme-muted)]/40 hover:bg-[var(--theme-muted)]'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
