'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowDown, Gift } from 'lucide-react';

interface WelcomeScreenProps {
  recipientName: string;
  heading?: string;
  message?: string;
  buttonText?: string;
  coverImage?: string;
  onProceed: () => void;
}

export function WelcomeScreen({
  recipientName,
  heading,
  message,
  buttonText = 'Open Your Surprise',
  coverImage,
  onProceed,
}: WelcomeScreenProps) {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Optional Cover Ambient Backing */}
      {coverImage && (
        <div
          className="absolute inset-0 opacity-15 bg-center bg-cover blur-md -z-10"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl mx-auto flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 flex items-center justify-center text-[var(--theme-primary)] mb-8 shadow-inner"
        >
          <Gift className="w-8 h-8 animate-float-slow" />
        </motion.div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-handwriting text-2xl sm:text-3xl text-[var(--theme-secondary)] tracking-wide"
        >
          Dear {recipientName},
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-4 font-serif text-3xl sm:text-5xl md:text-6xl font-normal text-[var(--theme-text)] leading-[1.18] tracking-tight"
        >
          {heading || 'Someone has created a little something special for you.'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-sm sm:text-base text-[var(--theme-muted)] max-w-lg leading-relaxed font-light"
        >
          {message ||
            'Take a breath, put your headphones on if you like, and step into this moment crafted just for you.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <button
            onClick={onProceed}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[var(--theme-primary)] text-[var(--theme-bg)] font-medium text-sm sm:text-base shadow-xl hover:shadow-2xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-sparkle" />
            <span>{buttonText}</span>
            <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
