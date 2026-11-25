'use client';

import React, { useState } from 'react';
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
  Code2,
  Terminal,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DeveloperLayoutProps {
  children: React.ReactNode;
}

export default function DeveloperLayout({ children }: DeveloperLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/developer', label: 'Console Overview', icon: Terminal },
    { href: '/developer/users', label: 'User Management', icon: Users },
    { href: '/developer/gifts', label: 'Gift Inspection', icon: Gift },
    { href: '/developer/analytics', label: 'Analytics & Use Cases', icon: BarChart3 },
    { href: '/developer/audit-logs', label: 'Audit Logs', icon: FileSearch },
    { href: '/developer/settings', label: 'Developer Settings', icon: Settings },
  ];

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [developerEmail, setDeveloperEmail] = useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadDevIdentity() {
      try {
        const sessRes = await fetch('/api/auth/session');
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.authenticated && sessData.email && isMounted) {
            setDeveloperEmail(sessData.email);
            return;
          }
        }
      } catch {}

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          setDeveloperEmail(user.email || null);
        }
      } catch {}
    }
    loadDevIdentity();
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

  return (
    <div className="min-h-screen bg-[#090D16] text-[#E2E8F0] flex flex-col md:flex-row antialiased">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-[#0F172A] border-b border-white/10 sticky top-0 z-40">
        <Link href="/developer" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-sm">
            DY
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
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-stone-400 hover:text-white cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-[#0D1322] border-r border-white/10 p-6 flex flex-col justify-between shrink-0 fixed md:sticky top-0 h-[calc(100vh-65px)] md:h-screen z-30 overflow-y-auto`}
      >
        <div>
          {/* Logo & Platform Info */}
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-mono font-bold text-base shadow-inner">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-lg font-semibold tracking-tight text-white block leading-tight">
                Dear You
              </span>
              <span className="text-[10px] font-mono text-indigo-400 tracking-wider uppercase font-semibold">
                Developer Console
              </span>
            </div>
          </div>

          {/* Developer Authorization Badge */}
          <div className="mb-6 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-[11px] font-mono overflow-hidden">
              <span className="text-white block font-medium truncate">
                {developerEmail || 'Platform Owner'}
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
        <div className="pt-6 border-t border-white/10 space-y-1.5">
          <Link
            href="/admin"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Switch to Creator Admin</span>
            </span>
          </Link>

          <button
            onClick={() => handleSignOut(false)}
            disabled={isSigningOut}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSigningOut ? 'Signing Out...' : 'Developer Sign Out'}</span>
          </button>

          <button
            onClick={() => handleSignOut(true)}
            disabled={isSigningOut}
            className="w-full flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer font-mono"
            title="Revokes all active sessions across desktop and mobile devices"
          >
            <span>Log out from all devices</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 sm:p-8 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
