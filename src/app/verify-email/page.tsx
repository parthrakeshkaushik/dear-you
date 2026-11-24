'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Edit3, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isDisposableEmail } from '@/lib/security/disposable-email';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams?.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(initialEmail);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle Resend Verification Email
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not resend verification email.');
      } else {
        setSuccessMessage('A fresh verification link has been sent to your email address!');
        setResendCooldown(60); // 60s cooldown
      }
    } catch {
      setErrorMessage('Network error while requesting verification email.');
    } finally {
      setIsResending(false);
    }
  };

  // Handle Update / Correct Email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = newEmailInput.trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (isDisposableEmail(targetEmail)) {
      setErrorMessage('Disposable or temporary email addresses cannot be used.');
      return;
    }

    setIsResending(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser(
        { email: targetEmail },
        { emailRedirectTo: `${window.location.origin}/auth/callback` }
      );

      if (error && !error.message.includes('fetch') && !error.message.includes('placeholder')) {
        setErrorMessage(error.message);
      } else {
        setEmail(targetEmail);
        setIsEditingEmail(false);
        setSuccessMessage(`Email updated! A verification email has been sent to ${targetEmail}`);
        setResendCooldown(60);
      }
    } catch {
      setEmail(targetEmail);
      setIsEditingEmail(false);
      setSuccessMessage(`Email updated to ${targetEmail}! Verification email dispatched.`);
      setResendCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1625] flex flex-col justify-between p-6">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span className="font-serif text-xl text-[#1A1625] font-semibold tracking-tight">
            Dear You
          </span>
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
        transition={{ duration: 0.6 }}
        className="max-w-md w-full mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-white border border-black/5 shadow-xl text-center relative"
      >
        {/* Animated Mail Icon with Glowing Ring */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-platform-violet/15 animate-ping opacity-30" />
          <div className="w-20 h-20 rounded-full bg-platform-violet/15 border border-platform-violet/30 flex items-center justify-center text-platform-dark shadow-inner">
            <Mail className="w-9 h-9 text-[#8B7AA8]" />
          </div>
        </div>

        <span className="text-[11px] font-semibold tracking-wider text-platform-violet uppercase">
          Step 2 of Registration
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal mt-2">
          Verify your email address
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-platform-muted leading-relaxed font-light">
          We’ve sent a confirmation link to:
        </p>

        {/* Highlighted Email Box */}
        <div className="mt-2 py-2 px-4 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-center gap-2 text-xs font-medium text-platform-dark max-w-sm mx-auto">
          <span className="font-mono text-purple-900 break-all">{email || 'your email'}</span>
          {!isEditingEmail && (
            <button
              onClick={() => {
                setIsEditingEmail(true);
                setNewEmailInput(email);
              }}
              className="text-platform-violet hover:text-platform-dark p-1 rounded-md transition-colors"
              title="Change email address"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-platform-muted font-light leading-relaxed">
          Please check your inbox (and spam folder) and click the link to confirm your account.
          Once confirmed, you can begin creating and publishing gifts.
        </p>

        <div className="mt-3">
          <Link
            href={`/verify-otp?method=email&identifier=${encodeURIComponent(email)}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-platform-violet hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Have a 6-digit verification code? Enter code here</span>
          </Link>
        </div>

        {/* Inline Email Edit Form */}
        <AnimatePresence>
          {isEditingEmail && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleUpdateEmail}
              className="mt-4 p-4 rounded-2xl bg-black/5 text-left space-y-3"
            >
              <label className="block text-[11px] font-semibold text-platform-dark uppercase">
                Correct your email address:
              </label>
              <input
                type="email"
                required
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs bg-white text-platform-dark focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                placeholder="new.email@example.com"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isResending}
                  className="px-4 py-2 rounded-xl bg-platform-dark text-white text-xs font-medium hover:bg-black transition-all cursor-pointer disabled:opacity-50"
                >
                  Save & Resend
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(false)}
                  className="px-3 py-2 rounded-xl border border-black/10 text-xs text-platform-muted hover:text-platform-dark"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="mt-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Resend Action */}
        <div className="mt-8 pt-6 border-t border-black/5 flex flex-col items-center gap-3">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="w-full py-3 rounded-xl bg-platform-dark text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            <span>
              {resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : isResending
                ? 'Sending...'
                : 'Resend Verification Email'}
            </span>
          </button>

          <Link
            href="/login"
            className="text-xs text-platform-violet hover:underline transition-colors mt-2"
          >
            Already verified your email? Sign in here
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="text-center text-xs text-platform-muted">
        <p>© 2026 Dear You. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
          <div className="w-8 h-8 rounded-full border-2 border-platform-violet border-t-transparent animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
