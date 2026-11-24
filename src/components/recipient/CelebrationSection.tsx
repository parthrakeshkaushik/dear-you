'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Wind, Flame, Heart, Cake } from 'lucide-react';
import { GiftWish } from '@/types/gift';

interface CelebrationSectionProps {
  recipientName: string;
  eventType?: string;
  wishes?: GiftWish[];
  cakeEnabled?: boolean;
}

export function CelebrationSection({
  recipientName,
  eventType = 'Birthday',
  wishes = [],
  cakeEnabled = true,
}: CelebrationSectionProps) {
  const [candlesBlown, setCandlesBlown] = useState(false);

  const handleBlowCandles = () => {
    if (candlesBlown) return;
    setCandlesBlown(true);

    try {
      // Dual cannon celebratory confetti burst
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    } catch {
      // Visual fallback
    }
  };

  return (
    <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
            A celebration of you
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-5xl text-[var(--theme-text)] font-normal">
            {eventType === 'Birthday'
              ? `Happy Birthday, ${recipientName}!`
              : `Celebrating ${recipientName}`}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[var(--theme-muted)] max-w-md mx-auto">
            Today marks another beautiful chapter of your story.
          </p>
        </motion.div>

        {/* Virtual Birthday Cake Module */}
        {cakeEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="my-8 p-8 sm:p-10 rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-xl flex flex-col items-center relative overflow-hidden"
          >
            {/* Cake Graphic Representation */}
            <div className="relative my-4 flex flex-col items-center">
              {/* Candles */}
              <div className="flex gap-4 sm:gap-6 mb-2">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    {/* Flame */}
                    <AnimatePresence>
                      {!candlesBlown ? (
                        <motion.div
                          animate={{
                            scale: [1, 1.25, 0.9, 1.15, 1],
                            rotate: [-2, 3, -1, 2, 0],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.2 + idx * 0.2,
                            ease: 'easeInOut',
                          }}
                          className="w-4 h-6 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-200 rounded-full blur-[0.5px] shadow-[0_0_12px_#F59E0B]"
                        />
                      ) : (
                        <motion.div
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 0, y: -16, scale: 1.5 }}
                          transition={{ duration: 1 }}
                          className="w-2 h-2 rounded-full bg-stone-400/80 blur-xs"
                        />
                      )}
                    </AnimatePresence>
                    {/* Candle stick */}
                    <div className="w-2.5 h-10 rounded-t-sm bg-gradient-to-b from-purple-200 to-pink-200 border border-black/10 shadow-xs" />
                  </div>
                ))}
              </div>

              {/* Cake Top Tier */}
              <div className="w-36 sm:w-44 h-12 rounded-t-2xl bg-gradient-to-b from-pink-100 to-pink-200 border-2 border-pink-300 shadow-md flex items-center justify-center relative">
                <div className="w-full h-2 bg-white/60 absolute top-2 rounded-full" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-pink-700/60">
                  ✨ Made with Love ✨
                </span>
              </div>

              {/* Cake Bottom Tier */}
              <div className="w-48 sm:w-60 h-16 rounded-b-2xl bg-gradient-to-b from-rose-200 to-rose-300 border-2 border-rose-300 shadow-lg relative flex items-center justify-around px-4">
                <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
              </div>

              {/* Cake Plate */}
              <div className="w-56 sm:w-72 h-3.5 rounded-full bg-stone-300/80 shadow-md mt-1" />
            </div>

            {/* Interaction Button or Wish Whisper */}
            <div className="mt-6">
              {!candlesBlown ? (
                <button
                  onClick={handleBlowCandles}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--theme-primary)] text-[var(--theme-bg)] text-xs sm:text-sm font-semibold hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Wind className="w-4 h-4 animate-pulse" />
                  <span>Blow Out the Candles & Make a Wish</span>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 text-[var(--theme-primary)] text-xs sm:text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Your wish has been whispered to the stars! ✨</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Wishes List */}
        {wishes.length > 0 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {wishes.map((wish, index) => (
              <motion.div
                key={wish.id || index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-5 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] shadow-xs flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--theme-primary)]/15 flex items-center justify-center text-[var(--theme-primary)] shrink-0 mt-0.5">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </div>
                <p className="text-xs sm:text-sm text-[var(--theme-text)] font-light leading-relaxed">
                  {wish.wish_text}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
