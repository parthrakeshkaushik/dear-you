'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Feather } from 'lucide-react';
import { GiftLetter } from '@/types/gift';

interface LetterSectionProps {
  letters?: GiftLetter[];
  recipientName?: string;
}

export function LetterSection({
  letters = [],
  recipientName = 'Dear You',
}: LetterSectionProps) {
  if (!letters || letters.length === 0) return null;

  return (
    <section className="min-h-[85vh] px-4 py-20 flex flex-col items-center justify-center">
      <div className="max-w-2xl mx-auto w-full">
        {letters.map((letter, index) => (
          <motion.div
            key={letter.id || index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 sm:p-14 rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-2xl relative overflow-hidden"
          >
            {/* Top letter decoration */}
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-[var(--theme-border)]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--theme-secondary)] font-medium">
                <Feather className="w-4 h-4" />
                <span>Personal Letter</span>
              </div>
              <span className="font-handwriting text-lg text-[var(--theme-muted)]">
                To: {recipientName}
              </span>
            </div>

            {/* Letter Heading */}
            {letter.heading && (
              <h3 className="font-serif text-2xl sm:text-3xl text-[var(--theme-text)] font-normal mb-8 leading-snug">
                {letter.heading}
              </h3>
            )}

            {/* Letter Content (paragraphs) */}
            <div className="space-y-6 text-sm sm:text-base text-[var(--theme-text)] font-light leading-relaxed">
              {letter.content.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx} className="first-letter:font-serif first-letter:text-2xl first-letter:font-normal">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Signature Bottom */}
            <div className="mt-12 pt-6 border-t border-[var(--theme-border)] flex items-center justify-between text-right">
              <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)]/10 flex items-center justify-center text-[var(--theme-primary)]">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--theme-muted)]">Forever with love,</p>
                <p className="font-handwriting text-2xl text-[var(--theme-secondary)]">Always Yours</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
