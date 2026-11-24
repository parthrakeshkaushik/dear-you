'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { MOCK_USERS, MOCK_GIFTS } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { AccountStatus } from '@/types/user';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.id as string;

  const [users, setUsers] = useState(MOCK_USERS);
  const user = users.find((u) => u.id === userId);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusActionReason, setStatusActionReason] = useState('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-stone-400 text-sm">User record not found.</p>
        <Link href="/developer/users" className="text-indigo-400 underline text-xs">
          ← Back to Users Directory
        </Link>
      </div>
    );
  }

  // Find all gifts owned by this user
  const userGifts = Object.values(MOCK_GIFTS).filter((g) => g.owner_id === user.id);

  const handleToggleStatus = () => {
    const nextStatus: AccountStatus = user.account_status === 'active' ? 'suspended' : 'active';
    setUsers(
      users.map((u) => (u.id === user.id ? { ...u, account_status: nextStatus } : u))
    );
    setShowStatusModal(false);
    setActionSuccessNotice(`Account status successfully updated to ${nextStatus.toUpperCase()}. Audit log entry generated.`);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <Link
            href="/developer/users"
            className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 mb-2 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Users Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal">
              {user.display_name || 'Creator Profile'}
            </h1>
            <span
              className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                user.account_status === 'active'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
              }`}
            >
              {user.account_status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-stone-400 font-mono mt-0.5">{user.email} • ID: {user.id}</p>
        </div>

        {/* Account Suspension / Reactivation Button */}
        <div>
          <button
            onClick={() => setShowStatusModal(true)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              user.account_status === 'active'
                ? 'bg-rose-900/40 hover:bg-rose-900/70 border border-rose-500/40 text-rose-200'
                : 'bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-200'
            }`}
          >
            {user.account_status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
          </button>
        </div>
      </div>

      {actionSuccessNotice && (
        <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* User Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm space-y-4">
          <h2 className="font-serif text-base font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Account Details</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-stone-400">Account Role</span>
              <span className="font-mono text-white uppercase font-semibold">{user.role}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-stone-400">Email Verification</span>
              <span
                className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                  user.email_verified !== false
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                }`}
              >
                {user.email_verified !== false ? 'VERIFIED' : 'PENDING VERIFICATION'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-stone-400">Registered Date</span>
              <span className="font-mono text-white">{formatDate(user.created_at)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-stone-400">Last Active Timestamp</span>
              <span className="font-mono text-white">{formatDate(user.last_active_at)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Total Gifts Created</span>
              <span className="font-mono text-white font-semibold">{userGifts.length}</span>
            </div>
          </div>
        </div>

        {/* Legal Consent & Policy Acceptance Records */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm space-y-4">
          <h2 className="font-serif text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Policy Acceptance Audit</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-semibold">Terms and Conditions</span>
                <span className="text-emerald-400 font-bold">ACCEPTED</span>
              </div>
              <p className="text-stone-400">Version: {user.terms_version || 'v1.0'}</p>
              <p className="text-stone-400">Timestamp: {user.terms_accepted_at || user.created_at}</p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-semibold">Privacy Policy Disclosure</span>
                <span className="text-emerald-400 font-bold">ACCEPTED</span>
              </div>
              <p className="text-stone-400">Version: {user.privacy_policy_version || 'v1.0'}</p>
              <p className="text-stone-400">Timestamp: {user.privacy_policy_accepted_at || user.created_at}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gifts Created by This User */}
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-normal text-white">
            Gifts Created by {user.display_name} ({userGifts.length})
          </h2>
          <p className="text-xs text-stone-400">
            Click "Inspect Gift" to examine written letters, photographs, and the live recipient journey.
          </p>
        </div>

        {userGifts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userGifts.map((gift) => (
              <div
                key={gift.id}
                className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm flex flex-col justify-between hover:border-indigo-500/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-500/30">
                      {gift.event_type}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        gift.status === 'published'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {gift.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-semibold text-white leading-snug">
                    {gift.title}
                  </h3>
                  <div className="mt-2 text-xs text-stone-400 space-y-0.5 font-mono text-[11px]">
                    <p>Recipient: <strong className="text-stone-200">{gift.recipient_name}</strong></p>
                    <p>Slug: <code className="text-indigo-300">/g/{gift.slug}</code></p>
                    <p>Theme: <span className="text-stone-300">{gift.selected_theme}</span></p>
                    <p>Photographs: <span className="text-stone-300">{gift.memories?.length || 0} items</span></p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500">
                    Created {formatDate(gift.created_at)}
                  </span>
                  <Link
                    href={`/developer/gifts/${gift.slug}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Gift</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#0F172A] border border-white/10 text-center text-xs text-stone-500 font-mono">
            This user has not created any gifts yet.
          </div>
        )}
      </div>

      {/* Account Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F172A] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/15 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  {user.account_status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                </h3>
                <p className="text-xs text-stone-400">Target user: {user.email}</p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {user.account_status === 'active'
                ? 'Suspending this creator will temporarily prevent them from creating or editing gifts. Their published gifts will remain active unless explicitly unpublished.'
                : 'Reactivating this creator will restore their full ability to build, edit, and publish gifts.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Reason for status change (Audit Log Requirement)
              </label>
              <textarea
                rows={2}
                value={statusActionReason}
                onChange={(e) => setStatusActionReason(e.target.value)}
                placeholder="e.g. Terms violation review / Creator requested reactivation..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
              >
                Confirm Status Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
