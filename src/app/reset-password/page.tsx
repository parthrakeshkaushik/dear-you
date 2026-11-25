'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PlatformThemeToggle } from '@/components/common/PlatformThemeToggle';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function evaluateRecoverySession() {
      // 1. Check for explicit error query parameters
      const urlError = searchParams?.get('error') || searchParams?.get('error_description');
      if (urlError) {
        if (isMounted) {
          setIsCheckingSession(false);
          setHasValidSession(false);
          setErrorMessage(
            urlError.toLowerCase().includes('expired')
              ? 'Your password reset link has expired. Please request a new one.'
              : 'Your reset link is invalid or has already been used. Please request another link.'
          );
        }
        return;
      }

      const supabase = createClient();

      // 2. Check token_hash in query string (Bot-Immune Direct Recovery Link)
      const token_hash = searchParams?.get('token_hash');
      const type = (searchParams?.get('type') as any) || 'recovery';

      if (token_hash) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type,
          });

          if (!error && data?.session) {
            if (isMounted) {
              setHasValidSession(true);
              setIsCheckingSession(false);
              setErrorMessage(null);
              // Clean query parameters from URL so refreshing doesn't re-trigger OTP verification
              if (typeof window !== 'undefined' && window.history?.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }
            return;
          } else if (error) {
            console.warn('[AUTH_DIAGNOSTIC] token_hash verifyOtp error:', error.message);
            if (isMounted) {
              setIsCheckingSession(false);
              setHasValidSession(false);
              setErrorMessage(
                error.message.toLowerCase().includes('expired')
                  ? 'Your password reset link has expired. Please request a new one.'
                  : 'Your reset link is invalid or has already been used. Please request another link.'
              );
            }
            return;
          }
        } catch (otpErr: any) {
          console.warn('[AUTH_DIAGNOSTIC] verifyOtp exception:', otpErr?.message);
        }
      }

      // 3. Process PKCE exchange code if provided in query string
      const code = searchParams?.get('code');
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError && data?.session) {
            if (isMounted) {
              setHasValidSession(true);
              setIsCheckingSession(false);
              setErrorMessage(null);
              if (typeof window !== 'undefined' && window.history?.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }
            return;
          }
        } catch (e: any) {
          console.warn('[AUTH_DIAGNOSTIC] Code exchange exception:', e?.message);
        }
      }

      // 4. Process URL Hash fragment if present (#access_token=...&type=recovery)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash;
        if (hash.includes('error=')) {
          if (isMounted) {
            setIsCheckingSession(false);
            setHasValidSession(false);
            setErrorMessage('Your password reset link has expired or is invalid. Please request a new one.');
          }
          return;
        }
      }

      // 4. Check for active Supabase session
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session && isMounted) {
          setHasValidSession(true);
          setIsCheckingSession(false);
          return;
        }
      } catch (sessErr: any) {
        console.warn('[AUTH_DIAGNOSTIC] Session lookup note:', sessErr?.message);
      }

      // 5. Subscribe to auth state changes (e.g. hash parsed asynchronously by Supabase client)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;

        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setHasValidSession(true);
          setIsCheckingSession(false);
          setErrorMessage(null);
        }
      });

      // Allow a brief grace period for client-side hash processing
      const timeoutId = setTimeout(async () => {
        if (!isMounted) return;
        try {
          const {
            data: { session: finalSession },
          } = await supabase.auth.getSession();
          if (finalSession) {
            setHasValidSession(true);
          } else {
            setHasValidSession(false);
            setErrorMessage('No active password reset session found. Please request a fresh reset link.');
          }
        } catch {
          setHasValidSession(false);
        } finally {
          setIsCheckingSession(false);
        }
      }, 1200);

      return () => {
        isMounted = false;
        subscription.unsubscribe();
        clearTimeout(timeoutId);
      };
    }

    evaluateRecoverySession();
  }, [searchParams]);

  // Real-time validation checks
  const isLengthValid = newPassword.length >= 6;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = isLengthValid && isMatchValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isLengthValid) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (!isMatchValid) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        if (error.message.toLowerCase().includes('same password')) {
          setErrorMessage('New password must be different from your old password.');
        } else if (
          error.message.toLowerCase().includes('session') ||
          error.message.toLowerCase().includes('jwt')
        ) {
          setErrorMessage('Your password reset session has expired. Please request a new reset link.');
          setHasValidSession(false);
        } else {
          setErrorMessage(error.message || 'Failed to update password. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      // Success!
      setSuccessMessage('Your password has been successfully updated! Redirecting to sign in...');

      // Invalidate recovery session so user starts fresh with newly set credentials
      try {
        await supabase.auth.signOut();
      } catch {}

      // Redirect smoothly to sign in
      setTimeout(() => {
        router.push('/login?reset_success=true');
      }, 1400);
    } catch {
      setErrorMessage('A network error occurred while updating your password. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-platform-bg text-platform-text flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 group" title="Dear You">
          <img
            src="/brand/logo.png"
            alt="Dear You"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-xl font-semibold tracking-tight text-platform-text">Dear You</span>
        </Link>
        <div className="flex items-center gap-3">
          <PlatformThemeToggle variant="compact" />
          <Link
            href="/login"
            className="text-xs text-platform-muted hover:text-platform-text transition-colors inline-flex items-center gap-1 font-medium"
          >
            <span>Return to Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex items-center justify-center my-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md p-6 sm:p-9 rounded-3xl bg-platform-card border border-platform-border shadow-xl text-center relative overflow-hidden"
        >
          {/* Brand Logo */}
          <div className="w-16 h-16 mx-auto flex items-center justify-center mb-3">
            <img
              src="/brand/logo.png"
              alt="Dear You"
              className="w-14 h-14 object-contain"
            />
          </div>

          <span className="text-[10px] font-semibold tracking-wider text-platform-violet uppercase font-mono bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            Account Security
          </span>

          <h1 className="font-serif text-2xl sm:text-3xl text-platform-text font-normal mt-2.5">
            Create a New Password
          </h1>

          <p className="mt-2 text-xs text-platform-muted leading-relaxed font-light">
            Choose a strong, unique password for your Dear You account.
          </p>

          {/* Initial Session Verification State */}
          {isCheckingSession ? (
            <div className="my-8 py-6 flex flex-col items-center justify-center gap-3 text-xs text-platform-muted">
              <RefreshCw className="w-6 h-6 text-platform-violet animate-spin" />
              <span>Verifying your recovery session...</span>
            </div>
          ) : !hasValidSession && !successMessage ? (
            /* Expired or Invalid Link State */
            <div className="mt-6 text-left">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Recovery Link Invalid or Expired</p>
                  <p className="mt-1 font-light leading-relaxed">
                    {errorMessage ||
                      'Your password reset link is invalid or has expired. Please request another link to securely reset your password.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Link
                  href="/forgot-password"
                  className="w-full py-3 rounded-xl bg-[#1A1625] text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Request New Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full py-2.5 text-xs text-platform-muted hover:text-platform-dark transition-colors flex items-center justify-center"
                >
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : successMessage ? (
            /* Success State */
            <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-left flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Password Updated Successfully</p>
                <p className="mt-1 font-light leading-relaxed">{successMessage}</p>
              </div>
            </div>
          ) : (
            /* Password Reset Form */
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1.5">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-platform-inputBg text-platform-text border border-platform-inputBorder text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                  />
                  <Lock className="w-4 h-4 text-platform-muted absolute left-3" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="p-1.5 text-platform-muted hover:text-platform-text absolute right-2.5"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-platform-inputBg text-platform-text border border-platform-inputBorder text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                  />
                  <Lock className="w-4 h-4 text-platform-muted absolute left-3" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1.5 text-platform-muted hover:text-platform-text absolute right-2.5"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirement Checklist */}
              <div className="p-3 rounded-xl bg-black/5 text-[11px] space-y-1.5 text-stone-600">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                      isLengthValid
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-300 text-stone-600'
                    }`}
                  >
                    {isLengthValid ? '✓' : '•'}
                  </span>
                  <span className={isLengthValid ? 'text-emerald-700 font-medium' : ''}>
                    At least 6 characters in length
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                      isMatchValid
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-300 text-stone-600'
                    }`}
                  >
                    {isMatchValid ? '✓' : '•'}
                  </span>
                  <span className={isMatchValid ? 'text-emerald-700 font-medium' : ''}>
                    Passwords match
                  </span>
                </div>
              </div>

              {/* Error Alert */}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full py-3 rounded-xl bg-[#1A1625] text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </main>

      <footer className="text-center text-xs text-platform-muted">
        <p>© {new Date().getFullYear()} Dear You. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
          <div className="w-8 h-8 rounded-full border-2 border-platform-violet border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
