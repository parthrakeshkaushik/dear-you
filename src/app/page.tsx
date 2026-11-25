'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Gift, Lock, Heart, ArrowRight, ShieldCheck, Palette, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PlatformThemeToggle } from '@/components/common/PlatformThemeToggle';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediate recovery detection: Catch recovery token fragment (#access_token=...&type=recovery)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || (hash.includes('access_token=') && !hash.includes('type=signup'))) {
        window.location.replace('/reset-password' + hash);
        return;
      }
    }

    // Listen for Supabase auth state change for PASSWORD_RECOVERY event
    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          window.location.replace('/reset-password');
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    } catch {}
  }, [router]);
  return (
    <div className="relative min-h-screen bg-platform-bg text-platform-text overflow-hidden flex flex-col justify-between transition-colors duration-200">
      {/* Soft Ambient Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-500/15 to-pink-500/15 blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-amber-500/15 to-violet-500/15 blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group transition-transform active:scale-98"
          title="Dear You"
        >
          <img
            src="/brand/logo.png"
            alt="Dear You"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-2xl tracking-tight text-platform-text font-semibold">
            Dear You
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <PlatformThemeToggle variant="button" showLabel />
          <Link
            href="/g/demo-gift"
            className="hidden sm:inline-block text-xs sm:text-sm font-medium text-platform-muted hover:text-platform-text transition-colors px-2 py-1.5"
          >
            Demo Card
          </Link>
          <Link
            href="/signup"
            className="text-xs font-semibold text-white bg-platform-violet hover:bg-platform-violet/90 transition-colors rounded-full px-3.5 sm:px-4 py-2 shadow-xs"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="text-xs tracking-wider uppercase font-semibold text-platform-text hover:text-platform-violet transition-colors border border-platform-border rounded-full px-3.5 py-2 hover:border-platform-borderStrong bg-black/5 dark:bg-white/10"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 text-center flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-platform-cardSubtle border border-platform-border shadow-xs mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-platform-violet" />
          <span className="text-xs font-medium text-platform-muted tracking-wide">
            Every person deserves a little something special.
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl text-platform-text leading-[1.18] font-normal tracking-tight"
        >
          One platform. Unlimited gifts.
          <br />
          <span className="italic font-light text-platform-violet">Every gift tells a story.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
          className="mt-6 text-base sm:text-lg text-platform-muted max-w-2xl font-light leading-relaxed"
        >
          A reusable, personalized digital gifting platform. Craft heartfelt digital universes
          with bespoke visual themes, memory galleries, interactive candle-blowing cakes,
          secret messages, and time-bound memories.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/g/demo-gift"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-platform-btnBg text-platform-btnText text-sm font-medium hover:bg-platform-btnHover transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <span>Open Sample Gift</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-platform-card border border-platform-border text-platform-text text-sm font-medium hover:bg-platform-cardSubtle transition-all shadow-xs"
          >
            <span>Creator Dashboard</span>
          </Link>
        </motion.div>

        {/* Value Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45 }}
          className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full max-w-3xl"
        >
          <div className="p-5 rounded-2xl bg-platform-card border border-platform-border shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-platform-violet mb-3">
              <Palette className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-base font-semibold text-platform-text">Per-Gift Theming</h3>
            <p className="mt-1 text-xs text-platform-muted leading-relaxed">
              Seven crafted aesthetic presets or completely custom palettes. No two gifts look alike.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-platform-card border border-platform-border shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-base font-semibold text-platform-text">Protected & Private</h3>
            <p className="mt-1 text-xs text-platform-muted leading-relaxed">
              Protected by custom passwords and session tokens. Safe from search engines and unauthorized access.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-platform-card border border-platform-border shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-base font-semibold text-platform-text">Graceful Expiry</h3>
            <p className="mt-1 text-xs text-platform-muted leading-relaxed">
              Server-checked expiration dates transition smoothly to an emotional parting closing letter.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 border-t border-platform-border flex flex-col sm:flex-row items-center justify-between text-xs text-platform-muted">
        <p>© {new Date().getFullYear()} Dear You. Thoughtfully designed for meaningful connections.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <Link href="/login" className="hover:text-platform-text underline transition-colors">
            Administrator Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
