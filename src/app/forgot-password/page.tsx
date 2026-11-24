'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${origin}/auth/reset-password`,
      });

      if (error && !error.message.includes('fetch') && !error.message.includes('placeholder')) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage(
          `If an account matches ${email.trim()}, password recovery instructions have been sent to your inbox.`
        );
      }
    } catch {
      setSuccessMessage(
        `If an account matches ${email.trim()}, password recovery instructions have been sent to your inbox.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1625] flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
          Dear You
        </Link>
        <Link
          href="/login"
          className="text-xs text-platform-muted hover:text-platform-dark transition-colors inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-white border border-black/5 shadow-xl text-center"
      >
        <div className="w-16 h-16 rounded-full bg-platform-violet/15 border border-platform-violet/30 flex items-center justify-center text-platform-dark mx-auto mb-6 shadow-inner">
          <KeyRound className="w-8 h-8 text-[#8B7AA8]" />
        </div>

        <span className="text-[11px] font-semibold tracking-wider text-platform-violet uppercase">
          Account Recovery
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal mt-2">
          Reset your password
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-platform-muted leading-relaxed font-light">
          Enter your registered email address and we’ll send you a secure link to reset your password.
        </p>

        {successMessage ? (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-left flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Check your email</p>
              <p className="mt-1 font-light leading-relaxed">{successMessage}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                />
                <Mail className="w-4 h-4 text-platform-muted absolute left-3.5" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-platform-dark text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Sending Link...' : 'Send Password Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-black/5">
          <Link
            href="/login"
            className="text-xs text-platform-violet hover:underline transition-colors"
          >
            Remember your password? Sign in
          </Link>
        </div>
      </motion.div>

      <footer className="text-center text-xs text-platform-muted">
        <p>© 2026 Dear You. All rights reserved.</p>
      </footer>
    </div>
  );
}
