'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowDown, Gift, Music, Headphones } from 'lucide-react';

interface WelcomeScreenProps {
  recipientName: string;
  heading?: string;
  message?: string;
  buttonText?: string;
  coverImage?: string;
  hasMusic?: boolean;
  musicTitle?: string;
  onProceed: () => void;
}

export function WelcomeScreen({
  recipientName,
  heading,
  message,
  buttonText,
  coverImage,
  hasMusic = false,
  musicTitle,
  onProceed,
}: WelcomeScreenProps) {
  // Normalize button label to "Start Your Journey" if not customized
  const displayButtonText =
    buttonText && buttonText !== 'Open Your Surprise'
      ? buttonText
      : 'Start Your Journey';

  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 py-16 text-center select-none">
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
        {/* Floating Gift Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 flex items-center justify-center text-[var(--theme-primary)] mb-8 shadow-inner"
        >
          <Gift className="w-8 h-8 animate-float-slow" />
        </motion.div>

        {/* Personalized Greeting */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-handwriting text-2xl sm:text-3xl text-[var(--theme-secondary)] tracking-wide"
        >
          Dear {recipientName},
        </motion.span>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-4 font-serif text-3xl sm:text-5xl md:text-6xl font-normal text-[var(--theme-text)] leading-[1.18] tracking-tight"
        >
          {heading || 'Someone has created a little something special for you.'}
        </motion.h1>

        {/* Warm Invitation Message */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-sm sm:text-base text-[var(--theme-muted)] max-w-lg leading-relaxed font-light"
        >
          {message ||
            'Take a breath, put your headphones on if you like, and step into this moment crafted just for you.'}
        </motion.p>

        {/* Prominent "Start Your Journey" Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-10 flex flex-col items-center gap-3.5"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onProceed}
            className="group relative inline-flex items-center gap-3.5 px-8 sm:px-10 py-4 sm:py-4.5 rounded-full bg-[var(--theme-primary)] text-[var(--theme-bg)] font-medium text-sm sm:text-base shadow-xl hover:shadow-2xl hover:brightness-110 active:scale-95 transition-all cursor-pointer ring-4 ring-[var(--theme-primary)]/20 focus:outline-none focus:ring-4 focus:ring-[var(--theme-primary)]/40"
            aria-label={`${displayButtonText}${hasMusic ? ' with background music' : ''}`}
          >
            <Sparkles className="w-4 h-4 animate-sparkle" />
            <span className="font-semibold tracking-wide">{displayButtonText}</span>
            {hasMusic ? (
              <Music className="w-4 h-4 transition-transform group-hover:scale-110 text-current/80" />
            ) : (
              <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            )}
          </motion.button>

          {/* Audio Indicator Hint if Music is Configured */}
          {hasMusic && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-2 text-xs text-[var(--theme-muted)]/80 font-light mt-1"
            >
              <Headphones className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span>
                {musicTitle
                  ? `Featuring "${musicTitle}" • Best experienced with sound on`
                  : 'Music starts with your journey • Best experienced with sound on'}
              </span>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
