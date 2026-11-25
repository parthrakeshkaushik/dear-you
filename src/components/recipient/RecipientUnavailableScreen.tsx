'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import { ThemeContainer } from './ThemeContainer';
import { ThemeId, CustomThemeConfig } from '@/types/theme';

interface RecipientUnavailableScreenProps {
  themeId?: ThemeId;
  customConfig?: CustomThemeConfig;
  customMessage?: string;
}

export function RecipientUnavailableScreen({
  themeId = 'dreamy',
  customConfig,
  customMessage,
}: RecipientUnavailableScreenProps) {
  return (
    <ThemeContainer themeId={themeId} customConfig={customConfig}>
      <main className="min-h-screen flex flex-col justify-between px-4 py-5 sm:py-6 relative overflow-hidden select-none">
        {/* Subtle Ambient Background Aura */}
        <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[var(--theme-primary)]/10 blur-3xl pointer-events-none" />

        {/* Top Navigation Header */}
        <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 sm:gap-2.5 group cursor-pointer active:scale-95 transition-transform"
            title="Dear You Homepage"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/20 flex items-center justify-center text-[var(--theme-primary)] shadow-2xs group-hover:scale-105 group-hover:bg-[var(--theme-primary)]/25 transition-all">
              <Gift className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <span className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-[var(--theme-text)] group-hover:opacity-85 transition-opacity">
              Dear You
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--theme-muted)] hover:text-[var(--theme-text)] active:scale-95 transition-all px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            <span>← Back to Home</span>
          </Link>
        </header>

        {/* Main Card */}
        <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto p-8 sm:p-10 rounded-3xl bg-[var(--theme-surface)]/85 border border-[var(--theme-border)] shadow-2xl backdrop-blur-xl text-center relative z-10"
          >
            {/* Subtle Icon */}
            <div className="w-16 h-16 rounded-full bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 flex items-center justify-center text-[var(--theme-primary)] mx-auto mb-6 shadow-inner">
              <Gift className="w-8 h-8 opacity-80" />
            </div>

            {/* Heading */}
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[var(--theme-text)] leading-snug">
              This gift is currently unavailable
            </h1>

            {/* Polite, dignified explanation without leaking internal moderation notes */}
            <p className="mt-4 text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed font-light">
              {customMessage ||
                'The creator or platform has temporarily paused access to this experience. Please reach out to the person who shared this link with you.'}
            </p>

            <div className="mt-8 pt-6 border-t border-[var(--theme-border)]/40 flex flex-col items-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--theme-primary)] text-white text-xs sm:text-sm font-semibold hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Your Own Gift</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--theme-muted)] hover:text-[var(--theme-text)] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dear You Homepage</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="text-center py-2 text-[11px] text-[var(--theme-muted)]/60">
          <span>Dear You • Every person deserves a little something special</span>
        </footer>
      </main>
    </ThemeContainer>
  );
}
