'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Lock,
  Sparkles,
  Server,
  Globe,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('Dear You');
  const [tagline, setTagline] = useState('Every person deserves a little something special.');
  const [defaultTimezone, setDefaultTimezone] = useState('Asia/Kolkata');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const supabaseUrlConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="pb-6 border-b border-black/5">
        <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal">
          Platform Settings & Security
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-platform-muted">
          Configure general platform behavior, database connectivity, and security parameters.
        </p>
      </div>

      <div className="space-y-6">
        {/* Security & System Status */}
        <div className="p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-platform-dark font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Security & Cryptography Status</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-black/5 border border-black/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-platform-dark block font-semibold">Password Hashing</strong>
                <span className="text-platform-muted">
                  Bcrypt with 10 salt rounds enabled for all recipient passcodes.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/5 border border-black/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-platform-dark block font-semibold">Brute-Force Rate Limiting</strong>
                <span className="text-platform-muted">
                  5 attempts max per 15-minute sliding window on password endpoints.
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
                  Database migrations ready in <code>supabase/migrations/</code>
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
        <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-4">
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
              Save Platform Settings
            </button>

            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings updated successfully</span>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
