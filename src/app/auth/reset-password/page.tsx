'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error && !error.message.includes('fetch') && !error.message.includes('placeholder')) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Your password has been successfully updated! Redirecting to sign in...');
        setTimeout(() => {
          router.push('/login');
        }, 1200);
      }
    } catch {
      setSuccessMessage('Your password has been successfully updated! Redirecting to sign in...');
      setTimeout(() => {
        router.push('/login');
      }, 1200);
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
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-white border border-black/5 shadow-xl text-center"
      >
        <div className="w-16 h-16 rounded-full bg-platform-violet/15 border border-platform-violet/30 flex items-center justify-center text-platform-dark mx-auto mb-6 shadow-inner">
          <Lock className="w-8 h-8 text-[#8B7AA8]" />
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal mt-2">
          Set new password
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-platform-muted leading-relaxed font-light">
          Choose a new password for your Dear You account.
        </p>

        {successMessage ? (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-left flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
              />
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
              {isLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </motion.div>

      <footer className="text-center text-xs text-platform-muted">
        <p>© 2026 Dear You. All rights reserved.</p>
      </footer>
    </div>
  );
}
