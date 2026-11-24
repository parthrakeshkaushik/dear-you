'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, Compass, Star } from 'lucide-react';
import { GiftWish } from '@/types/gift';

interface FutureWishesSectionProps {
  wishes?: GiftWish[];
  recipientName?: string;
}

export function FutureWishesSection({
  wishes = [],
  recipientName = 'Dear One',
}: FutureWishesSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!wishes || wishes.length === 0) return null;

  const currentWish = wishes[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev < wishes.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : wishes.length - 1));
  };

  return (
    <section className="min-h-[70vh] px-4 py-16 flex flex-col items-center justify-center">
      <div className="max-w-xl mx-auto w-full text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
            Hopes for the road ahead
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[var(--theme-text)] font-normal">
            Future Wishes for {recipientName}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[var(--theme-muted)]">
            Gentle blessings for every tomorrow that awaits you.
          </p>
        </motion.div>

        {/* Wish Card Viewer */}
        <div className="relative p-8 sm:p-10 rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-xl min-h-[220px] flex flex-col justify-between overflow-hidden">
          {/* Card Counter Indicator */}
          <div className="flex items-center justify-between text-xs text-[var(--theme-muted)] mb-4">
            <span className="inline-flex items-center gap-1.5 text-[var(--theme-secondary)] font-medium">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Wish {activeIndex + 1} of {wishes.length}</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold">
              Step into tomorrow
            </span>
          </div>

          {/* Active Wish Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="my-auto py-4"
            >
              <p className="font-serif text-lg sm:text-2xl text-[var(--theme-text)] font-normal leading-relaxed italic">
                "{currentWish?.wish_text}"
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="mt-6 pt-4 border-t border-[var(--theme-border)] flex items-center justify-between">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--theme-muted)] hover:text-[var(--theme-text)] transition-colors cursor-pointer"
              aria-label="Previous wish"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {wishes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activeIndex
                      ? 'w-6 bg-[var(--theme-primary)]'
                      : 'bg-[var(--theme-border)] hover:bg-[var(--theme-muted)]'
                  }`}
                  aria-label={`Go to wish ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--theme-muted)] hover:text-[var(--theme-text)] transition-colors cursor-pointer"
              aria-label="Next wish"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
