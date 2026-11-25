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
  AlertCircle,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Check,
  X,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { THEME_PRESETS } from '@/config/themes';
import { ModerationStatus, Gift as GiftType } from '@/types/gift';

export default function DeveloperGiftsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState('all');
  const [pubStatusFilter, setPubStatusFilter] = useState('all');
  const [moderationFilter, setModerationFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Reactive gifts state from database
  const [giftsState, setGiftsState] = useState<Record<string, GiftType>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchGifts = React.useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/developer/gifts');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, GiftType> = {};
        (data.gifts || []).forEach((g: GiftType) => {
          map[g.slug || g.id] = g;
        });
        setGiftsState(map);
      } else {
        const errData = await res.json().catch(() => null);
        setFetchError(errData?.error || 'Failed to load gifts directory.');
      }
    } catch {
      setFetchError('Unable to connect to the gifts directory server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const gifts = Object.values(giftsState);

  // Moderation Handlers
  const handleTogglePause = async (gift: GiftType) => {
    const isCurrentlyPaused = gift.moderation_status === 'paused';
    const nextStatus: ModerationStatus = isCurrentlyPaused ? 'active' : 'paused';
    const updated = {
      ...gift,
      moderation_status: nextStatus,
      moderated_at: new Date().toISOString(),
      moderation_reason: isCurrentlyPaused ? undefined : 'Administrative hold pending review',
    };

    setGiftsState({ ...giftsState, [gift.slug]: updated });
    try {
      await fetch(`/api/developer/gifts/${gift.id || gift.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isCurrentlyPaused ? 'resume' : 'pause' }),
      });
    } catch {}

    setActionNotice(
      isCurrentlyPaused
        ? `Gift "${gift.title}" has been unpaused and restored to active state.`
        : `Gift "${gift.title}" has been paused. Recipients can no longer access it.`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleToggleUnpublish = async (gift: GiftType) => {
    const isCurrentlyUnpublished = gift.moderation_status === 'unpublished';
    const nextStatus: ModerationStatus = isCurrentlyUnpublished ? 'active' : 'unpublished';
    const updated = {
      ...gift,
      moderation_status: nextStatus,
      moderated_at: new Date().toISOString(),
      moderation_reason: isCurrentlyUnpublished ? undefined : 'Unpublished by platform developer',
    };

    setGiftsState({ ...giftsState, [gift.slug]: updated });
    try {
      await fetch(`/api/developer/gifts/${gift.id || gift.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isCurrentlyUnpublished ? 'resume' : 'unpublish' }),
      });
    } catch {}

    setActionNotice(
      isCurrentlyUnpublished
        ? `Gift "${gift.title}" is now published and active.`
        : `Gift "${gift.title}" has been unpublished.`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDelete = async (gift: GiftType) => {
    const isDeleted = gift.moderation_status === 'deleted';
    const nextStatus: ModerationStatus = isDeleted ? 'active' : 'deleted';
    const updated = {
      ...gift,
      moderation_status: nextStatus,
      deleted_at: isDeleted ? null : new Date().toISOString(),
      deletion_reason: isDeleted ? undefined : 'Soft-deleted by developer moderation',
    };

    setGiftsState({ ...giftsState, [gift.slug]: updated });
    try {
      await fetch(`/api/developer/gifts/${gift.id || gift.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isDeleted ? 'restore' : 'delete' }),
      });
    } catch {}

    setActionNotice(
      isDeleted
        ? `Gift "${gift.title}" restored from trash.`
        : `Gift "${gift.title}" has been soft-deleted.`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Filter gifts
  const filteredGifts = gifts.filter((gift: any) => {
    const ownerEmail = gift.owner_email || '';
    const ownerName = gift.owner_name || '';
    const matchesSearch =
      gift.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchQuery.toLowerCase());

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
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={`gift-skeleton-${idx}`} className="animate-pulse border-b border-white/5">
                      <td className="py-4 px-4"><div className="h-4 bg-white/10 rounded w-36 mb-1.5" /><div className="h-2.5 bg-white/5 rounded w-48" /></td>
                      <td className="py-4 px-4"><div className="h-3 bg-white/10 rounded w-28 mb-1" /><div className="h-2.5 bg-white/5 rounded w-36" /></td>
                      <td className="py-4 px-4"><div className="h-3 bg-white/10 rounded w-24" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-white/10 rounded-full w-20" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-white/10 rounded-full w-20" /></td>
                      <td className="py-4 px-4"><div className="h-3 bg-white/10 rounded w-24" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-7 bg-white/10 rounded-lg w-28 ml-auto" /></td>
                    </tr>
                  ))
                ) : fetchError ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <AlertCircle className="w-8 h-8 text-rose-400" />
                        <p className="text-rose-300 text-xs font-mono">{fetchError}</p>
                        <button
                          onClick={fetchGifts}
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredGifts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-500 text-xs font-mono">
                      {searchQuery ? `No gifts matching "${searchQuery}"` : 'No platform gifts found in database.'}
                    </td>
                  </tr>
                ) : (
                  filteredGifts.map((gift) => {
                  const owner: any = {
                    display_name: (gift as any).owner_name || 'Creator',
                    email: (gift as any).owner_email || '',
                    phone: (gift as any).owner_phone || '',
                    registration_method: (gift as any).registration_method || 'email',
                    email_verified: (gift as any).email_verified,
                    phone_verified: (gift as any).phone_verified,
                  };
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
                          {owner?.email || owner?.phone || 'N/A'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              (owner?.registration_method === 'mobile' ? owner?.phone_verified !== false : owner?.email_verified !== false)
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {(owner?.registration_method === 'mobile' ? owner?.phone_verified !== false : owner?.email_verified !== false) ? 'Verified' : 'Unverified'}
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
                }))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`grid-skeleton-${idx}`} className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 animate-pulse space-y-4">
                <div className="flex justify-between"><div className="h-4 bg-white/10 rounded w-20" /><div className="h-4 bg-white/10 rounded-full w-16" /></div>
                <div className="h-6 bg-white/15 rounded w-48" />
                <div className="space-y-2"><div className="h-3 bg-white/5 rounded w-36" /><div className="h-3 bg-white/5 rounded w-28" /></div>
                <div className="h-8 bg-white/10 rounded-xl w-full pt-2" />
              </div>
            ))
          ) : fetchError ? (
            <div className="col-span-full p-12 text-center bg-[#0F172A] rounded-2xl border border-white/10 space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-rose-300 text-xs font-mono">{fetchError}</p>
              <button
                onClick={fetchGifts}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredGifts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-stone-500 text-xs font-mono bg-[#0F172A] rounded-2xl border border-white/10">
              {searchQuery ? `No gifts matching "${searchQuery}"` : 'No platform gifts found in database.'}
            </div>
          ) : (
            filteredGifts.map((gift) => {
            const owner: any = {
              display_name: (gift as any).owner_name || 'Creator',
              email: (gift as any).owner_email || '',
              phone: (gift as any).owner_phone || '',
              registration_method: (gift as any).registration_method || 'email',
              email_verified: (gift as any).email_verified,
              phone_verified: (gift as any).phone_verified,
            };
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
                        {owner?.display_name || 'Creator'} ({owner?.email || owner?.phone || 'N/A'})
                      </span>
                    </p>
                    <p>
                      Verification:{' '}
                      <span className={(owner?.registration_method === 'mobile' ? owner?.phone_verified !== false : owner?.email_verified !== false) ? 'text-emerald-400' : 'text-amber-400'}>
                        {(owner?.registration_method === 'mobile' ? owner?.phone_verified !== false : owner?.email_verified !== false) ? 'Verified' : 'Unverified'}
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
          }))}
        </div>
      )}
    </div>
  );
}
