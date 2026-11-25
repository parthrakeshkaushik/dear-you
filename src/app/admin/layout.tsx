'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Gift,
  LayoutDashboard,
  PlusCircle,
  Palette,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Mail,
  ShieldAlert,
  ChevronRight,
  User,
  ChevronsUpDown,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AuthenticatedProfile {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  accountType: 'Developer' | 'Creator';
  avatarUrl?: string | null;
  createdAt?: string | null;
}

function getInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return 'U';
  const clean = nameOrEmail.trim();
  if (clean.includes('@')) {
    return clean[0].toUpperCase();
  }
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function VerifiedBanner() {
  const searchParams = useSearchParams();
  const isNewlyVerified = searchParams?.get('verified') === 'true';

  if (!isNewlyVerified) return null;

  return (
    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5 shadow-sm">
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      <span>Email verified successfully! Your Gift Creator Studio is active and ready to publish.</span>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profile, setProfile] = useState<AuthenticatedProfile | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);

  const navLinks = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/gifts', label: 'All Gifts', icon: Gift },
    { href: '/admin/create', label: 'New Gift Builder', icon: PlusCircle },
    { href: '/admin/themes', label: 'Theme Library', icon: Palette },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  // Fetch verified user identity from authenticated server profile endpoint
  useEffect(() => {
    let isMounted = true;

    async function loadIdentity() {
      // 1. Primary: Fetch verified account profile from secure server endpoint
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user && isMounted) {
            setProfile(data.user);
            setIsDeveloper(data.user.role === 'developer');
            return;
          }
        }
      } catch (profileErr) {
        console.warn('Profile fetch note in layout:', profileErr);
      }

      // 2. Fallback: Check persistent session endpoint
      try {
        const sessRes = await fetch('/api/auth/session');
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.authenticated && isMounted) {
            const email = (sessData.email || '').toLowerCase().trim();
            const isDev =
              email === 'kaushikparth363@gmail.com' ||
              email === 'kaushikparth353@gmail.com' ||
              sessData.role === 'developer';

            setIsDeveloper(isDev);
            setProfile({
              id: sessData.userId || '',
              email: email || 'Email unavailable',
              displayName: sessData.displayName || null,
              role: isDev ? 'developer' : 'creator',
              accountType: isDev ? 'Developer' : 'Creator',
            });
            return;
          }
        }
      } catch {}

      // 3. Fallback: Supabase Client Auth
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && isMounted) {
          const email = (user.email || '').toLowerCase().trim();
          const isDev =
            email === 'kaushikparth363@gmail.com' ||
            email === 'kaushikparth353@gmail.com' ||
            user.app_metadata?.role === 'developer';

          setIsDeveloper(isDev);
          setProfile({
            id: user.id,
            email: email || 'Email unavailable',
            displayName:
              user.user_metadata?.display_name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              null,
            role: isDev ? 'developer' : 'creator',
            accountType: isDev ? 'Developer' : 'Creator',
            avatarUrl: user.user_metadata?.avatar_url || null,
            createdAt: user.created_at,
          });
        }
      } catch {}
    }

    loadIdentity();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Dismiss profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const handleLogout = async (global = false) => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    try {
      await fetch(`/api/auth/logout${global ? '?global=true' : ''}`, { method: 'POST' });
    } catch {}
    router.push('/login?logged_out=true');
  };

  // Reusable Profile Widget & Dropdown
  const renderProfileSection = (isMobile = false) => {
    const displayName = profile?.displayName || 'Your Account';
    const email = profile?.email || 'Email unavailable';
    const accountRoleLabel = profile?.role === 'developer' ? 'Platform Developer' : 'Gift Creator';
    const isDevRole = profile?.role === 'developer' || isDeveloper;

    return (
      <div className="relative" ref={isMobile ? undefined : dropdownRef}>
        <button
          type="button"
          onClick={() => setProfileDropdownOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-2 sm:p-2.5 rounded-2xl bg-black/5 hover:bg-black/10 transition-all text-left cursor-pointer border border-black/5 focus:outline-none focus:ring-2 focus:ring-platform-violet/20"
          aria-label="Account identity and profile options"
          aria-expanded={profileDropdownOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar Initials / Photo */}
            <div className="w-8 h-8 rounded-full bg-platform-violet/15 text-platform-violet font-semibold text-xs flex items-center justify-center shrink-0 border border-platform-violet/25 shadow-2xs">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{getInitials(displayName || email)}</span>
              )}
            </div>
            {/* Name & Truncated Email */}
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-platform-dark truncate leading-snug">
                {displayName}
              </span>
              <span
                className="block text-[11px] text-platform-muted truncate leading-snug font-normal"
                title={email}
              >
                {email}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-platform-muted shrink-0 ml-1.5" />
        </button>

        {/* Profile Dropdown Panel */}
        <AnimatePresence>
          {profileDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute bottom-full left-0 mb-2 w-full min-w-[240px] bg-white rounded-2xl shadow-xl border border-black/10 p-2 z-50 overflow-hidden"
            >
              {/* Account Identity Details */}
              <div className="p-3 bg-stone-50 rounded-xl mb-1.5 border border-black/5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-full bg-platform-violet/20 text-platform-violet font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(displayName || email)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-platform-dark truncate">
                      {displayName}
                    </span>
                    <span className="block text-[11px] text-platform-muted break-all leading-tight font-mono">
                      {email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/5">
                  <span className="text-[10px] text-stone-500 font-medium">Account Role:</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isDevRole
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}
                  >
                    {accountRoleLabel}
                  </span>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="space-y-0.5">
                <Link
                  href="/admin/settings?tab=profile"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-platform-dark hover:bg-black/5 transition-colors font-medium"
                >
                  <User className="w-3.5 h-3.5 text-platform-muted" />
                  <span>Profile Settings</span>
                </Link>

                {isDevRole && (
                  <Link
                    href="/developer"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      if (isMobile) setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-indigo-700 hover:bg-indigo-50 transition-colors font-semibold"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Developer Console</span>
                  </Link>
                )}

                <div className="my-1 border-t border-black/5" />

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleLogout(false);
                  }}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer font-medium disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1A1625] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-black/5 sticky top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <img
            src="/brand/logo.png"
            alt="Dear You"
            className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-lg font-semibold tracking-tight">Dear You</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-platform-muted hover:text-platform-dark cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r border-black/5 p-6 flex flex-col justify-between shrink-0 fixed md:sticky top-0 h-[calc(100vh-65px)] md:h-screen z-30 overflow-y-auto`}
      >
        <div>
          {/* Logo & Platform Info */}
          <Link
            href="/"
            title="Return to Homepage"
            className="hidden md:flex items-center gap-2.5 mb-8 group"
          >
            <img
              src="/brand/logo.png"
              alt="Dear You"
              className="w-9 h-9 object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <span className="font-serif text-xl font-semibold tracking-tight block leading-tight text-platform-dark">
                Dear You
              </span>
              <span className="text-[10px] text-platform-muted uppercase tracking-wider font-medium">
                Admin Console
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#1A1625] text-white shadow-xs'
                      : 'text-platform-muted hover:bg-black/5 hover:text-platform-dark'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Platform Developer Console Entry for Authorized Accounts */}
          {isDeveloper && (
            <div className="mt-4">
              <Link
                href="/developer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 border border-indigo-200/80 text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  <span>Developer Console</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              </Link>
            </div>
          )}

          {/* Quick Create Highlight */}
          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100/70">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-900 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-platform-violet" />
              <span>Personalized Gifting</span>
            </div>
            <p className="text-[11px] text-purple-800/80 leading-relaxed mb-3">
              Ready to craft an unforgettable surprise for someone special?
            </p>
            <Link
              href="/admin/create"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-platform-violet text-white text-xs font-medium hover:bg-platform-violet/90 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Gift</span>
            </Link>
          </div>
        </div>

        {/* Footer Actions & Authenticated User Identity */}
        <div className="pt-6 border-t border-black/5 space-y-3">
          {/* Profile Section in Sidebar */}
          {renderProfileSection(false)}

          <div className="space-y-1">
            <Link
              href="/g/demo-gift"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-platform-muted hover:text-platform-dark hover:bg-black/5 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Sample Recipient View</span>
              </span>
            </Link>

            <button
              onClick={() => handleLogout(false)}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </button>

            <button
              onClick={() => handleLogout(true)}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] text-stone-500 hover:text-rose-700 hover:bg-rose-50/50 transition-colors text-left cursor-pointer font-mono"
              title="Revokes all active sessions across desktop and mobile devices"
            >
              <span>Log out from all devices</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 sm:p-8 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto space-y-5">
        <Suspense fallback={null}>
          <VerifiedBanner />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
