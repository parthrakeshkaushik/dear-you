'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Gift,
  BarChart3,
  FileSearch,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Terminal,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Lock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PlatformThemeToggle } from '@/components/common/PlatformThemeToggle';

const AUTHORIZED_DEVELOPER_EMAILS = [
  'kaushikparth363@gmail.com',
  'kaushikparth353@gmail.com',
];

function isAuthorizedDev(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return AUTHORIZED_DEVELOPER_EMAILS.some((dev) => dev.toLowerCase() === clean);
}

interface DeveloperLayoutProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DeveloperConsoleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Developer Console Uncaught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0F172A] border border-rose-500/30 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-white mb-2">
              Console Exception Intercepted
            </h2>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed font-mono">
              {this.state.error?.message || 'An unexpected rendering error occurred inside Developer Console.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry View</span>
              </button>
              <Link
                href="/admin"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 text-xs font-semibold transition-all"
              >
                <span>Creator Admin</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function DeveloperLayout({ children }: DeveloperLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
  const [developerEmail, setDeveloperEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navLinks = [
    { href: '/developer', label: 'Console Overview', icon: Terminal },
    { href: '/developer/users', label: 'User Management', icon: Users },
    { href: '/developer/gifts', label: 'Gift Inspection', icon: Gift },
    { href: '/developer/analytics', label: 'Analytics & Use Cases', icon: BarChart3 },
    { href: '/developer/audit-logs', label: 'Audit Logs', icon: FileSearch },
    { href: '/developer/settings', label: 'Developer Settings', icon: Settings },
  ];

  // Verify developer credentials on layout initialization
  useEffect(() => {
    let isMounted = true;

    async function verifyDeveloperSession() {
      // 1. Check verified session API endpoint
      try {
        const sessRes = await fetch('/api/auth/session');
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.authenticated && sessData.email && isMounted) {
            const email = sessData.email.toLowerCase().trim();
            const authorized =
              isAuthorizedDev(email) ||
              sessData.role === 'developer' ||
              sessData.isDeveloper === true;

            if (authorized) {
              setDeveloperEmail(email);
              setAuthStatus('authorized');
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Session check note in Developer layout:', err);
      }

      // 2. Check profile endpoint
      try {
        const profRes = await fetch('/api/auth/profile');
        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.user && isMounted) {
            const email = (profData.user.email || '').toLowerCase().trim();
            const authorized =
              isAuthorizedDev(email) ||
              profData.user.role === 'developer';

            if (authorized) {
              setDeveloperEmail(email);
              setAuthStatus('authorized');
              return;
            }
          }
        }
      } catch {}

      // 3. Fallback: Supabase client auth session
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const email = (user.email || '').toLowerCase().trim();
          const authorized =
            isAuthorizedDev(email) ||
            user.app_metadata?.role === 'developer';

          if (authorized) {
            setDeveloperEmail(email);
            setAuthStatus('authorized');
            return;
          }
        }
      } catch (clientErr) {
        console.warn('Supabase client check note:', clientErr);
      }

      // If finished checking and not authorized
      if (isMounted) {
        setAuthStatus('unauthorized');
      }
    }

    verifyDeveloperSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async (global = false) => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    try {
      await fetch(`/api/auth/logout${global ? '?global=true' : ''}`, { method: 'POST' });
    } catch {
      // Ignore
    }
    router.push('/login?logged_out=true');
  };

  // State A: Checking authentication
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#090D16] text-[#E2E8F0] flex flex-col items-center justify-center p-6 antialiased">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center overflow-hidden p-2.5 shadow-xl animate-pulse">
            <img
              src="/brand/logo.png"
              alt="Dear You"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-serif text-lg font-semibold text-white block">
              Dear You Developer Console
            </span>
            <span className="text-xs font-mono text-indigo-400">
              Verifying platform developer credentials...
            </span>
          </div>
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // State B: Unauthorized access attempt
  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#090D16] text-[#E2E8F0] flex flex-col items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0F172A] border border-amber-500/30 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-normal text-white mb-2">
            Restricted System Area
          </h1>
          <p className="text-xs text-stone-400 leading-relaxed mb-6 font-sans">
            Developer Console access is restricted exclusively to authorized platform engineers and super administrators. Your account does not currently hold developer privileges.
          </p>
          <div className="space-y-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              <span>Return to Creator Dashboard</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-xs font-medium transition-all"
            >
              <span>Go to Dear You Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State C: Authorized Developer Experience
  return (
    <div className="min-h-screen bg-[#090D16] text-[#E2E8F0] flex flex-col md:flex-row antialiased">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-[#0F172A] border-b border-white/10 sticky top-0 z-40">
        <Link href="/developer" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden p-1">
            <img
              src="/brand/logo.png"
              alt="Dear You"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-serif text-base font-semibold tracking-tight text-white block leading-none">
              Dear You
            </span>
            <span className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase font-semibold">
              Owner Console
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <PlatformThemeToggle variant="compact" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-400 hover:text-white cursor-pointer rounded-lg hover:bg-white/5"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-indigo-400" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`${
          mobileMenuOpen
            ? 'fixed inset-x-0 bottom-0 top-[65px] z-50 block'
            : 'hidden'
        } md:block md:relative md:top-auto md:bottom-auto w-full md:w-64 bg-[#0D1322] border-r border-white/10 p-6 flex flex-col justify-between shrink-0 md:sticky md:top-0 h-[calc(100vh-65px)] md:h-screen z-30 overflow-y-auto`}
      >
        <div>
          {/* Logo & Platform Info */}
          <Link
            href="/"
            title="Return to Homepage"
            className="hidden md:flex items-center gap-3 mb-8 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shadow-inner overflow-hidden p-1">
              <img
                src="/brand/logo.png"
                alt="Dear You"
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div>
              <span className="font-serif text-lg font-semibold tracking-tight text-white block leading-tight">
                Dear You
              </span>
              <span className="text-[10px] font-mono text-indigo-400 tracking-wider uppercase font-semibold">
                Developer Console
              </span>
            </div>
          </Link>

          {/* Developer Authorization Badge */}
          <div className="mb-6 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-[11px] font-mono overflow-hidden">
              <span className="text-white block font-medium truncate" title={developerEmail || 'Authorized Account'}>
                {developerEmail || 'Platform Maintainer'}
              </span>
              <span className="text-indigo-300/80 text-[10px] font-semibold">
                Super Admin Access
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/developer'
                  ? pathname === '/developer'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md font-semibold'
                      : 'text-stone-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/10 space-y-2 mt-6 md:mt-0">
          <div className="px-3.5 py-1.5 flex items-center justify-between">
            <span className="text-[11px] font-mono text-stone-400">Theme</span>
            <PlatformThemeToggle variant="compact" />
          </div>

          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Switch to Creator Admin</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => handleSignOut(false)}
            disabled={isSigningOut}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSigningOut ? 'Signing Out...' : 'Developer Sign Out'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSignOut(true)}
            disabled={isSigningOut}
            className="w-full flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer font-mono"
            title="Revokes all active sessions across desktop and mobile devices"
          >
            <span>Log out from all devices</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area Protected by Error Boundary */}
      <main className="flex-1 p-5 sm:p-8 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        <DeveloperConsoleErrorBoundary>
          {children}
        </DeveloperConsoleErrorBoundary>
      </main>
    </div>
  );
}
