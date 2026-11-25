'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Moon, Clock, Heart, BookOpen, Gift, ArrowRight } from 'lucide-react';
import { ThemeId } from '@/types/theme';
import { ExpiryPageConfig } from '@/types/gift';

interface ExpiryScreenProps {
  recipientName: string;
  themeId?: ThemeId;
  heading?: string;
  message?: string;
  config?: ExpiryPageConfig;
}

export function ExpiryScreen({
  recipientName,
  themeId = 'dreamy',
  heading,
  message,
  config,
}: ExpiryScreenProps) {
  const effectiveThemeId = config?.theme_id || themeId || 'dreamy';
  const effectiveHeading =
    config?.heading && config.heading.trim().length > 0
      ? config.heading.trim()
      : heading || 'This little surprise has reached its final page.';

  const effectiveMessage =
    config?.message && config.message.trim().length > 0
      ? config.message.trim()
      : message ||
        'The little world created for you has now come to a close. But some moments and connections are too special to be limited by time. Thank you for being part of this little journey.';

  const showCreateBtn = config?.show_create_button !== undefined ? config.show_create_button : true;
  const createBtnText = config?.create_button_text?.trim() || 'Create Your Own Gift';
  const showHomeBtn = config?.show_home_button !== undefined ? config.show_home_button : true;
  const homeBtnText = config?.home_button_text?.trim() || 'Return to Home';

  // Render theme-tailored farewell iconography
  const renderThemeFarewellEmblem = () => {
    switch (effectiveThemeId) {
      case 'scrapbook':
        return (
          <div className="w-16 h-16 rounded-2xl bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 flex items-center justify-center text-[var(--theme-primary)] mb-6 shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
        );
      case 'elegant':
        return (
          <div className="w-16 h-16 rounded-full bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/40 flex items-center justify-center text-[var(--theme-primary)] mb-6 shadow-inner">
            <Clock className="w-7 h-7" />
          </div>
        );
      case 'dreamy':
      default:
        return (
          <div className="w-16 h-16 rounded-full bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 flex items-center justify-center text-[var(--theme-primary)] mb-6 shadow-inner">
            <Moon className="w-8 h-8 animate-pulse-gentle" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-5 sm:py-6 relative z-10 text-center">
      {/* Top Navigation Header: Logo on left, Back to Home on right */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 sm:gap-2.5 group cursor-pointer active:scale-95 transition-transform"
          title="Dear You Homepage"
        >
          <img
            src="/brand/logo.png"
            alt="Dear You"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform"
          />
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

      {/* Main Expired / Concluded Card */}
      <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-lg w-full p-8 sm:p-12 rounded-3xl bg-[var(--theme-surface)]/90 border border-[var(--theme-border)] shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col items-center"
        >
          {/* Soft top gradient accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent opacity-60" />

          {renderThemeFarewellEmblem()}

          <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
            Dear {recipientName},
          </span>

          <h1 className="mt-3 font-serif text-2xl sm:text-3xl text-[var(--theme-text)] font-normal leading-snug">
            {effectiveHeading}
          </h1>

          <p className="mt-6 text-sm sm:text-base text-[var(--theme-muted)] font-light leading-relaxed">
            {effectiveMessage}
          </p>

          {/* Offline Keepsake Notice */}
          <div className="mt-6 p-3.5 rounded-2xl bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 text-xs text-[var(--theme-text)] font-light leading-relaxed flex items-center gap-2.5 text-left">
            <Sparkles className="w-4 h-4 text-[var(--theme-primary)] shrink-0" />
            <span>
              If you previously downloaded an offline keepsake package of this card, that saved copy can still be opened and enjoyed anytime on your device.
            </span>
          </div>

          {/* Action Call to Action: Create Your Own Gift + Return to Home */}
          {(showCreateBtn || showHomeBtn) && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              {showCreateBtn && (
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--theme-primary)] text-white text-xs sm:text-sm font-semibold hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{createBtnText}</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>
              )}

              {showHomeBtn && (
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium text-[var(--theme-muted)] hover:text-[var(--theme-text)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
                >
                  <span>{homeBtnText}</span>
                </Link>
              )}
            </div>
          )}

          {/* Closing subtle note */}
          <div className="mt-8 pt-6 border-t border-[var(--theme-border)] w-full flex items-center justify-center gap-1.5 text-xs text-[var(--theme-muted)]/80">
            <Heart className="w-3.5 h-3.5 text-[var(--theme-primary)] fill-current" />
            <span>The memories and feelings behind it will always remain.</span>
          </div>
        </motion.div>
      </div>

      {/* Subtle Bottom Footer */}
      <footer className="text-center py-2 text-[11px] text-[var(--theme-muted)]/60">
        <span>Dear You • Every person deserves a little something special</span>
      </footer>
    </div>
  );
}
