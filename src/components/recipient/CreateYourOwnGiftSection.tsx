'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, Sparkles, ArrowRight, Heart } from 'lucide-react';

export function CreateYourOwnGiftSection() {
  return (
    <aside
      aria-label="Create your own gift"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 relative border-t border-[var(--theme-border)]/40 overflow-hidden"
    >
      {/* Subtle Background Ambient Aura */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-primary)]/5 to-[var(--theme-primary)]/10 pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 sm:p-12 rounded-3xl bg-[var(--theme-surface)]/85 border border-[var(--theme-border)] shadow-xl backdrop-blur-md relative overflow-hidden"
        >
          {/* Subtle Accent Glow Top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent opacity-70" />

          {/* Dear You Brand Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 text-xs font-medium text-[var(--theme-primary)] mb-5">
            <Gift className="w-3.5 h-3.5" />
            <span>Dear You</span>
          </div>

          {/* Main Heading */}
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[var(--theme-text)] font-normal tracking-tight leading-snug">
            Your turn to make someone smile!
          </h2>

          {/* Emotional Subtitle */}
          <p className="mt-4 text-xs sm:text-sm md:text-base text-[var(--theme-muted)] leading-relaxed font-light max-w-lg mx-auto">
            Create a beautiful digital surprise for someone special. Your memories, your stories, your way.
          </p>

          {/* Conversion Call to Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[var(--theme-primary)] text-white text-xs sm:text-sm font-semibold hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Your Own Gift</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full text-xs font-medium text-[var(--theme-muted)] hover:text-[var(--theme-text)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            >
              <span>Discover Dear You</span>
            </Link>
          </div>

          {/* Footer Tagline */}
          <div className="mt-8 pt-6 border-t border-[var(--theme-border)]/50 flex items-center justify-center gap-2 text-[11px] text-[var(--theme-muted)]/70">
            <Heart className="w-3 h-3 text-[var(--theme-primary)] fill-current" />
            <span>Digital gifts made with love • Cherished forever</span>
          </div>
        </motion.div>
      </div>
    </aside>
  );
}
