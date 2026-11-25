'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Smartphone,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  SUPPORTED_COUNTRY_CODES,
  normalizePhoneNumber,
  isValidE164Phone,
} from '@/lib/security/phone-utils';
import CaptchaWidget from '@/components/auth/CaptchaWidget';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const initialMethod = (searchParams?.get('method') as 'email' | 'mobile') || 'email';

  const [method, setMethod] = useState<'email' | 'mobile'>(initialMethod);
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!captchaToken) {
      setErrorMessage('Please complete the security verification (CAPTCHA) check.');
      return;
    }

    if (method === 'email') {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
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
      const identifier =
        method === 'email'
          ? email.trim().toLowerCase()
          : normalizePhoneNumber(countryCode, mobileNumber);

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          identifier,
          country_code: countryCode,
          captcha_token: captchaToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Password reset request failed.');
      } else {
        setSuccessMessage(data.message || 'Recovery instructions sent.');
      }
    } catch {
      setErrorMessage('Network error while requesting password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1625] flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
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
          Reset your password
        </h1>

        <p className="mt-2 text-xs text-platform-muted leading-relaxed font-light">
          Choose your recovery method and we’ll send you secure verification instructions.
        </p>

        {/* Method Toggle */}
        <div className="mt-5 p-1 rounded-2xl bg-stone-100/80 border border-stone-200/70 grid grid-cols-2 gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              method === 'email'
                ? 'bg-white text-platform-dark shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Via Email</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('mobile');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              method === 'mobile'
                ? 'bg-white text-platform-dark shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Via Mobile SMS</span>
          </button>
        </div>

        {successMessage ? (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-left flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Instructions Dispatched</p>
              <p className="mt-1 font-light leading-relaxed">{successMessage}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
            {method === 'email' ? (
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1">
                  Registered Email Address
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                  />
                  <Mail className="w-4 h-4 text-platform-muted absolute left-3" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1">
                  Registered Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="relative w-28 shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full appearance-none pl-2.5 pr-6 py-2 rounded-xl border border-black/10 text-xs sm:text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-platform-violet/40 cursor-pointer"
                    >
                      {SUPPORTED_COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.dialCode}>
                          {c.flag} {c.dialCode}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-3 pointer-events-none" />
                  </div>
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      required
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-black/10 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                    />
                    <Smartphone className="w-4 h-4 text-platform-muted absolute left-3" />
                  </div>
                </div>
              </div>
            )}

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
              {isLoading
                ? 'Processing...'
                : method === 'email'
                ? 'Send Reset Link'
                : 'Send Mobile Recovery Code'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-black/5">
          <Link
            href="/login"
            className="text-xs text-platform-violet hover:underline transition-colors"
          >
            Remember your password? Sign in
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
