'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Gift,
  PlusCircle,
  Eye,
  Copy,
  Trash2,
  ExternalLink,
  Edit3,
  Archive,
  CheckCircle2,
  Clock,
  Sparkles,
  Check,
  RotateCcw,
  Calendar,
  AlertCircle,
  Download,
  Filter,
  X,
  Lock,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { THEME_PRESETS } from '@/config/themes';
import { formatDate, formatDateTimeZone } from '@/lib/utils';
import { Gift as GiftType } from '@/types/gift';

type FilterTab = 'all' | 'published' | 'draft' | 'expired' | 'paused';

export default function AdminGiftsManagementPage() {
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch strictly the authenticated user's genuine cards (excludes demo and other users' cards)
  React.useEffect(() => {
    async function fetchUserCards() {
      try {
        const res = await fetch('/api/gifts');
        if (res.ok) {
          const data = await res.json();
          setGifts(data.gifts || []);
        } else {
          setGifts([]);
        }
      } catch {
        setGifts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserCards();
  }, []);

  // Modal States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [republishGift, setRepublishGift] = useState<GiftType | null>(null);
  const [duplicateGift, setDuplicateGift] = useState<GiftType | null>(null);
  const [changePasswordGift, setChangePasswordGift] = useState<GiftType | null>(null);
  const [renameGift, setRenameGift] = useState<GiftType | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');
  const [renameRecipientInput, setRenameRecipientInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newPasswordHintInput, setNewPasswordHintInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Republish Form State
  const [republishExpiryEnabled, setRepublishExpiryEnabled] = useState(false);
  const [republishExpiresAt, setRepublishExpiresAt] = useState('');
  const [republishHeading, setRepublishHeading] = useState('');
  const [republishMessage, setRepublishMessage] = useState('');

  // Duplicate Form State
  const [duplicateTitle, setDuplicateTitle] = useState('');
  const [duplicateRecipient, setDuplicateRecipient] = useState('');
  const [duplicateSlug, setDuplicateSlug] = useState('');
  const [duplicateExpiryEnabled, setDuplicateExpiryEnabled] = useState(false);
  const [duplicateExpiresAt, setDuplicateExpiresAt] = useState('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCopyUrl = (slug: string) => {
    const url = `${window.location.origin}/g/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const checkIsExpired = (gift: GiftType) => {
    if (!gift.expiry_enabled || !gift.expires_at) return false;
    return Date.now() > new Date(gift.expires_at).getTime();
  };

  // Open Republish Modal
  const openRepublishModal = (gift: GiftType) => {
    setRepublishGift(gift);
    setRepublishExpiryEnabled(false);
    // Default preset: +30 days if they want expiry
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setRepublishExpiresAt(futureDate.toISOString().slice(0, 16));
    setRepublishHeading(gift.expiry_heading || '');
    setRepublishMessage(gift.expiry_message || '');
  };

  // Confirm Republish
  const handleConfirmRepublish = async () => {
    if (!republishGift) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/gifts/${republishGift.slug}/republish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiry_enabled: republishExpiryEnabled,
          expires_at: republishExpiryEnabled ? new Date(republishExpiresAt).toISOString() : null,
          expiry_heading: republishHeading,
          expiry_message: republishMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Failed to republish card.');
      } else {
        // Update local state
        setGifts(
          gifts.map((g) => (g.id === republishGift.id ? data.gift : g))
        );
        showNotification(
          'success',
          `"${republishGift.title}" has been republished! It is now live at /g/${republishGift.slug}`
        );
        setRepublishGift(null);
      }
    } catch {
      showNotification('error', 'Network error while republishing gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Duplicate Modal
  const openDuplicateModal = (gift: GiftType) => {
    setDuplicateGift(gift);
    setDuplicateTitle(`${gift.title} (Copy)`);
    setDuplicateRecipient(gift.recipient_name);
    setDuplicateSlug(`${gift.slug}-copy-${Math.floor(100 + Math.random() * 900)}`);
    setDuplicateExpiryEnabled(false);
    setDuplicateExpiresAt('');
  };

  // Confirm Duplicate
  const handleConfirmDuplicate = async () => {
    if (!duplicateGift) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/gifts/${duplicateGift.slug}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_title: duplicateTitle,
          new_recipient_name: duplicateRecipient,
          new_slug: duplicateSlug,
          expiry_enabled: duplicateExpiryEnabled,
          expires_at: duplicateExpiryEnabled && duplicateExpiresAt ? new Date(duplicateExpiresAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Failed to duplicate card.');
      } else {
        setGifts([data.duplicatedGift, ...gifts]);
        showNotification(
          'success',
          `Duplicated as "${data.duplicatedGift.title}". A new independent draft has been created.`
        );
        setDuplicateGift(null);
      }
    } catch {
      showNotification('error', 'Network error while duplicating gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Change Password Modal
  const openChangePasswordModal = (gift: GiftType) => {
    setChangePasswordGift(gift);
    setNewPasswordInput('');
    setNewPasswordHintInput(gift.password_hint || '');
  };

  // Confirm Change Password with Immediate Session Revocation
  const handleConfirmChangePassword = async () => {
    if (!changePasswordGift || !newPasswordInput.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/gifts/${changePasswordGift.slug}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_password: newPasswordInput.trim(),
          password_hint: newPasswordHintInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Failed to update password.');
      } else {
        setGifts(
          gifts.map((g) =>
            g.id === changePasswordGift.id
              ? {
                  ...g,
                  password_version: data.passwordVersion,
                  password_hint: newPasswordHintInput.trim() || undefined,
                }
              : g
          )
        );
        showNotification(
          'success',
          'Password updated! All active recipient sessions have been invalidated immediately.'
        );
        setChangePasswordGift(null);
      }
    } catch {
      showNotification('error', 'Network error while updating card password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = (id: string) => {
    setGifts(
      gifts.map((g) => {
        if (g.id === id) {
          const nextStatus = g.status === 'published' ? 'draft' : 'published';
          return {
            ...g,
            status: nextStatus,
            updated_at: new Date().toISOString(),
          };
        }
        return g;
      })
    );
  };

  const openRenameModal = (gift: GiftType) => {
    setRenameGift(gift);
    setRenameTitleInput(gift.title || '');
    setRenameRecipientInput(gift.recipient_name || '');
  };

  const handleConfirmRename = async () => {
    if (!renameGift) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gifts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: renameGift.id,
          title: renameTitleInput.trim(),
          recipient_name: renameRecipientInput.trim(),
        }),
      });

      if (res.ok) {
        setGifts((prev) =>
          prev.map((g) =>
            g.id === renameGift.id
              ? {
                  ...g,
                  title: renameTitleInput.trim(),
                  recipient_name: renameRecipientInput.trim(),
                  updated_at: new Date().toISOString(),
                }
              : g
          )
        );
        showNotification('success', 'Card renamed successfully.');
        setRenameGift(null);
      } else {
        showNotification('error', 'Failed to rename card.');
      }
    } catch {
      showNotification('error', 'Network error while renaming card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/gifts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setGifts((prev) => prev.filter((g) => g.id !== id));
        setDeleteConfirmId(null);
        showNotification('success', 'Gift record deleted.');
      } else {
        showNotification('error', 'Failed to delete gift.');
      }
    } catch {
      showNotification('error', 'Network error while deleting gift.');
    }
  };

  // Filter gifts by Tab
  const filteredGifts = gifts.filter((gift) => {
    const isExpired = checkIsExpired(gift);
    if (activeTab === 'expired') return isExpired;
    if (activeTab === 'published') return gift.status === 'published' && !isExpired && gift.moderation_status !== 'paused';
    if (activeTab === 'draft') return gift.status === 'draft';
    if (activeTab === 'paused') return gift.moderation_status === 'paused';
    return true;
  });

  const expiredCount = gifts.filter(checkIsExpired).length;
  const publishedCount = gifts.filter((g) => g.status === 'published' && !checkIsExpired(g)).length;
  const draftCount = gifts.filter((g) => g.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-platform-border">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-platform-text font-normal">
            Manage Digital Gifts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-platform-muted">
            All personalized gifts created under your account. Publish, preview, republish expired cards, or duplicate.
          </p>
        </div>

        <Link
          href="/admin/create"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-platform-btnBg text-platform-btnText text-xs sm:text-sm font-medium hover:bg-platform-btnHover transition-all shadow-md shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Gift Builder</span>
        </Link>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-platform-cardSubtle border border-platform-border overflow-x-auto text-xs w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-platform-card text-platform-text shadow-xs font-semibold'
              : 'text-platform-muted hover:text-platform-text'
          }`}
        >
          All Gifts ({gifts.length})
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'published'
              ? 'bg-platform-card text-emerald-700 dark:text-emerald-400 shadow-xs font-semibold'
              : 'text-platform-muted hover:text-platform-text'
          }`}
        >
          Active / Published ({publishedCount})
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'expired'
              ? 'bg-platform-card text-rose-700 dark:text-rose-400 shadow-xs font-semibold'
              : 'text-platform-muted hover:text-platform-text'
          }`}
        >
          Expired ({expiredCount})
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'draft'
              ? 'bg-platform-card text-platform-text shadow-xs font-semibold'
              : 'text-platform-muted hover:text-platform-text'
          }`}
        >
          Drafts ({draftCount})
        </button>
      </div>

      {/* Gifts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-16 text-center bg-platform-card rounded-3xl border border-platform-border">
            <div className="w-8 h-8 rounded-full border-2 border-platform-violet border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-xs text-platform-muted">Loading your cards...</p>
          </div>
        ) : gifts.length === 0 ? (
          <div className="text-center py-16 px-4 bg-platform-card rounded-3xl border border-platform-border shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-platform-violet mx-auto flex items-center justify-center mb-4 shadow-2xs border border-purple-100 dark:border-purple-500/20">
              <Gift className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-normal text-platform-text mb-2">
              My Cards
            </h2>
            <p className="text-xs sm:text-sm text-platform-muted max-w-md mx-auto mb-6 leading-relaxed">
              You haven&apos;t created any cards yet. Start with our editable sample and create something special.
            </p>
            <Link
              href="/admin/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-platform-btnBg text-platform-btnText text-xs sm:text-sm font-semibold hover:bg-platform-btnHover transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Card</span>
            </Link>
          </div>
        ) : filteredGifts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-platform-card border border-platform-border text-platform-muted text-xs">
            No gifts found in &quot;{activeTab}&quot; view.
          </div>
        ) : (
          filteredGifts.map((gift) => {
            const themeDef =
              gift.selected_theme !== 'custom'
                ? THEME_PRESETS[gift.selected_theme]
                : null;

            const isExpired = checkIsExpired(gift);

            return (
              <div
                key={gift.id}
                className={`p-5 sm:p-6 rounded-2xl bg-platform-card border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm ${
                  isExpired ? 'border-rose-200/80 dark:border-rose-500/30 bg-rose-50/15 dark:bg-rose-950/20' : 'border-platform-border shadow-xs'
                }`}
              >
                {/* Left Details */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-100 dark:border-purple-500/20">
                      {gift.event_type}
                    </span>

                    {/* Status Badges */}
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isExpired
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-bold'
                          : gift.moderation_status === 'paused'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                          : gift.status === 'published'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-stone-100 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {isExpired
                        ? 'EXPIRED'
                        : gift.moderation_status === 'paused'
                        ? 'PAUSED'
                        : gift.status.toUpperCase()}
                    </span>

                    <span className="text-xs text-platform-muted">
                      Theme: <strong className="text-platform-text font-medium">{themeDef?.name || 'Custom'}</strong>
                    </span>

                    {/* Download count if recipient downloaded */}
                    {gift.download_count && gift.download_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                        <Download className="w-3 h-3" />
                        <span>{gift.download_count} offline saves</span>
                      </span>
                    ) : null}

                    {/* Provenance badge if copied */}
                    {gift.source_gift_id && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        Duplicated Copy
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl font-medium text-platform-text">
                    {gift.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-platform-muted">
                    <span>Recipient: <strong className="text-platform-text font-medium">{gift.recipient_name}</strong></span>
                    <span>•</span>
                    <span>URL Slug: <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-platform-text">/g/{gift.slug}</code></span>
                    {gift.expiry_enabled && gift.expires_at && (
                      <>
                        <span>•</span>
                        <span className={`flex items-center gap-1 font-medium ${isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          <Clock className="w-3 h-3" />
                          <span>
                            {isExpired ? 'Expired on: ' : 'Expires: '}
                            {formatDateTimeZone(gift.expires_at, gift.expiry_timezone)}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center flex-wrap gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-platform-border">
                  {/* 1. REPUBLISH OPTION (Prominently surfaced for Expired cards) */}
                  {isExpired && (
                    <button
                      onClick={() => openRepublishModal(gift)}
                      className="px-3.5 py-2 rounded-xl bg-platform-violet text-white text-xs font-semibold hover:bg-platform-violet/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
                      title="Republish Expired Gift"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Republish Card</span>
                    </button>
                  )}

                  {/* 2. DUPLICATE / COPY CARD OPTION */}
                  <button
                    onClick={() => openDuplicateModal(gift)}
                    className="p-2.5 rounded-xl border border-platform-border hover:bg-platform-hover text-platform-text transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title="Duplicate as New Independent Card"
                  >
                    <Copy className="w-4 h-4 text-platform-muted" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>

                  {/* 2.5 CHANGE PASSWORD WITH IMMEDIATE RECIPIENT SESSION REVOCATION */}
                  <button
                    onClick={() => openChangePasswordModal(gift)}
                    className="p-2.5 rounded-xl border border-platform-border hover:bg-platform-hover text-platform-text transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title="Change Password & Invalidate Recipient Sessions"
                  >
                    <Lock className="w-4 h-4 text-platform-muted" />
                    <span className="hidden sm:inline">Password</span>
                  </button>

                  {/* 3. COPY LINK */}
                  <button
                    onClick={() => handleCopyUrl(gift.slug)}
                    className="p-2.5 rounded-xl border border-platform-border hover:bg-platform-hover text-platform-text transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title="Copy Gift Link"
                  >
                    {copiedSlug === gift.slug ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 text-platform-muted" />
                        <span className="hidden sm:inline">Copy Link</span>
                      </>
                    )}
                  </button>

                  {/* 4. PREVIEW */}
                  <Link
                    href={`/g/${gift.slug}/preview`}
                    target="_blank"
                    className="p-2.5 rounded-xl border border-platform-border hover:bg-platform-hover text-platform-text transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                    title="Creator Preview"
                  >
                    <Eye className="w-4 h-4 text-platform-muted" />
                    <span className="hidden sm:inline">Preview</span>
                  </Link>

                  {/* 5. RENAME DRAFT / CARD */}
                  <button
                    onClick={() => openRenameModal(gift)}
                    className="p-2.5 rounded-xl border border-platform-border hover:bg-platform-hover text-platform-text transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title="Rename Card"
                  >
                    <FileText className="w-4 h-4 text-platform-muted" />
                    <span className="hidden sm:inline">Rename</span>
                  </button>

                  {/* 6. EDIT / CONTINUE EDITING DRAFT */}
                  <Link
                    href={`/admin/create?draftId=${gift.id}`}
                    className="p-2.5 rounded-xl border border-platform-border hover:bg-platform-hover text-platform-text transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                    title={gift.status === 'draft' ? 'Continue Editing Draft' : 'Edit Card'}
                  >
                    <Edit3 className="w-4 h-4 text-platform-muted" />
                    <span className="hidden sm:inline">
                      {gift.status === 'draft' ? 'Continue Editing' : 'Edit'}
                    </span>
                  </Link>

                  {/* 6. PUBLISH / UNPUBLISH TOGGLE (Only for non-expired cards) */}
                  {!isExpired && (
                    <button
                      onClick={() => handleTogglePublish(gift.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        gift.status === 'published'
                          ? 'bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {gift.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                  )}

                  {/* 7. DELETE */}
                  <button
                    onClick={() => setDeleteConfirmId(gift.id)}
                    className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Gift"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* REPUBLISH MODAL                                                */}
      {/* ============================================================== */}
      {republishGift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-platform-card text-platform-text rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-platform-border space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-platform-violet flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-platform-violet">
                    Reactivate Card
                  </span>
                  <h3 className="font-serif text-xl text-platform-text font-normal">
                    Republish Expired Gift
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setRepublishGift(null)}
                className="p-1.5 rounded-full hover:bg-platform-hover text-stone-400 hover:text-platform-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-500/20 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
              <p className="font-semibold mb-0.5">Original URL and Content Preserved:</p>
              <p>
                Republishing will make <strong>{republishGift.title}</strong> live again at{' '}
                <code className="font-mono text-purple-950 dark:text-purple-300">/g/{republishGift.slug}</code>.
                All original photos, letters, memories, and custom styling remain 100% intact.
              </p>
            </div>

            {/* Expiry Configuration */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-semibold text-platform-text">
                Configure New Expiry Settings
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRepublishExpiryEnabled(false)}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    !republishExpiryEnabled
                      ? 'border-platform-violet bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold'
                      : 'border-platform-border bg-platform-card text-platform-muted hover:bg-platform-hover'
                  }`}
                >
                  No Expiry (Never Expires)
                </button>
                <button
                  type="button"
                  onClick={() => setRepublishExpiryEnabled(true)}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    republishExpiryEnabled
                      ? 'border-platform-violet bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold'
                      : 'border-platform-border bg-platform-card text-platform-muted hover:bg-platform-hover'
                  }`}
                >
                  Set New Expiry Date
                </button>
              </div>

              {republishExpiryEnabled && (
                <div className="space-y-2.5 pt-2">
                  {/* Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-stone-500 font-mono">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        setRepublishExpiresAt(d.toISOString().slice(0, 16));
                      }}
                      className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-platform-border hover:bg-platform-hover text-[11px] font-mono text-platform-text"
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                        setRepublishExpiresAt(d.toISOString().slice(0, 16));
                      }}
                      className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-platform-border hover:bg-platform-hover text-[11px] font-mono text-platform-text"
                    >
                      +30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                        setRepublishExpiresAt(d.toISOString().slice(0, 16));
                      }}
                      className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-platform-border hover:bg-platform-hover text-[11px] font-mono text-platform-text"
                    >
                      +1 Year
                    </button>
                  </div>

                  <input
                    type="datetime-local"
                    value={republishExpiresAt}
                    onChange={(e) => setRepublishExpiresAt(e.target.value)}
                    required={republishExpiryEnabled}
                    className="w-full px-3 py-2 rounded-xl border border-platform-inputBorder text-xs sm:text-sm bg-platform-inputBg text-platform-text font-mono focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-platform-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRepublishGift(null)}
                className="px-4 py-2 rounded-xl border border-platform-border text-xs text-platform-muted hover:text-platform-text hover:bg-platform-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRepublish}
                disabled={isSubmitting || (republishExpiryEnabled && !republishExpiresAt)}
                className="px-5 py-2.5 rounded-xl bg-platform-btnBg text-platform-btnText text-xs font-semibold hover:bg-platform-btnHover transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm & Republish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DUPLICATE / COPY MODAL                                         */}
      {/* ============================================================== */}
      {duplicateGift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-platform-card text-platform-text rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-platform-border space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-platform-violet flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-platform-violet">
                    Create Independent Duplicate
                  </span>
                  <h3 className="font-serif text-xl text-platform-text font-normal">
                    Duplicate Card
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDuplicateGift(null)}
                className="p-1.5 rounded-full hover:bg-platform-hover text-stone-400 hover:text-platform-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-platform-muted leading-relaxed font-light">
              This will create a completely new, independent gift in <strong>Draft</strong> status copying all themes, photos, letters, memories, and settings.
              Editing or deleting this duplicate will never affect the source card.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1">
                  New Card Title
                </label>
                <input
                  type="text"
                  value={duplicateTitle}
                  onChange={(e) => setDuplicateTitle(e.target.value)}
                  required
                  placeholder="Card Title"
                  className="w-full px-3 py-2 rounded-xl border border-platform-inputBorder text-xs sm:text-sm bg-platform-inputBg text-platform-text focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={duplicateRecipient}
                  onChange={(e) => setDuplicateRecipient(e.target.value)}
                  required
                  placeholder="Recipient Name"
                  className="w-full px-3 py-2 rounded-xl border border-platform-inputBorder text-xs sm:text-sm bg-platform-inputBg text-platform-text focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1">
                  Unique URL Slug
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 rounded-l-xl border border-r-0 border-platform-border bg-black/5 dark:bg-white/5 text-xs text-platform-muted font-mono">
                    /g/
                  </span>
                  <input
                    type="text"
                    value={duplicateSlug}
                    onChange={(e) => setDuplicateSlug(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-r-xl border border-platform-inputBorder text-xs sm:text-sm bg-platform-inputBg text-platform-text font-mono focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-platform-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDuplicateGift(null)}
                className="px-4 py-2 rounded-xl border border-platform-border text-xs text-platform-muted hover:text-platform-text hover:bg-platform-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDuplicate}
                disabled={isSubmitting || !duplicateTitle || !duplicateRecipient}
                className="px-5 py-2.5 rounded-xl bg-platform-btnBg text-platform-btnText text-xs font-semibold hover:bg-platform-btnHover transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Create Duplicate & Edit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password & Invalidate Recipient Sessions Modal */}
      {changePasswordGift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-platform-card text-platform-text rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-platform-border text-left relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-platform-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/40 text-platform-violet flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-platform-text">
                    Change Card Password
                  </h3>
                  <p className="text-[11px] text-platform-muted">
                    {changePasswordGift.title} (/g/{changePasswordGift.slug})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChangePasswordGift(null)}
                className="p-1 rounded-lg text-platform-muted hover:text-platform-text hover:bg-platform-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Critical Security Invalidation Warning */}
            <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong>Immediate Session Invalidation:</strong> Changing this password immediately revokes all existing recipient access sessions. Anyone viewing this card in an active browser tab will be returned to the password screen.
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password (e.g. surprise2026)"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-platform-inputBorder text-xs sm:text-sm bg-platform-inputBg text-platform-text focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1">
                  Password Hint (Optional)
                </label>
                <input
                  type="text"
                  value={newPasswordHintInput}
                  onChange={(e) => setNewPasswordHintInput(e.target.value)}
                  placeholder="e.g. Favorite cafe where we first met"
                  className="w-full px-3 py-2 rounded-xl border border-platform-inputBorder text-xs sm:text-sm bg-platform-inputBg text-platform-text focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                />
                <p className="text-[10px] text-platform-muted mt-1">
                  Note: Password hints are private and never shown to the public on real customer cards.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-platform-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setChangePasswordGift(null)}
                className="px-4 py-2 rounded-xl border border-platform-border text-xs text-platform-muted hover:text-platform-text hover:bg-platform-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmChangePassword}
                disabled={isSubmitting || !newPasswordInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-platform-btnBg text-platform-btnText text-xs font-semibold hover:bg-platform-btnHover transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Update Password & Revoke Sessions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Card / Draft Modal */}
      {renameGift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-platform-card text-platform-text rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-platform-border text-left relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-platform-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/40 text-platform-violet flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-medium text-platform-text">
                  Rename {renameGift.status === 'draft' ? 'Draft' : 'Card'}
                </h3>
              </div>
              <button
                onClick={() => setRenameGift(null)}
                className="p-1.5 rounded-full hover:bg-platform-hover text-stone-400 hover:text-platform-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1">
                  Card Title *
                </label>
                <input
                  type="text"
                  value={renameTitleInput}
                  onChange={(e) => setRenameTitleInput(e.target.value)}
                  placeholder="e.g. A Birthday Surprise for Maya"
                  className="w-full px-3 py-2 rounded-xl border border-platform-inputBorder text-xs sm:text-sm bg-platform-inputBg text-platform-text focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={renameRecipientInput}
                  onChange={(e) => setRenameRecipientInput(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full px-3 py-2 rounded-xl border border-platform-inputBorder text-xs sm:text-sm bg-platform-inputBg text-platform-text focus:outline-none focus:ring-2 focus:ring-platform-violet/40"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-platform-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRenameGift(null)}
                className="px-4 py-2 rounded-xl border border-platform-border text-xs text-platform-muted hover:text-platform-text hover:bg-platform-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={isSubmitting || !renameTitleInput.trim() || !renameRecipientInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-platform-btnBg text-platform-btnText text-xs font-semibold hover:bg-platform-btnHover transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-platform-card text-platform-text rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-platform-border text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-normal text-platform-text">
              Delete this gift?
            </h3>
            <p className="mt-2 text-xs text-platform-muted leading-relaxed">
              This action cannot be undone. All configured memories, letters, and custom themes for this recipient will be removed.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl border border-platform-border text-xs font-medium text-platform-text hover:bg-platform-hover"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
