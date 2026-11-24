'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, ArrowLeft } from 'lucide-react';
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
      <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden select-none">
        {/* Subtle Ambient Background Aura */}
        <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[var(--theme-primary)]/10 blur-3xl pointer-events-none" />

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
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--theme-primary)] hover:underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dear You Homepage</span>
            </Link>
          </div>
        </motion.div>
      </main>
    </ThemeContainer>
  );
}
