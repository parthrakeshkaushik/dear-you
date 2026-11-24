'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/gifts', label: 'All Gifts', icon: Gift },
    { href: '/admin/create', label: 'New Gift Builder', icon: PlusCircle },
    { href: '/admin/themes', label: 'Theme Library', icon: Palette },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    // Clear session and navigate to login
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1A1625] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-black/5 sticky top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-platform-violet/20 text-platform-violet flex items-center justify-center">
            <Gift className="w-4 h-4" />
          </div>
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
          <div className="hidden md:flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-platform-violet/15 text-platform-violet flex items-center justify-center shadow-xs">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-semibold tracking-tight block leading-tight">
                Dear You
              </span>
              <span className="text-[10px] text-platform-muted uppercase tracking-wider font-medium">
                Admin Console
              </span>
            </div>
          </div>

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

        {/* Footer Actions */}
        <div className="pt-6 border-t border-black/5 space-y-2">
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
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
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
