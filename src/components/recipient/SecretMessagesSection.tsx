'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Eye, Sparkles } from 'lucide-react';
import { SecretMessage } from '@/types/gift';

interface SecretMessagesSectionProps {
  messages?: SecretMessage[];
}

export function SecretMessagesSection({ messages = [] }: SecretMessagesSectionProps) {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  if (!messages || messages.length === 0) return null;

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="min-h-[75vh] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
            Whispers just between us
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[var(--theme-text)] font-normal">
            Secret Messages
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[var(--theme-muted)] max-w-md mx-auto">
            Hidden thoughts and unsaid appreciations waiting to be unsealed.
          </p>
        </motion.div>

        {/* Messages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {messages.map((msg, index) => {
            const isRevealed = revealedIds[msg.id];

            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => toggleReveal(msg.id)}
                className="cursor-pointer p-6 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-md hover:shadow-lg transition-all relative overflow-hidden group select-none flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-secondary)]">
                      {msg.title || `Secret #${index + 1}`}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center transition-transform group-hover:scale-110">
                      {isRevealed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {isRevealed ? (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                      >
                        <p className="font-handwriting text-lg sm:text-xl text-[var(--theme-text)] leading-relaxed">
                          "{msg.content}"
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="blurred"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-4 flex flex-col items-center justify-center text-center"
                      >
                        <div className="w-full h-8 rounded-lg bg-[var(--theme-border)]/50 blur-sm mb-2" />
                        <span className="text-xs text-[var(--theme-muted)] group-hover:text-[var(--theme-text)] transition-colors">
                          Tap to uncover this secret
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--theme-border)] text-[10px] text-[var(--theme-muted)] flex items-center justify-between">
                  <span>{isRevealed ? 'Tap to conceal' : 'Sealed confidential note'}</span>
                  <Sparkles className="w-3 h-3 text-[var(--theme-primary)]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
