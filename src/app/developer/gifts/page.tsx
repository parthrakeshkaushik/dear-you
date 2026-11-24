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
  ShieldAlert,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Check,
  X,
} from 'lucide-react';
import { MOCK_GIFTS, MOCK_USERS, MOCK_AUDIT_LOGS } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { THEME_PRESETS } from '@/config/themes';
import { ModerationStatus, Gift as GiftType } from '@/types/gift';

export default function DeveloperGiftsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState('all');
  const [pubStatusFilter, setPubStatusFilter] = useState('all');
  const [moderationFilter, setModerationFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Local state for interactive moderation testing in dashboard
  const [giftsState, setGiftsState] = useState<Record<string, GiftType>>(MOCK_GIFTS);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const gifts = Object.values(giftsState);
  const users = MOCK_USERS;

  // Moderation Handlers
  const handleTogglePause = (gift: GiftType) => {
    const isCurrentlyPaused = gift.moderation_status === 'paused';
    const nextStatus: ModerationStatus = isCurrentlyPaused ? 'active' : 'paused';
    const updated = {
      ...gift,
      moderation_status: nextStatus,
      moderated_at: new Date().toISOString(),
      moderation_reason: isCurrentlyPaused ? undefined : 'Administrative hold pending review',
    };

    setGiftsState({ ...giftsState, [gift.slug]: updated });
    setActionNotice(
      isCurrentlyPaused
        ? `Gift "${gift.title}" has been unpaused and restored to active state.`
        : `Gift "${gift.title}" has been paused. Recipients can no longer access it.`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleToggleUnpublish = (gift: GiftType) => {
    const isCurrentlyUnpublished = gift.moderation_status === 'unpublished';
    const nextStatus: ModerationStatus = isCurrentlyUnpublished ? 'active' : 'unpublished';
    const updated = {
      ...gift,
      moderation_status: nextStatus,
      moderated_at: new Date().toISOString(),
      moderation_reason: isCurrentlyUnpublished ? undefined : 'Unpublished by platform developer',
    };

    setGiftsState({ ...giftsState, [gift.slug]: updated });
    setActionNotice(
      isCurrentlyUnpublished
        ? `Gift "${gift.title}" is now published and active.`
        : `Gift "${gift.title}" has been unpublished.`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDelete = (gift: GiftType) => {
    const isDeleted = gift.moderation_status === 'deleted';
    const nextStatus: ModerationStatus = isDeleted ? 'active' : 'deleted';
    const updated = {
      ...gift,
      moderation_status: nextStatus,
      deleted_at: isDeleted ? null : new Date().toISOString(),
      deletion_reason: isDeleted ? undefined : 'Soft-deleted by developer moderation',
    };

    setGiftsState({ ...giftsState, [gift.slug]: updated });
    setActionNotice(
      isDeleted
        ? `Gift "${gift.title}" restored from trash.`
        : `Gift "${gift.title}" has been soft-deleted.`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Filter gifts
  const filteredGifts = gifts.filter((gift) => {
    const owner = users.find((u) => u.id === gift.owner_id);
    const matchesSearch =
      gift.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (owner && owner.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (owner && owner.display_name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTheme = themeFilter === 'all' || gift.selected_theme === themeFilter;
    const matchesPub = pubStatusFilter === 'all' || gift.status === pubStatusFilter;

    const giftMod = gift.moderation_status || 'active';
    const matchesMod = moderationFilter === 'all' || giftMod === moderationFilter;

    return matchesSearch && matchesTheme && matchesPub && matchesMod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            PLATFORM CONTENT & MODERATION CONSOLE
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal mt-1.5">
            All Platform Gifts Directory
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Full administrative control: pause, unpublish, inspect, or delete any gift regardless of creator status.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#0F172A] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
              viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table View</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
              viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid View</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0F172A] p-4 rounded-2xl border border-white/10">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, creator email, recipient, ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
          />
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Moderation Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-mono text-[11px]">Moderation:</span>
            <select
              value={moderationFilter}
              onChange={(e) => setModerationFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
            >
              <option value="all">All Moderation</option>
              <option value="active">Active (Permitted)</option>
              <option value="paused">Paused (Held)</option>
              <option value="unpublished">Unpublished</option>
              <option value="deleted">Deleted (Trash)</option>
            </select>
          </div>

          {/* Publication Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-mono text-[11px]">Status:</span>
            <select
              value={pubStatusFilter}
              onChange={(e) => setPubStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* TABLE VIEW: Shows ALL 14 Required Fields */}
      {viewMode === 'table' ? (
        <div className="bg-[#0F172A] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/40 text-[11px] text-stone-400 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Gift & ID</th>
                  <th className="py-3 px-4">Creator Info</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Theme / Event</th>
                  <th className="py-3 px-4">Status & Moderation</th>
                  <th className="py-3 px-4">Created / Expiry</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredGifts.map((gift) => {
                  const owner = users.find((u) => u.id === gift.owner_id);
                  const isExpired =
                    gift.expiry_enabled && gift.expires_at
                      ? Date.now() > new Date(gift.expires_at).getTime()
                      : false;

                  const modStatus = gift.moderation_status || 'active';
                  const isDeleted = modStatus === 'deleted';
                  const isPaused = modStatus === 'paused';
                  const isUnpublished = modStatus === 'unpublished';

                  return (
                    <tr
                      key={gift.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isDeleted ? 'opacity-50 bg-rose-950/10' : isPaused ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Gift Title & ID */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/developer/gifts/${gift.slug}`}
                          className="font-sans font-semibold text-white hover:text-indigo-300 block text-sm"
                        >
                          {gift.title}
                        </Link>
                        <span className="text-[10px] text-stone-500 font-mono block mt-0.5">
                          ID: {gift.id.slice(0, 8)}... | /g/{gift.slug}
                        </span>
                      </td>

                      {/* Creator Info & Email Verification */}
                      <td className="py-3.5 px-4">
                        <span className="font-sans font-medium text-stone-200 block">
                          {owner?.display_name || 'Creator'}
                        </span>
                        <span className="text-[11px] text-stone-400 block font-mono">
                          {owner?.email || 'N/A'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              owner?.email_verified !== false
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {owner?.email_verified !== false ? 'Verified' : 'Unverified'}
                          </span>
                          {owner?.account_status === 'suspended' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30">
                              Suspended
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4 font-sans text-stone-200">
                        {gift.recipient_name}
                      </td>

                      {/* Theme & Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-900/30 text-purple-300 border border-purple-500/20 block w-fit mb-1">
                          {gift.event_type}
                        </span>
                        <span className="text-[10px] text-indigo-300">
                          {gift.selected_theme} • {gift.memories?.length || 0} photos
                        </span>
                      </td>

                      {/* Status & Moderation */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 w-fit">
                          {/* Moderation Badge */}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              modStatus === 'active'
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                : modStatus === 'paused'
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                                : modStatus === 'unpublished'
                                ? 'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            Mod: {modStatus}
                          </span>

                          {/* Publication & Expiry Badges */}
                          <div className="flex items-center gap-1 text-[9px] text-stone-400">
                            <span>{gift.status.toUpperCase()}</span>
                            {isExpired && <span className="text-rose-400 font-semibold">• EXPIRED</span>}
                          </div>
                        </div>
                      </td>

                      {/* Created / Expiry */}
                      <td className="py-3.5 px-4 text-[10px] text-stone-400">
                        <div>Created: {formatDate(gift.created_at)}</div>
                        <div className="mt-0.5">
                          {gift.expiry_enabled && gift.expires_at
                            ? `Expires: ${formatDate(gift.expires_at)}`
                            : 'Expires: Never'}
                        </div>
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pause / Resume */}
                          <button
                            onClick={() => handleTogglePause(gift)}
                            className={`p-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                              isPaused
                                ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30'
                                : 'bg-black/40 text-stone-300 border-white/10 hover:border-amber-400 hover:text-amber-300'
                            }`}
                            title={isPaused ? 'Unpause Gift' : 'Pause Gift'}
                          >
                            {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                          </button>

                          {/* Unpublish */}
                          <button
                            onClick={() => handleToggleUnpublish(gift)}
                            className={`p-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                              isUnpublished
                                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30'
                                : 'bg-black/40 text-stone-300 border-white/10 hover:border-blue-400 hover:text-blue-300'
                            }`}
                            title={isUnpublished ? 'Republish Gift' : 'Unpublish Gift'}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>

                          {/* Delete / Restore */}
                          <button
                            onClick={() => handleDelete(gift)}
                            className={`p-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                              isDeleted
                                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                                : 'bg-black/40 text-stone-300 border-white/10 hover:border-rose-400 hover:text-rose-300'
                            }`}
                            title={isDeleted ? 'Restore Gift' : 'Soft-Delete Gift'}
                          >
                            {isDeleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                          </button>

                          {/* Full Inspect Link */}
                          <Link
                            href={`/developer/gifts/${gift.slug}`}
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
                            title="Inspect Content & Moderate"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGifts.map((gift) => {
            const owner = users.find((u) => u.id === gift.owner_id);
            const isExpired =
              gift.expiry_enabled && gift.expires_at
                ? Date.now() > new Date(gift.expires_at).getTime()
                : false;

            const modStatus = gift.moderation_status || 'active';
            const isDeleted = modStatus === 'deleted';
            const isPaused = modStatus === 'paused';

            return (
              <div
                key={gift.id}
                className={`p-5 rounded-2xl bg-[#0F172A] border shadow-sm flex flex-col justify-between transition-colors ${
                  isDeleted
                    ? 'border-rose-500/30 opacity-60 bg-rose-950/10'
                    : isPaused
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-white/10 hover:border-indigo-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-500/30">
                      {gift.event_type}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase ${
                        modStatus === 'active'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : modStatus === 'paused'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {modStatus}
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
                      Verification:{' '}
                      <span className={owner?.email_verified !== false ? 'text-emerald-400' : 'text-amber-400'}>
                        {owner?.email_verified !== false ? 'Verified' : 'Unverified'}
                      </span>
                    </p>
                    <p>
                      Photos: <span className="text-stone-200">{gift.memories?.length || 0} items</span>
                    </p>
                    <p>
                      URL: <code className="text-stone-300">/g/{gift.slug}</code>
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePause(gift)}
                      className="p-1.5 rounded-lg border border-white/10 hover:border-amber-400 text-stone-300 hover:text-amber-300"
                      title={isPaused ? 'Unpause' : 'Pause'}
                    >
                      {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(gift)}
                      className="p-1.5 rounded-lg border border-white/10 hover:border-rose-400 text-stone-300 hover:text-rose-300"
                      title={isDeleted ? 'Restore' : 'Delete'}
                    >
                      {isDeleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <Link
                    href={`/developer/gifts/${gift.slug}`}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all font-mono"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredGifts.length === 0 && (
        <div className="p-12 text-center text-xs text-stone-500 font-mono bg-[#0F172A] rounded-2xl border border-white/10">
          No gifts found matching your search and filter criteria.
        </div>
      )}
    </div>
  );
}
