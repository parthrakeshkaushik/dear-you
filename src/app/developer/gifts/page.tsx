'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Gift,
  Search,
  Filter,
  Eye,
  Camera,
  Calendar,
  Sparkles,
  ExternalLink,
  Clock,
  User,
} from 'lucide-react';
import { MOCK_GIFTS, MOCK_USERS } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { THEME_PRESETS } from '@/config/themes';

export default function DeveloperGiftsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const gifts = Object.values(MOCK_GIFTS);
  const users = MOCK_USERS;

  // Filter gifts
  const filteredGifts = gifts.filter((gift) => {
    const owner = users.find((u) => u.id === gift.owner_id);
    const matchesSearch =
      gift.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (owner && owner.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTheme = themeFilter === 'all' || gift.selected_theme === themeFilter;
    const matchesStatus = statusFilter === 'all' || gift.status === statusFilter;

    return matchesSearch && matchesTheme && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            CONTENT & EXPERIENCE INSPECTION
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal mt-1.5">
            Platform Gifts Directory
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Inspect real user creations, personal letters, memory walls, and design combinations.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0F172A] p-4 rounded-2xl border border-white/10">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, recipient, or creator email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Theme Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-mono text-[11px]">Theme:</span>
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
            >
              <option value="all">All Themes</option>
              {Object.keys(THEME_PRESETS).map((tId) => (
                <option key={tId} value={tId}>{tId}</option>
              ))}
              <option value="custom">custom</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-mono text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGifts.map((gift) => {
          const owner = users.find((u) => u.id === gift.owner_id);
          const themeDef = THEME_PRESETS[gift.selected_theme as keyof typeof THEME_PRESETS];

          const isExpired =
            gift.expiry_enabled && gift.expires_at
              ? Date.now() > new Date(gift.expires_at).getTime()
              : false;

          return (
            <div
              key={gift.id}
              className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm flex flex-col justify-between hover:border-indigo-500/50 transition-colors"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-500/30">
                    {gift.event_type}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      isExpired
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                        : gift.status === 'published'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {isExpired ? 'EXPIRED' : gift.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-semibold text-white leading-snug">
                  {gift.title}
                </h3>

                <div className="mt-3 space-y-1 text-xs text-stone-400 font-mono text-[11px]">
                  <p>
                    Recipient: <strong className="text-white font-sans font-medium">{gift.recipient_name}</strong>
                  </p>
                  <p>
                    Creator:{' '}
                    <span className="text-stone-300">
                      {owner?.display_name || 'Creator'} ({owner?.email || 'N/A'})
                    </span>
                  </p>
                  <p>
                    Theme: <span className="text-indigo-300">{themeDef?.name || gift.selected_theme}</span>
                  </p>
                  <p>
                    Photos: <span className="text-stone-200">{gift.memories?.length || 0} framed images</span>
                  </p>
                  <p>
                    URL: <code className="text-stone-300">/g/{gift.slug}</code>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono text-stone-500">
                  {formatDate(gift.created_at)}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/developer/gifts/${gift.slug}`}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGifts.length === 0 && (
        <div className="p-12 text-center text-xs text-stone-500 font-mono bg-[#0F172A] rounded-2xl border border-white/10">
          No gifts found matching your search and filter criteria.
        </div>
      )}
    </div>
  );
}
