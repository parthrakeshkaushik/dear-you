'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Gift, Heart, ArrowDown } from 'lucide-react';

interface GiftRevealProps {
  revealHeading?: string;
  surpriseMessage?: string;
  onOpened?: () => void;
}

export function GiftReveal({
  revealHeading = 'Unwrap Your Surprise',
  surpriseMessage = 'Every memory, every laugh, and every quiet kindness you bring into the world is celebrated today.',
  onOpened,
}: GiftRevealProps) {
  const [isOpen, setIsOpen] = useState(false);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#9D85C5', '#FF4D6D', '#06D6A0', '#FDE047'],
      });
    } catch {
      // Confetti is a visual bonus; graceful fallback if canvas isn't available
    }
  };

  const handleOpenBox = () => {
    if (isOpen) return;
    setIsOpen(true);
    triggerConfetti();
    if (onOpened) onOpened();
  };

  return (
    <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
            A token of warmth
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[var(--theme-text)] font-normal">
            {isOpen ? 'A gift from the heart' : revealHeading}
          </h2>
          {!isOpen && (
            <p className="mt-2 text-xs sm:text-sm text-[var(--theme-muted)]">
              Tap the box below to unwrap what lies inside.
            </p>
          )}
        </motion.div>

        {/* Interactive Gift Box */}
        <div className="relative my-6 cursor-pointer" onClick={handleOpenBox}>
          <motion.div
            animate={
              isOpen
                ? { scale: [1, 1.1, 1] }
                : { y: [0, -8, 0], rotate: [0, -1, 1, 0] }
            }
            transition={{
              duration: isOpen ? 0.6 : 3.5,
              repeat: isOpen ? 0 : Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            {/* Box Body */}
            <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl bg-gradient-to-br from-[var(--theme-surface)] to-[var(--theme-bg)] border-2 border-[var(--theme-border)] shadow-2xl flex items-center justify-center relative overflow-hidden group">
              {/* Box Ribbon Vertical */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-b from-[var(--theme-primary)] to-[var(--theme-secondary)] opacity-85 shadow-sm" />
              {/* Box Ribbon Horizontal */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] opacity-85 shadow-sm" />

              {/* Center Bow / Icon */}
              <div className="relative z-10 w-16 h-16 rounded-full bg-[var(--theme-primary)] text-[var(--theme-bg)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                {isOpen ? (
                  <Heart className="w-8 h-8 fill-current text-[var(--theme-bg)] animate-pulse" />
                ) : (
                  <Gift className="w-8 h-8" />
                )}
              </div>
            </div>

            {/* Glowing Aura Behind Box */}
            <div className="absolute inset-0 -z-10 rounded-full bg-[var(--theme-primary)]/20 blur-2xl transform scale-125" />
          </motion.div>
        </div>

        {/* Revealed Content Container */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 p-6 sm:p-8 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-xl max-w-md w-full relative"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--theme-secondary)] font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Special Surprise</span>
              </div>
              <p className="text-sm sm:text-base text-[var(--theme-text)] font-light leading-relaxed">
                "{surpriseMessage}"
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--theme-border)] flex items-center justify-center text-xs text-[var(--theme-muted)]">
                Scroll down to discover more cherished memories ↓
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
