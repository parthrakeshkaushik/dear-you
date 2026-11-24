'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Lock,
  Mail,
  Smartphone,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isDisposableEmail } from '@/lib/security/disposable-email';
import {
  SUPPORTED_COUNTRY_CODES,
  normalizePhoneNumber,
  isValidE164Phone,
  getPhoneBridgeEmail,
} from '@/lib/security/phone-utils';
import CaptchaWidget from '@/components/auth/CaptchaWidget';
import { SessionDurationDays, DEFAULT_SESSION_DAYS } from '@/lib/auth/persistent-session';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'mobile'>('email');

  // Form Fields
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Persistent Login & Remember Me State
  const [rememberMe, setRememberMe] = useState(true);
  const [rememberDuration, setRememberDuration] = useState<SessionDurationDays>(14);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check URL parameters and restore existing active sessions on mount
  useEffect(() => {
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

    // Auto-restore check: If user already has an active, valid session, avoid showing login screen
    async function checkExistingSession() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const sessRes = await fetch('/api/auth/session');
          const sessData = await sessRes.json();
          if (sessData.authenticated) {
            const isDev =
              session.user.email?.includes('dev') ||
              session.user.email?.includes('owner');
            router.replace(isDev ? '/developer' : '/admin');
          }
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

    // ==========================================
    // 1. SIGN UP SUBMISSION
    // ==========================================
    if (isSignUp) {
      if (!agreedToPolicies) {
        setErrorMessage('You must agree to the Terms and Conditions and Privacy Policy to register.');
        return;
      }

      if (!captchaToken) {
        setErrorMessage('Please complete the security verification (CAPTCHA) check.');
        return;
      }

      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }

      if (authMethod === 'email') {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setErrorMessage('Please enter a valid email address.');
          return;
        }

        if (isDisposableEmail(cleanEmail)) {
          setErrorMessage(
            'Disposable or temporary email addresses are not permitted. Please use your genuine email address.'
          );
          return;
        }
      } else {
        const e164 = normalizePhoneNumber(countryCode, mobileNumber);
        if (!isValidE164Phone(e164)) {
          setErrorMessage('Please enter a valid mobile number with correct digits.');
          return;
        }
      }

      setIsLoading(true);

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration_method: authMethod,
            full_name: displayName,
            email: email.trim().toLowerCase(),
            country_code: countryCode,
            mobile_number: mobileNumber.trim(),
            password,
            terms_accepted: agreedToPolicies,
            captcha_token: captchaToken,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || 'Registration failed. Please check your information.');
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Account registered! Redirecting to OTP verification...');
        setTimeout(() => {
          const params = new URLSearchParams({
            method: data.registration_method,
            identifier: data.raw_identifier,
            destination: data.destination,
            rememberDays: (rememberMe ? rememberDuration : 1).toString(),
          });
          router.push(`/verify-otp?${params.toString()}`);
        }, 800);
      } catch {
        setErrorMessage('Network error during registration. Please try again.');
        setIsLoading(false);
      }
      return;
    }

    // ==========================================
    // 2. SIGN IN SUBMISSION
    // ==========================================
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const isDeveloperAccount =
        authMethod === 'email' &&
        (email.toLowerCase().includes('dev') ||
          email.toLowerCase().includes('owner') ||
          email.toLowerCase() === 'developer1@dearyou.com' ||
          email.toLowerCase() === 'developer2@dearyou.com');

      const effectiveDays = rememberMe ? rememberDuration : 1;
      const maxAgeSeconds = effectiveDays * 24 * 60 * 60;
      const supabase = createClient(maxAgeSeconds);

      if (authMethod === 'email') {
        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          if (
            error.message.toLowerCase().includes('confirm') ||
            error.message.toLowerCase().includes('not confirmed')
          ) {
            router.push(`/verify-otp?method=email&identifier=${encodeURIComponent(cleanEmail)}`);
            return;
          }
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setErrorMessage('Invalid email address or password. Please check your credentials.');
          } else {
            setErrorMessage(error.message);
          }
          setIsLoading(false);
          return;
        }

        // Check if unconfirmed
        if (data?.user && !data.user.email_confirmed_at && !isDeveloperAccount) {
          router.push(`/verify-otp?method=email&identifier=${encodeURIComponent(cleanEmail)}`);
          return;
        }

        // Establish secure persistent session on the server
        if (data?.user?.id) {
          try {
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.user.id,
                rememberDays: effectiveDays,
              }),
            });
          } catch (sessErr) {
            console.warn('Session cookie establishment note:', sessErr);
          }
        }

        if (isDeveloperAccount) {
          router.push('/developer');
        } else {
          router.push('/admin');
        }
      } else {
        // Mobile Sign In
        const e164Phone = normalizePhoneNumber(countryCode, mobileNumber);
        if (!isValidE164Phone(e164Phone)) {
          setErrorMessage('Please enter a valid mobile number with correct digits.');
          setIsLoading(false);
          return;
        }

        const bridgeEmail = getPhoneBridgeEmail(e164Phone);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: bridgeEmail,
          password,
        });

        if (error) {
          if (
            error.message.toLowerCase().includes('confirm') ||
            error.message.toLowerCase().includes('not confirmed')
          ) {
            router.push(`/verify-otp?method=mobile&identifier=${encodeURIComponent(e164Phone)}`);
            return;
          }
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setErrorMessage('Invalid mobile number or password. Please check your credentials.');
          } else {
            setErrorMessage(error.message);
          }
          setIsLoading(false);
          return;
        }

        // Check if phone is unconfirmed
        if (
          data?.user &&
          !data.user.email_confirmed_at &&
          !data.user.user_metadata?.phone_verified
        ) {
          router.push(`/verify-otp?method=mobile&identifier=${encodeURIComponent(e164Phone)}`);
          return;
        }

        // Establish secure persistent session on the server
        if (data?.user?.id) {
          try {
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.user.id,
                rememberDays: effectiveDays,
              }),
            });
          } catch (sessErr) {
            console.warn('Session cookie establishment note:', sessErr);
          }
        }

        router.push('/admin');
      }
    } catch {
      // Local dev fallback
      if (email.toLowerCase().includes('dev') || email.toLowerCase().includes('owner')) {
        router.push('/developer');
      } else {
        router.push('/admin');
      }
    } finally {
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
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-6 sm:p-9 rounded-3xl bg-white border border-black/5 shadow-xl text-center relative overflow-hidden"
        >
          {/* Brand Icon */}
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-platform-violet mx-auto flex items-center justify-center mb-4 shadow-xs">
            {isSignUp ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>

          {/* Toggle between Sign In and Sign Up */}
          <div className="inline-flex items-center p-1 rounded-full bg-black/5 border border-black/5 mb-5 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage(null);
              }}
              className={`px-4 py-1.5 rounded-full transition-all font-medium ${
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
              }}
              className={`px-4 py-1.5 rounded-full transition-all font-medium ${
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

          {/* Authentication Method Selector (Email vs Mobile) */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-stone-100 border border-black/5 mb-5 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
                authMethod === 'email'
                  ? 'bg-white text-platform-dark shadow-xs font-semibold'
                  : 'text-platform-muted hover:text-platform-dark'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('mobile');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
                authMethod === 'mobile'
                  ? 'bg-white text-platform-dark shadow-xs font-semibold'
                  : 'text-platform-muted hover:text-platform-dark'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Number</span>
            </button>
          </div>

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
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Maya Sharma"
                    required={isSignUp}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet"
                  />
                  <User className="w-4 h-4 text-platform-muted absolute left-3" />
                </div>
              </div>
            )}

            {/* Option A: Email Field */}
            {authMethod === 'email' && (
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet"
                  />
                  <Mail className="w-4 h-4 text-platform-muted absolute left-3" />
                </div>
                {isSignUp && (
                  <p className="text-[10px] text-stone-600 mt-1 pl-1">
                    Disposable or burner emails are blocked for account safety.
                  </p>
                )}
              </div>
            )}

            {/* Option B: Mobile Number with Country Code */}
            {authMethod === 'mobile' && (
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  {/* Country Code Dropdown */}
                  <div className="relative w-28 shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full appearance-none pl-2.5 pr-6 py-2 rounded-xl border border-black/10 text-xs sm:text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet cursor-pointer"
                    >
                      {SUPPORTED_COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.dialCode}>
                          {country.flag} {country.dialCode}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-3 pointer-events-none" />
                  </div>

                  {/* Phone Number Input */}
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      required
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-black/10 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet"
                    />
                    <Smartphone className="w-4 h-4 text-platform-muted absolute left-3" />
                  </div>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-platform-dark mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40 focus:border-platform-violet"
                />
                <Lock className="w-4 h-4 text-platform-muted absolute left-3" />
              </div>
              {!isSignUp && (
                <div className="flex justify-end mt-1.5">
                  <Link
                    href={`/forgot-password?method=${authMethod}`}
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
              </div>
            )}

            {/* Cloudflare Turnstile / CAPTCHA Bot Protection (SignUp Only) */}
            {isSignUp && (
              <div className="pt-1">
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Security Verification
                </label>
                <CaptchaWidget
                  onVerify={(token) => {
                    setCaptchaToken(token);
                    if (errorMessage?.includes('CAPTCHA')) setErrorMessage(null);
                  }}
                  onError={(err) => setErrorMessage(err)}
                />
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-stone-600 pl-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-platform-violet" />
                  <span>Cloudflare bot and automated abuse protection</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (isSignUp && (!agreedToPolicies || !captchaToken))}
              className="w-full mt-4 py-3 rounded-xl bg-[#1A1625] text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {isSignUp
                      ? `Send ${authMethod === 'email' ? 'Email' : 'Mobile'} OTP`
                      : 'Sign In'}
                  </span>
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
