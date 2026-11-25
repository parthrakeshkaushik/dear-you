'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { SessionDurationDays } from '@/lib/auth/persistent-session';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);

  // Persistent Login & Remember Me State (Default: 14 days)
  const [rememberMe, setRememberMe] = useState(true);
  const [rememberDuration, setRememberDuration] = useState<SessionDurationDays>(14);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check URL parameters and restore existing active sessions on mount
  useEffect(() => {
    const resetSuccess = searchParams?.get('reset_success') === 'true';
    if (resetSuccess) {
      setSuccessMessage('Your password has been reset successfully. Please sign in with your new password.');
      return;
    }

    const expired = searchParams?.get('expired') === 'true';
    if (expired) {
      setErrorMessage('Your session has expired. Please sign in again.');
      return;
    }

    const loggedOut = searchParams?.get('logged_out') === 'true';
    if (loggedOut) {
      setSuccessMessage('You have been logged out successfully.');
      return;
    }

    const mode = searchParams?.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }

    // Auto-restore check: If user already has an active, valid session, avoid showing login screen
    async function checkExistingSession() {
      try {
        const sessRes = await fetch('/api/auth/session');
        const sessData = await sessRes.json();
        if (sessData.authenticated) {
          const userEmail = (sessData.email || '').toLowerCase();
          const isDev =
            userEmail === 'kaushikparth363@gmail.com' ||
            userEmail === 'kaushikparth353@gmail.com' ||
            sessData.role === 'developer';
          window.location.href = isDev ? '/developer' : '/admin';
          return;
        }

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const userEmail = (session.user.email || '').toLowerCase();
          const isDev =
            userEmail === 'kaushikparth363@gmail.com' ||
            userEmail === 'kaushikparth353@gmail.com' ||
            session.user.app_metadata?.role === 'developer';
          window.location.href = isDev ? '/developer' : '/admin';
        }
      } catch {
        // Fallback to presenting login form
      }
    }

    checkExistingSession();
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // ==========================================
    // 1. SIMPLE SIGN UP FLOW (NO OTP)
    // ==========================================
    if (isSignUp) {
      if (!displayName.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }

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
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }

      if (!agreedToPolicies) {
        setErrorMessage('Please check the box to agree to the Terms and Conditions and Privacy Policy.');
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: displayName.trim(),
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

        setSuccessMessage('Account created! Signing you in...');

        // Establish 14-day persistent Supabase client session
        const maxAge14DaysSeconds = 14 * 24 * 60 * 60;
        const supabase = createClient(maxAge14DaysSeconds);

        const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInErr) {
          console.warn('Post-signup signin note:', signInErr.message);
        }

        const finalUserId = authData?.user?.id || data.userId;
        if (finalUserId) {
          try {
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: finalUserId,
                email: cleanEmail,
                role: 'creator',
                rememberDays: 14,
              }),
            });
          } catch (sessErr) {
            console.warn('Session persistence establishment note:', sessErr);
          }
        }

        setTimeout(() => {
          window.location.href = '/admin?welcome=true';
        }, 300);
      } catch {
        setErrorMessage('Network error during registration. Please try again.');
        setIsLoading(false);
      }
      return;
    }

    // ==========================================
    // 2. SIGN IN FLOW (PERSISTENT 14 DAYS)
    // ==========================================
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const isDesignatedDev =
        cleanEmail === 'kaushikparth363@gmail.com' ||
        cleanEmail === 'kaushikparth353@gmail.com';

      const effectiveDays = rememberMe ? rememberDuration : 1;
      const maxAgeSeconds = effectiveDays * 24 * 60 * 60;
      const supabase = createClient(maxAgeSeconds);

      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // Handle accounts that were created unconfirmed during past OTP testing
      if (
        error &&
        (error.message.toLowerCase().includes('confirm') ||
          error.message.toLowerCase().includes('not confirmed'))
      ) {
        try {
          await fetch('/api/auth/auto-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail }),
          });

          // Retry sign-in now that account is auto-confirmed
          const retry = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          data = retry.data;
          error = retry.error;
        } catch {
          // Fall through to error handler
        }
      }

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage('Invalid email address or password. Please check your credentials.');
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      const isDeveloperAccount =
        isDesignatedDev ||
        data?.user?.app_metadata?.role === 'developer' ||
        data?.user?.user_metadata?.role === 'developer';

      // Establish secure 14-day persistent session on the server
      if (data?.user?.id) {
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              email: cleanEmail,
              role: isDeveloperAccount ? 'developer' : 'creator',
              rememberDays: effectiveDays,
            }),
          });
        } catch (sessErr) {
          console.warn('Session cookie establishment note:', sessErr);
        }
      }

      setSuccessMessage('Signing in...');

      // Full document navigation guarantees all cookies are committed and transmitted in HTTP headers
      window.location.href = isDeveloperAccount ? '/developer' : '/admin';
      return;
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMessage(
        err?.message || 'An unexpected error occurred during sign in. Please try again.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1625] flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/brand/logo.png"
            alt="Dear You"
            className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-xl font-semibold tracking-tight">Dear You</span>
        </Link>
        <Link
          href="/"
          className="text-xs text-platform-muted hover:text-platform-dark transition-colors"
        >
          ← Return to Home
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="flex items-center justify-center my-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md p-6 sm:p-9 rounded-3xl bg-white border border-black/5 shadow-xl text-center relative overflow-hidden"
        >
          {/* Official Brand Logo */}
          <div className="w-16 h-16 mx-auto flex items-center justify-center mb-3">
            <img
              src="/brand/logo.png"
              alt="Dear You"
              className="w-14 h-14 object-contain"
            />
          </div>

          {/* Toggle between Sign In and Sign Up */}
          <div className="inline-flex items-center p-1 rounded-full bg-black/5 border border-black/5 mb-5 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`px-4 py-1.5 rounded-full transition-all font-medium cursor-pointer ${
                !isSignUp
                  ? 'bg-white shadow-xs text-platform-dark font-semibold'
                  : 'text-platform-muted hover:text-platform-dark'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`px-4 py-1.5 rounded-full transition-all font-medium cursor-pointer ${
                isSignUp
                  ? 'bg-white shadow-xs text-platform-dark font-semibold'
                  : 'text-platform-muted hover:text-platform-dark'
              }`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="font-serif text-2xl font-normal text-platform-dark mb-1">
            {isSignUp ? 'Join Dear You' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-platform-muted mb-6">
            {isSignUp
              ? 'Create heartfelt personalized surprise gifts that last forever.'
              : 'Sign in to access your digital gifts, memory walls and creator studio.'}
          </p>

          {/* Error / Success Notifications */}
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

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Display Name (Signup Only) */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. Maya Sharma"
                    required={isSignUp}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet"
                  />
                  <User className="w-4 h-4 text-platform-muted absolute left-3" />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-platform-dark mb-1">
                Email Address
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

            {/* Password Field */}
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
                  placeholder={isSignUp ? 'At least 6 characters' : '••••••••••••'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  minLength={isSignUp ? 6 : undefined}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet"
                />
                <Lock className="w-4 h-4 text-platform-muted absolute left-3" />
              </div>
              {!isSignUp && (
                <div className="flex justify-end mt-1.5">
                  <Link
                    href="/forgot-password?method=email"
                    className="text-[11px] text-platform-violet hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {/* Remember Me Option (Sign In Only) */}
            {!isSignUp && (
              <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-black/5 text-left space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="rememberMeCheckbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-platform-violet border-black/20 focus:ring-platform-violet/40 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-platform-dark">
                      Remember me for {rememberDuration} days
                    </span>
                  </label>

                  {rememberMe && (
                    <div className="inline-flex items-center bg-black/5 p-0.5 rounded-lg text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setRememberDuration(7)}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          rememberDuration === 7
                            ? 'bg-white shadow-xs font-semibold text-platform-dark'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        7 days
                      </button>
                      <button
                        type="button"
                        onClick={() => setRememberDuration(14)}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          rememberDuration === 14
                            ? 'bg-white shadow-xs font-semibold text-platform-dark'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        14 days
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 font-light pl-6">
                  {rememberMe
                    ? `Stay signed in for ${rememberDuration} days on this device.`
                    : 'Session will end when you close your browser.'}
                </p>
              </div>
            )}

            {/* Terms and Conditions Checkbox (SignUp Only) */}
            {isSignUp && (
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
                <div className="text-[11px] text-stone-500 font-light mt-2 pl-1 flex items-center gap-1.5">
                  <span>✓ Stays signed in for 14 days on this device</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (isSignUp && !agreedToPolicies)}
              className="w-full mt-4 py-3 rounded-xl bg-[#1A1625] text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick link hint for Developer Team entry */}
          <div className="mt-6 pt-4 border-t border-black/5 text-center">
            <p className="text-[11px] text-platform-muted">
              Platform Developers: Sign in with your authorized email to access the{' '}
              <Link href="/developer" className="underline font-semibold text-platform-dark">
                Developer Console
              </Link>
              .
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

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <AuthPageContent />
    </Suspense>
  );
}
