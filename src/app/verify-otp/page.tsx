'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Smartphone,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { maskEmail, maskPhoneNumber } from '@/lib/security/phone-utils';
import { createClient } from '@/lib/supabase/client';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const method = (searchParams?.get('method') as 'email' | 'mobile') || 'email';
  const identifier = searchParams?.get('identifier') || searchParams?.get('email') || searchParams?.get('phone') || '';
  const initialDestination = searchParams?.get('destination') || '';

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Calculate masked display
  const displayDestination =
    initialDestination ||
    (method === 'email' ? maskEmail(identifier) : maskPhoneNumber(identifier));

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanChar;
    setOtpDigits(updated);
    setErrorMessage(null);

    // Auto-advance to next input
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are filled
    const fullOtp = updated.join('');
    if (fullOtp.length === 6) {
      handleVerify(fullOtp);
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste complete OTP
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasteData[i] || '';
    }
    setOtpDigits(updated);
    setErrorMessage(null);

    // Focus last filled or next empty
    const nextIdx = Math.min(pasteData.length, 5);
    inputRefs.current[nextIdx]?.focus();

    if (pasteData.length === 6) {
      handleVerify(pasteData);
    }
  };

  // Handle OTP Submission
  const handleVerify = async (tokenToVerify?: string) => {
    const token = tokenToVerify || otpDigits.join('');
    if (token.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          identifier,
          token,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Verification failed. Please check the code.');
      } else {
        if (data.token_hash) {
          try {
            const supabase = createClient();
            await supabase.auth.verifyOtp({
              token_hash: data.token_hash,
              type: 'magiclink',
            });
          } catch (authErr) {
            console.warn('Browser session activation note:', authErr);
          }
        }
        setSuccessMessage('Code verified successfully! Launching your Creator Studio...');
        setTimeout(() => {
          router.push(data.redirect || '/admin?verified=true');
        }, 800);
      }
    } catch {
      setErrorMessage('Network error during verification. Please check your connection.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Resend Request
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          identifier,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not dispatch a new code.');
      } else {
        setSuccessMessage('A fresh verification code has been dispatched!');
        setResendCooldown(data.cooldown || 60);
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMessage('Network error while requesting new OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const isEmail = method === 'email';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1625] flex flex-col justify-between p-6">
      {/* Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <img
            src="/brand/logo.png"
            alt="Dear You"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-xl text-[#1A1625] font-semibold tracking-tight">
            Dear You
          </span>
        </Link>
        <Link
          href="/login"
          className="text-xs text-platform-muted hover:text-platform-dark transition-colors inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change {isEmail ? 'Email' : 'Mobile'}</span>
        </Link>
      </div>

      {/* Main Verification Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full mx-auto my-8 p-7 sm:p-9 rounded-3xl bg-white border border-black/5 shadow-xl text-center relative"
      >
        {/* Animated Icon */}
        <div className="relative w-18 h-18 mx-auto mb-5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-platform-violet border border-purple-100 flex items-center justify-center shadow-xs">
            {isEmail ? (
              <Mail className="w-8 h-8 text-platform-violet" />
            ) : (
              <Smartphone className="w-8 h-8 text-platform-violet" />
            )}
          </div>
        </div>

        <span className="text-[10px] font-semibold tracking-wider text-platform-violet uppercase font-mono bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
          Mandatory Verification
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal mt-2.5">
          {isEmail ? 'Verify your email address' : 'Verify your mobile number'}
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-platform-muted leading-relaxed font-light">
          We sent a 6-digit verification code to:
        </p>

        {/* Masked Destination Pill */}
        <div className="mt-2 py-1.5 px-3.5 rounded-xl bg-purple-50/70 border border-purple-100/80 inline-flex items-center gap-2 text-xs font-mono font-medium text-platform-dark">
          <span>{displayDestination || (isEmail ? 'your email' : 'your phone')}</span>
        </div>

        {/* 6 Digit Input Boxes */}
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                autoComplete="one-time-code"
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold rounded-xl border transition-all outline-none ${
                  digit
                    ? 'border-platform-violet bg-purple-50/30 text-platform-dark shadow-xs'
                    : 'border-black/15 bg-stone-50/50 text-stone-800 focus:border-platform-violet focus:bg-white focus:ring-2 focus:ring-platform-violet/20'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-stone-600 mt-2 font-mono">
            Enter 6 digits or paste complete code
          </p>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left"
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
              className="mt-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          onClick={() => handleVerify()}
          disabled={isVerifying || otpDigits.join('').length !== 6}
          className="w-full mt-6 py-3 rounded-xl bg-[#1A1625] text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-purple-300" />
              <span>Verify & Continue</span>
            </>
          )}
        </button>

        {/* Resend & Cooldown */}
        <div className="mt-6 pt-5 border-t border-black/5 flex flex-col items-center gap-2">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="text-xs text-platform-dark font-medium hover:text-platform-violet transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:text-stone-400 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
            <span>
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : isResending
                ? 'Sending code...'
                : 'Resend Verification Code'}
            </span>
          </button>

          <Link
            href="/login"
            className="text-[11px] text-stone-500 hover:text-stone-800 transition-colors mt-2"
          >
            Entered wrong {isEmail ? 'email' : 'phone number'}? Change here
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="text-center text-xs text-platform-muted">
        <p>© {new Date().getFullYear()} Dear You. Secure Account Verification.</p>
      </footer>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
          <div className="w-8 h-8 rounded-full border-2 border-platform-violet border-t-transparent animate-spin" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
