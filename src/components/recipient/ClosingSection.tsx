'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUp, Heart, Download } from 'lucide-react';

interface ClosingSectionProps {
  recipientName: string;
  closingMessage?: string;
  onReplay?: () => void;
  onDownloadKeepsake?: () => void;
}

export function ClosingSection({
  recipientName,
  closingMessage = 'Thank you for stepping into this little sanctuary created for you. May today and all your tomorrows be filled with gentle warmth, great courage, and boundless laughter.',
  onReplay,
  onDownloadKeepsake,
}: ClosingSectionProps) {
  const handleScrollToTop = () => {
    if (onReplay) {
      onReplay();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-20 text-center relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-xl mx-auto flex flex-col items-center"
      >
        <div className="w-14 h-14 rounded-full bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center mb-6">
          <Heart className="w-6 h-6 fill-current animate-pulse" />
        </div>

        <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
          Until our next chapter
        </span>

        <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[var(--theme-text)] font-normal">
          Always Here For You, {recipientName}
        </h2>

        <p className="mt-6 text-sm sm:text-base text-[var(--theme-muted)] font-light leading-relaxed max-w-lg">
          "{closingMessage}"
        </p>

        {/* Action Buttons: Download Keepsake & Replay */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {onDownloadKeepsake && (
            <button
              onClick={onDownloadKeepsake}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--theme-primary)] text-white text-xs font-medium hover:opacity-90 transition-all cursor-pointer shadow-md active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save & Download Keepsake</span>
            </button>
          )}

          <button
            onClick={handleScrollToTop}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--theme-border)] text-xs font-medium text-[var(--theme-text)] hover:bg-[var(--theme-surface)] hover:border-[var(--theme-primary)] transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Replay Experience</span>
          </button>
        </div>

        {/* Subtle branding footer */}
        <div className="mt-16 text-[11px] text-[var(--theme-muted)]/70 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[var(--theme-primary)]" />
          <span>Dear You — Every person deserves a little something special</span>
        </div>
      </motion.div>
    </section>
  );
}
