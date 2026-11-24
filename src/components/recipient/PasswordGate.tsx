'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowRight, Eye, EyeOff, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';

interface PasswordGateProps {
  giftTitle: string;
  recipientName: string;
  passwordHint?: string;
  isDemo?: boolean;
  revocationNotice?: string | null;
  onSubmit: (password: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
}

export function PasswordGate({
  giftTitle,
  recipientName,
  passwordHint,
  isDemo = false,
  revocationNotice = null,
  onSubmit,
  onSuccess,
}: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter the access password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await onSubmit(password);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Incorrect password. Please try again.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-2xl backdrop-blur-xl text-center relative overflow-hidden"
      >
        {/* Subtle accent glow top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent opacity-80" />

        {/* Lock Icon Emblem */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 flex items-center justify-center text-[var(--theme-primary)] mb-6 shadow-inner">
          <KeyRound className="w-7 h-7" />
        </div>

        {/* Dear You platform branding */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 text-xs font-medium text-[var(--theme-primary)] mb-4">
          <Sparkles className="w-3 h-3" />
          <span>{isDemo ? 'Demonstration Card' : 'Dear You Experience'}</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl text-[var(--theme-text)] font-normal tracking-tight">
          A surprise for {recipientName}
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-[var(--theme-muted)] font-light leading-relaxed">
          {giftTitle || 'Someone special created a personal digital gift for you.'}
        </p>

        {/* Immediate Session Revocation Notice (Displayed when password was updated by creator) */}
        {revocationNotice && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs text-left flex items-start gap-2.5"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <span className="font-medium leading-relaxed">{revocationNotice}</span>
          </motion.div>
        )}

        {/* Demonstration Card Direct Password Hint */}
        {isDemo && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/25 text-xs text-[var(--theme-text)]">
            <div className="font-semibold text-[var(--theme-primary)] flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Public Demonstration Card</span>
            </div>
            <p className="text-xs">
              <strong>Demo password: <code className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded font-mono font-bold text-[var(--theme-primary)]">special</code></strong>
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative text-left">
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter gift password"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full px-4 py-3.5 pr-12 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--theme-border)] text-[var(--theme-text)] placeholder-[var(--theme-muted)]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40 focus:border-[var(--theme-primary)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[var(--theme-muted)] hover:text-[var(--theme-text)] transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -5 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -5 }}
                  className="flex items-center gap-2 mt-2 text-xs text-rose-500 font-medium px-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--theme-primary)] text-[var(--theme-bg)] text-sm font-semibold hover:brightness-110 active:scale-[0.99] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock Experience</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-[11px] text-[var(--theme-muted)]/70">
          Protected digital gift • Private & encrypted
        </p>
      </motion.div>
    </div>
  );
}
