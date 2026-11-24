'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Gift,
  PlusCircle,
  Eye,
  Clock,
  CheckCircle2,
  FileEdit,
  Archive,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { THEME_PRESETS } from '@/config/themes';
import { formatDate, formatDateTimeZone } from '@/lib/utils';
import { Gift as GiftType } from '@/types/gift';

export default function AdminOverviewPage() {
  const [giftsList, setGiftsList] = useState<GiftType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch only cards genuinely owned by the authenticated user
  useEffect(() => {
    async function fetchUserGifts() {
      try {
        const res = await fetch('/api/gifts');
        if (res.ok) {
          const data = await res.json();
          setGiftsList(data.gifts || []);
        } else {
          setGiftsList([]);
        }
      } catch {
        setGiftsList([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserGifts();
  }, []);

  // Compute metrics from the user's authentic cards
  const totalGifts = giftsList.length;
  const publishedGifts = giftsList.filter((g) => g.status === 'published').length;
  const draftGifts = giftsList.filter((g) => g.status === 'draft').length;
  const archivedGifts = giftsList.filter((g) => g.status === 'archived').length;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-platform-muted">
            Manage your personalized digital gifts, themes, and delivery experiences.
          </p>
        </div>

        <Link
          href="/admin/create"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-platform-dark text-white text-xs sm:text-sm font-medium hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Gift</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs">
          <div className="flex items-center justify-between text-platform-muted mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Total Gifts</span>
            <Gift className="w-4 h-4 text-platform-violet" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-platform-dark">{totalGifts}</div>
          <span className="text-[11px] text-platform-muted mt-1 block">Created by you</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs">
          <div className="flex items-center justify-between text-platform-muted mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-platform-dark">
            {publishedGifts}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Live & Accessible</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs">
          <div className="flex items-center justify-between text-platform-muted mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Drafts</span>
            <FileEdit className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-platform-dark">{draftGifts}</div>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">In Progress</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs">
          <div className="flex items-center justify-between text-platform-muted mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Archived</span>
            <Archive className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-platform-dark">{archivedGifts}</div>
          <span className="text-[11px] text-platform-muted mt-1 block">Stored Inactive</span>
        </div>
      </div>

      {/* Recent Gifts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-normal text-platform-dark">
            My Cards
          </h2>
          {giftsList.length > 0 && (
            <Link
              href="/admin/gifts"
              className="text-xs text-platform-violet hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>View All Gifts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-black/5">
            <div className="w-8 h-8 rounded-full border-2 border-platform-violet border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-xs text-platform-muted">Loading your cards...</p>
          </div>
        ) : giftsList.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 px-6 bg-white rounded-3xl border border-black/5 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-platform-violet mx-auto flex items-center justify-center mb-4 shadow-2xs">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-platform-dark mb-2">
              My Cards
            </h3>
            <p className="text-xs sm:text-sm text-platform-muted max-w-md mx-auto mb-6 leading-relaxed">
              You haven&apos;t created any cards yet. Start with our editable sample and create something special.
            </p>
            <Link
              href="/admin/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-platform-dark text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Card</span>
            </Link>
          </div>
        ) : (
          /* User's Cards List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {giftsList.map((gift) => {
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
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-black/5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-100">
                        {gift.event_type}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          isExpired
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : gift.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isExpired ? 'Expired' : gift.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-medium text-platform-dark">
                      {gift.title}
                    </h3>
                    <p className="text-xs text-platform-muted mt-1">
                      For: <strong className="text-platform-dark font-medium">{gift.recipient_name}</strong>
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-platform-muted">
                      <span className="inline-flex items-center gap-1 bg-black/5 px-2.5 py-1 rounded-md">
                        <Sparkles className="w-3 h-3 text-platform-violet" />
                        <span>{themeDef?.name || 'Custom Theme'}</span>
                      </span>

                      {gift.expiry_enabled && gift.expires_at && (
                        <span className="inline-flex items-center gap-1 bg-black/5 px-2.5 py-1 rounded-md">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Expires: {formatDateTimeZone(gift.expires_at, gift.expiry_timezone)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-xs">
                    <span className="text-platform-muted text-[11px]">
                      Updated {formatDate(gift.updated_at)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/g/${gift.slug}/preview`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 transition-colors inline-flex items-center gap-1 font-medium text-platform-dark"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </Link>
                      {gift.status === 'draft' ? (
                        <Link
                          href={`/admin/create?draftId=${gift.id}`}
                          className="px-3 py-1.5 rounded-lg bg-platform-dark text-white hover:bg-black transition-colors inline-flex items-center gap-1 font-medium"
                        >
                          <FileEdit className="w-3 h-3" />
                          <span>Continue Editing</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/g/${gift.slug}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-lg bg-platform-dark text-white hover:bg-black transition-colors inline-flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Live Gift</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
