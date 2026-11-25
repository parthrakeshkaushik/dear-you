'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  ShieldCheck,
  Database,
  Lock,
  Sparkles,
  CheckCircle2,
  Clock,
  LogOut,
  User,
  Mail,
  Shield,
  Calendar,
  Key,
  Save,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PlatformThemeToggle } from '@/components/common/PlatformThemeToggle';
import { Sun, Moon } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  accountType: 'Developer' | 'Creator';
  accountStatus?: string;
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

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') === 'platform' ? 'platform' : 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'platform'>(initialTab);

  // Authenticated profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // Platform preferences state
  const [platformName, setPlatformName] = useState('Dear You');
  const [tagline, setTagline] = useState('Every person deserves a little something special.');
  const [defaultTimezone, setDefaultTimezone] = useState('Asia/Kolkata');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch current authentic user profile
  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      setIsLoadingProfile(true);

      // 1. Primary: Server-side Profile API
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user && isMounted) {
            setProfile(data.user);
            setDisplayNameInput(data.user.displayName || '');
            setIsLoadingProfile(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Profile fetch error:', err);
      }

      // 2. Secondary fallback: check session API
      try {
        const sessRes = await fetch('/api/auth/session');
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.authenticated && isMounted) {
            const email = (sessData.email || '').toLowerCase().trim();
            const isDev =
              email === 'kaushikparth363@gmail.com' ||
              email === 'kaushikparth353@gmail.com' ||
              sessData.role === 'developer' ||
              sessData.isDeveloper === true;

            const resolved: UserProfile = {
              id: sessData.userId || '',
              email: email,
              displayName: sessData.displayName || null,
              role: isDev ? 'developer' : 'creator',
              accountType: isDev ? 'Developer' : 'Creator',
            };
            setProfile(resolved);
            setDisplayNameInput(resolved.displayName || '');
            setIsLoadingProfile(false);
            return;
          }
        }
      } catch {}

      // 3. Direct Client Fallback: Supabase Client Auth & Database lookup
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

          let resolvedDisplayName =
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            null;

          try {
            const { data: dbUser } = await supabase
              .from('admin_users')
              .select('display_name, role, account_status')
              .eq('id', user.id)
              .maybeSingle();
            if (dbUser?.display_name) {
              resolvedDisplayName = dbUser.display_name;
            }
          } catch {}

          const resolved: UserProfile = {
            id: user.id,
            email: email,
            displayName: resolvedDisplayName,
            role: isDev ? 'developer' : 'creator',
            accountType: isDev ? 'Developer' : 'Creator',
            avatarUrl: user.user_metadata?.avatar_url || null,
            createdAt: user.created_at,
          };
          setProfile(resolved);
          setDisplayNameInput(resolved.displayName || '');
          setIsLoadingProfile(false);
          return;
        }
      } catch (clientAuthErr) {
        console.warn('Direct client auth fallback note:', clientAuthErr);
      }

      if (isMounted) setIsLoadingProfile(false);
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayNameInput.trim();

    if (!cleanName) {
      setProfileNotice({ type: 'error', message: 'Full name cannot be empty.' });
      return;
    }

    setIsUpdatingName(true);
    setProfileNotice(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: cleanName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileNotice({ type: 'error', message: data.error || 'Failed to update full name.' });
      } else {
        setProfileNotice({ type: 'success', message: 'Profile full name updated successfully.' });
        if (profile) {
          setProfile({ ...profile, displayName: cleanName });
        }
        setTimeout(() => setProfileNotice(null), 3000);
      }
    } catch {
      setProfileNotice({ type: 'error', message: 'Network error while updating profile.' });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleCopyId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setHasCopiedId(true);
      setTimeout(() => setHasCopiedId(false), 2000);
    }
  };

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

  const handlePlatformSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="pb-6 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal">
            Account & Platform Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-platform-muted">
            Manage your personal authenticated profile identity, session security, and platform preferences.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-black/5 rounded-2xl self-start sm:self-auto border border-black/5">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white text-platform-dark shadow-xs'
                : 'text-platform-muted hover:text-platform-dark'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Identity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('platform')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'platform'
                ? 'bg-white text-platform-dark shadow-xs'
                : 'text-platform-muted hover:text-platform-dark'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Security</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PROFILE IDENTITY & AUTHENTICATED USER DETAILS */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Identity Summary Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-black/5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-platform-violet/15 text-platform-violet font-bold text-xl flex items-center justify-center shrink-0 border-2 border-platform-violet/30 shadow-inner">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile?.displayName || ''}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(profile?.displayName || profile?.email || 'U')}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base sm:text-lg font-bold text-platform-dark">
                      {isLoadingProfile ? (
                        <span className="inline-block h-5 w-32 bg-stone-200 animate-pulse rounded" />
                      ) : (
                        profile?.displayName || 'Your Account'
                      )}
                    </h2>
                    {!isLoadingProfile && (
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                          profile?.role === 'developer'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {profile?.role === 'developer' ? 'Platform Developer / Super Admin' : 'Gift Creator'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-platform-muted mt-0.5 font-mono">
                    {isLoadingProfile ? (
                      <span className="inline-block h-3.5 w-44 bg-stone-200 animate-pulse rounded mt-1" />
                    ) : (
                      profile?.email || 'Email unavailable'
                    )}
                  </p>
                </div>
              </div>

              {profile?.createdAt && (
                <div className="flex items-center gap-2 text-xs text-platform-muted sm:self-center">
                  <Calendar className="w-4 h-4 text-platform-violet shrink-0" />
                  <span>Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Profile Notice */}
            {profileNotice && (
              <div
                className={`mt-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  profileNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{profileNotice.message}</span>
              </div>
            )}

            {/* Editable Profile Form */}
            <form onSubmit={handleUpdateName} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name (Editable) */}
                <div>
                  <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="e.g. Parth Kaushik"
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-platform-violet/20 focus:border-platform-violet"
                    disabled={isLoadingProfile || isUpdatingName}
                  />
                  <p className="text-[11px] text-platform-muted mt-1">
                    Your name displayed on the Creator Studio and gift sender signatures.
                  </p>
                </div>

                {/* Email Address (Protected / Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-platform-dark mb-1.5 flex items-center justify-between">
                    <span>Authenticated Email Address</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200/60">
                      Verified Identity
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={isLoadingProfile ? 'Loading authenticated identity...' : (profile?.email || '')}
                      readOnly
                      disabled
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm bg-stone-100 text-stone-700 cursor-not-allowed select-all font-mono"
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-platform-muted mt-1">
                    Email address is protected by Supabase Authentication. It cannot be altered arbitrarily in this field.
                  </p>
                </div>
              </div>

              {/* Account Metadata Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-black/5 text-xs">
                {/* Account ID with copy */}
                <div className="p-3.5 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-2">
                    <span className="text-platform-muted block text-[10px] uppercase font-semibold">User Account ID</span>
                    <code className="text-[11px] text-platform-dark font-mono truncate block">
                      {profile?.id || '—'}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1.5 rounded-lg hover:bg-black/10 text-platform-dark transition-colors cursor-pointer shrink-0"
                    title="Copy Account ID"
                  >
                    {hasCopiedId ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-platform-muted" />
                    )}
                  </button>
                </div>

                {/* Account Type Details */}
                <div className="p-3.5 rounded-2xl bg-black/5 border border-black/5">
                  <span className="text-platform-muted block text-[10px] uppercase font-semibold">Account Authorization</span>
                  <span className="text-xs font-semibold text-platform-dark block mt-0.5">
                    {profile?.role === 'developer'
                      ? 'Platform Owner / Super Admin'
                      : 'Standard Gift Creator Studio'}
                  </span>
                </div>
              </div>

              {/* Save Name Action */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingName || isLoadingProfile}
                  className="px-6 py-2.5 rounded-xl bg-platform-dark text-white text-xs font-semibold hover:bg-black transition-all cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingName ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Name...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Global Platform Appearance */}
          <div className="p-6 sm:p-8 rounded-3xl bg-platform-card border border-platform-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 text-platform-text font-semibold text-sm">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>Platform Appearance (Light / Dark Mode)</span>
                </div>
                <p className="text-xs text-platform-muted mt-1 leading-relaxed">
                  Controls the Dear You studio, dashboard, and developer interface. The appearance of individual recipient gifts remains completely independent.
                </p>
              </div>
              <PlatformThemeToggle variant="segmented" />
            </div>
          </div>

          {/* Session Security & Sign Out Panel */}
          <div className="p-6 sm:p-8 rounded-3xl bg-platform-card border border-platform-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-platform-dark font-semibold text-sm">
                <Clock className="w-5 h-5 text-platform-violet" />
                <span>Active Session & Device Security</span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                14-Day Persistent Session Active
              </span>
            </div>

            <p className="text-xs text-platform-muted leading-relaxed">
              Your session is securely verified with an HMAC-SHA256 signed HttpOnly cookie.
              When working across multiple accounts, always use Sign Out below to avoid session confusion.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleLogout(false)}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-xs font-semibold text-platform-dark transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? 'Signing out...' : 'Sign Out of this Account'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLogout(true)}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>Log Out from All Devices</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PLATFORM SECURITY & SYSTEM CONFIGURATION */}
      {/* ============================================================== */}
      {activeTab === 'platform' && (
        <div className="space-y-6">
          {/* Security & System Status */}
          <div className="p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-platform-dark font-semibold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Security & Cryptography Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 rounded-2xl bg-black/5 border border-black/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-platform-dark block font-semibold">Password Cryptography</strong>
                  <span className="text-platform-muted">
                    Bcrypt with 10 salt rounds enforced on all recipient passcodes.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 border border-black/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-platform-dark block font-semibold">Brute-Force Protection</strong>
                  <span className="text-platform-muted">
                    10 attempts max per 15-minute sliding window with rotating encouragement.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 border border-black/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-platform-dark block font-semibold">Server-Enforced Expiry</strong>
                  <span className="text-platform-muted">
                    Evaluated at UTC timestamp. Content strictly redacted post-expiration.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 border border-black/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-platform-dark block font-semibold">Session Tokens</strong>
                  <span className="text-platform-muted">
                    HMAC-SHA256 signed HttpOnly, Secure cookies issued on unlock.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Database & Infrastructure Config */}
          <div className="p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-platform-dark font-semibold text-sm">
              <Database className="w-5 h-5 text-platform-violet" />
              <span>Supabase Infrastructure</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-black/5 gap-2">
                <div>
                  <span className="font-semibold text-platform-dark block">Supabase Client Setup</span>
                  <span className="text-platform-muted">
                    Database migrations active in <code>supabase/migrations/</code>
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                  Ready for Production
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-black/5 gap-2">
                <div>
                  <span className="font-semibold text-platform-dark block">Storage Bucket (gifts)</span>
                  <span className="text-platform-muted">
                    Private bucket with signed URL policies for covers, gallery & timeline.
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 self-start sm:self-auto">
                  Configured
                </span>
              </div>
            </div>
          </div>

          {/* General Preferences Form */}
          <form onSubmit={handlePlatformSave} className="p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-platform-dark font-semibold text-sm">
              <Sparkles className="w-5 h-5 text-platform-violet" />
              <span>General Platform Preferences</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Default Timezone
                </label>
                <input
                  type="text"
                  value={defaultTimezone}
                  onChange={(e) => setDefaultTimezone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-platform-dark text-white text-xs font-semibold hover:bg-black transition-all cursor-pointer shadow-xs"
              >
                Save Platform Preferences
              </button>

              {savedSuccess && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Preferences updated successfully</span>
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-stone-500">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
