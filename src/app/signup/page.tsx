'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isDisposableEmail } from '@/lib/security/disposable-email';

export default function SignUpPage() {
  const router = useRouter();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (isDisposableEmail(cleanEmail)) {
      setErrorMessage(
        'Disposable or temporary email addresses are not permitted. Please use your genuine email.'
      );
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (!agreedToPolicies) {
      setErrorMessage('Please check the box to agree to the Terms and Conditions and Privacy Policy.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. Call registration API (direct registration, no OTP)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: cleanEmail,
          password,
          terms_accepted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Account created successfully! Signing you in...');

      // 3. Establish 14-day persistent Supabase client session
      const maxAge14DaysSeconds = 14 * 24 * 60 * 60;
      const supabase = createClient(maxAge14DaysSeconds);

      const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInErr) {
        console.warn('Sign-in follow-up note:', signInErr.message);
      }

      // 4. Ensure server session cookie is confirmed for 14 days
      const finalUserId = authData?.user?.id || data.userId;
      if (finalUserId) {
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: finalUserId,
              rememberDays: 14,
            }),
          });
        } catch (sessErr) {
          console.warn('Session persistence establishment note:', sessErr);
        }
      }

      // 5. Direct redirect to Creator Dashboard
      setTimeout(() => {
        router.push('/admin?welcome=true');
      }, 500);
    } catch {
      setErrorMessage('Network error during registration. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1625] flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-platform-violet/15 flex items-center justify-center text-platform-violet shadow-xs">
            <Gift className="w-4 h-4" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">Dear You</span>
        </Link>
        <Link
          href="/login"
          className="text-xs text-platform-muted hover:text-platform-dark transition-colors font-medium"
        >
          Already have an account? <span className="text-platform-violet font-semibold underline">Sign In</span>
        </Link>
      </header>

      {/* Main Sign Up Card */}
      <main className="flex items-center justify-center my-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md p-6 sm:p-9 rounded-3xl bg-white border border-black/5 shadow-xl text-center relative overflow-hidden"
        >
          {/* Header Icon */}
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-platform-violet mx-auto flex items-center justify-center mb-4 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="font-serif text-2xl font-normal text-platform-dark mb-1">
            Create Your Account
          </h2>
          <p className="text-xs text-platform-muted mb-6">
            Sign up to create personalized surprise gifts and memory walls.
          </p>

          {/* Feedback Alerts */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simple Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* 1. Full Name */}
            <div>
              <label className="block text-xs font-semibold text-platform-dark mb-1">
                Full Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. Maya Sharma"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet"
                />
                <User className="w-4 h-4 text-platform-muted absolute left-3" />
              </div>
            </div>

            {/* 2. Valid Email */}
            <div>
              <label className="block text-xs font-semibold text-platform-dark mb-1">
                Valid Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet"
                />
                <Mail className="w-4 h-4 text-platform-muted absolute left-3" />
              </div>
            </div>

            {/* 3. Password */}
            <div>
              <label className="block text-xs font-semibold text-platform-dark mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet"
                />
                <Lock className="w-4 h-4 text-platform-muted absolute left-3" />
              </div>
            </div>

            {/* 4. Terms and Privacy Checkbox */}
            <div className="pt-1">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/50 border border-purple-100/70">
                <input
                  type="checkbox"
                  id="policyAgreementCheckbox"
                  checked={agreedToPolicies}
                  onChange={(e) => {
                    setAgreedToPolicies(e.target.checked);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  required
                  className="w-4 h-4 mt-0.5 rounded border-black/20 text-platform-violet focus:ring-platform-violet cursor-pointer shrink-0"
                />
                <label
                  htmlFor="policyAgreementCheckbox"
                  className="text-xs text-stone-700 leading-snug cursor-pointer select-none"
                >
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-semibold text-platform-violet underline hover:text-purple-900"
                  >
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-semibold text-platform-violet underline hover:text-purple-900"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
            </div>

            {/* Session Persistence Notice */}
            <div className="text-[11px] text-stone-500 font-light pl-1 flex items-center gap-1.5">
              <span>✓ Stays signed in for 14 days on this device</span>
            </div>

            {/* 5. Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading || !agreedToPolicies}
              className="w-full mt-4 py-3 rounded-xl bg-[#1A1625] text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom link to Sign In */}
          <div className="mt-6 pt-4 border-t border-black/5 text-center">
            <p className="text-xs text-platform-muted">
              Already have an account?{' '}
              <Link href="/login" className="underline font-semibold text-platform-dark">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-platform-muted flex items-center justify-center gap-4">
        <span>© {new Date().getFullYear()} Dear You.</span>
        <Link href="/terms" className="hover:underline">Terms</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
      </footer>
    </div>
  );
}
