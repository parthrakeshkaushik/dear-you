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
} from 'lucide-react';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { THEME_PRESETS } from '@/config/themes';
import { formatDate, formatDateTimeZone } from '@/lib/utils';
import { Gift as GiftType } from '@/types/gift';

export default function AdminGiftsManagementPage() {
  const [gifts, setGifts] = useState<GiftType[]>(Object.values(MOCK_GIFTS));
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCopyUrl = (slug: string) => {
    const url = `${window.location.origin}/g/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleDuplicate = (gift: GiftType) => {
    const duplicated: GiftType = {
      ...gift,
      id: `copy-${Date.now()}`,
      slug: `${gift.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      title: `${gift.title} (Copy)`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setGifts([duplicated, ...gifts]);
  };

  const handleTogglePublish = (id: string) => {
    setGifts(
      gifts.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            status: g.status === 'published' ? 'draft' : 'published',
            updated_at: new Date().toISOString(),
          };
        }
        return g;
      })
    );
  };

  const handleDelete = (id: string) => {
    setGifts(gifts.filter((g) => g.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal">
            Manage Digital Gifts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-platform-muted">
            All personalized gifts created under your account. Publish, preview, duplicate, or edit.
          </p>
        </div>

        <Link
          href="/admin/create"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-platform-dark text-white text-xs sm:text-sm font-medium hover:bg-black transition-all shadow-md shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Gift Builder</span>
        </Link>
      </div>

      {/* Gifts List */}
      <div className="space-y-4">
        {gifts.map((gift) => {
          const themeDef =
            gift.selected_theme !== 'custom'
              ? THEME_PRESETS[gift.selected_theme]
              : null;

          const isExpired =
            gift.expiry_enabled && gift.expires_at
              ? Date.now() > new Date(gift.expires_at).getTime()
              : false;

          return (
            <div
              key={gift.id}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm transition-shadow"
            >
              {/* Left Details */}
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-100">
                    {gift.event_type}
                  </span>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isExpired
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : gift.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isExpired ? 'EXPIRED' : gift.status.toUpperCase()}
                  </span>

                  <span className="text-xs text-platform-muted">
                    Theme: <strong className="text-platform-dark font-medium">{themeDef?.name || 'Custom'}</strong>
                  </span>
                </div>

                <h3 className="font-serif text-lg sm:text-xl font-medium text-platform-dark">
                  {gift.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-platform-muted">
                  <span>Recipient: <strong className="text-platform-dark font-medium">{gift.recipient_name}</strong></span>
                  <span>•</span>
                  <span>URL Slug: <code className="bg-black/5 px-1.5 py-0.5 rounded text-[11px]">/g/{gift.slug}</code></span>
                  {gift.expiry_enabled && gift.expires_at && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-700 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Expires: {formatDateTimeZone(gift.expires_at, gift.expiry_timezone)}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center flex-wrap gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-black/5">
                {/* Copy Link */}
                <button
                  onClick={() => handleCopyUrl(gift.slug)}
                  className="p-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-platform-dark transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  title="Copy Gift Link"
                >
                  {copiedSlug === gift.slug ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-platform-muted" />
                      <span className="hidden sm:inline">Copy Link</span>
                    </>
                  )}
                </button>

                {/* Preview */}
                <Link
                  href={`/g/${gift.slug}/preview`}
                  target="_blank"
                  className="p-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-platform-dark transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                  title="Admin Preview (Unlocked)"
                >
                  <Eye className="w-4 h-4 text-platform-muted" />
                  <span className="hidden sm:inline">Preview</span>
                </Link>

                {/* Edit */}
                <Link
                  href={`/admin/create?edit=${gift.id}`}
                  className="p-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-platform-dark transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                  title="Edit Gift"
                >
                  <Edit3 className="w-4 h-4 text-platform-muted" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>

                {/* Toggle Publish */}
                <button
                  onClick={() => handleTogglePublish(gift.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    gift.status === 'published'
                      ? 'bg-amber-100/70 text-amber-900 hover:bg-amber-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {gift.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>

                {/* Duplicate */}
                <button
                  onClick={() => handleDuplicate(gift)}
                  className="p-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-platform-muted hover:text-platform-dark transition-colors cursor-pointer"
                  title="Duplicate Gift"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                {/* Delete */}
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
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-black/10 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-normal text-platform-dark">
              Delete this gift?
            </h3>
            <p className="mt-2 text-xs text-platform-muted leading-relaxed">
              This action cannot be undone. All configured memories, letters, and custom themes for this recipient will be removed.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl border border-black/10 text-xs font-medium text-platform-dark hover:bg-black/5"
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
