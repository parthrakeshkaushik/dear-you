'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import CaptchaWidget from '@/components/auth/CaptchaWidget';

function ForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    if (!captchaToken) {
      setErrorMessage('Please complete the security verification (CAPTCHA) check.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'email',
          identifier: cleanEmail,
          captcha_token: captchaToken,
        }),
      });

      const data = await res.json();
      if (!res.ok && res.status !== 200) {
        // Only show technical rate limit errors; account existence is never leaked
        if (res.status === 429) {
          setErrorMessage(data.error || 'Too many requests. Please wait a few moments before trying again.');
        } else {
          setErrorMessage(data.error || 'Unable to process your request. Please try again.');
        }
      } else {
        setSuccessMessage(
          data.message || 'If an account exists with this email address, a password reset link will be sent.'
        );
      }
    } catch {
      setErrorMessage('Network error while requesting password reset. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1625] flex flex-col justify-between p-6">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 group" title="Dear You">
          <img
            src="/brand/logo.png"
            alt="Dear You"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-xl font-semibold tracking-tight">Dear You</span>
        </Link>
        <Link
          href="/login"
          className="text-xs text-platform-muted hover:text-platform-dark transition-colors inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto my-8 p-7 sm:p-9 rounded-3xl bg-white border border-black/5 shadow-xl text-center"
      >
        <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center">
          <img
            src="/brand/logo.png"
            alt="Dear You"
            className="w-12 h-12 object-contain"
          />
        </div>

        <span className="text-[10px] font-semibold tracking-wider text-platform-violet uppercase font-mono bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
          Account Recovery
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal mt-2.5">
          Forgot Your Password?
        </h1>

        <p className="mt-2 text-xs text-platform-muted leading-relaxed font-light">
          Enter the email address associated with your account and we’ll send you a secure link to reset your password.
        </p>

        {successMessage ? (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-left flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Instructions Dispatched</p>
              <p className="mt-1 font-light leading-relaxed">{successMessage}</p>
              <p className="mt-3 text-[11px] text-emerald-700">
                Please check your inbox (and spam or junk folder) for the password reset email.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                Registered Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                />
                <Mail className="w-4 h-4 text-platform-muted absolute left-3" />
              </div>
            </div>

            <CaptchaWidget
              onVerify={(token) => {
                setCaptchaToken(token);
                if (errorMessage) setErrorMessage(null);
              }}
              onExpire={() => setCaptchaToken(null)}
            />

            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || !captchaToken}
              className="w-full py-3 rounded-xl bg-[#1A1625] text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-black/5 flex flex-col items-center gap-2">
          <Link
            href="/login"
            className="text-xs text-platform-violet hover:underline transition-colors font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Remember your password? Sign in</span>
          </Link>
        </div>
      </motion.div>

      <footer className="text-center text-xs text-platform-muted">
        <p>© {new Date().getFullYear()} Dear You. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
          <div className="w-8 h-8 rounded-full border-2 border-platform-violet border-t-transparent animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
