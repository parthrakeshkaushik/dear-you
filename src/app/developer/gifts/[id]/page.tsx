'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Gift,
  User,
  Calendar,
  Clock,
  Sparkles,
  Camera,
  FileText,
  HelpCircle,
  Lock,
  Layers,
  Palette,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Cake,
  Music,
  Wind,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  AlertCircle,
} from 'lucide-react';
import { getThemeDefinition } from '@/config/themes';
import { formatDate, formatDateTimeZone } from '@/lib/utils';
import { MemoryWall } from '@/components/recipient/MemoryWall';
import { MemoriesGallery } from '@/components/recipient/MemoriesGallery';
import { PhotoViewerModal } from '@/components/recipient/PhotoViewerModal';
import { ModerationStatus, Gift as GiftType } from '@/types/gift';
import { ModerationReasonCategory } from '@/types/user';

type GiftViewState = 'idle' | 'loading' | 'success' | 'not_found' | 'error';

export default function GiftInspectionPage() {
  const params = useParams();
  const slugOrId = (params?.id as string) || '';

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'recipient'
    | 'theme'
    | 'written_content'
    | 'photos'
    | 'interactive'
    | 'expiry'
  >('overview');

  const [viewState, setViewState] = useState<GiftViewState>('loading');
  const [gift, setGift] = useState<(GiftType & { owner?: any }) | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Moderation Modals State
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [moderationReason, setModerationReason] = useState<ModerationReasonCategory>('policy_violation');
  const [moderationNotes, setModerationNotes] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newExpiryEnabled, setNewExpiryEnabled] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchGift = React.useCallback(async (targetId: string, signal?: AbortSignal) => {
    if (!targetId) {
      setViewState('not_found');
      return;
    }

    setViewState('loading');
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/developer/gifts/${encodeURIComponent(targetId)}`, { signal });
      if (res.status === 404) {
        setViewState('not_found');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.gift) {
          setGift(data.gift);
          if (data.gift.expires_at) {
            setNewExpiryDate(data.gift.expires_at.split('T')[0]);
          }
          setNewExpiryEnabled(Boolean(data.gift.expiry_enabled));
          setViewState('success');
          return;
        } else {
          setViewState('not_found');
          return;
        }
      }

      const errData = await res.json().catch(() => null);
      setErrorMessage(errData?.error || `Server responded with HTTP ${res.status}.`);
      setViewState('error');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setErrorMessage('Network connection error while fetching gift details.');
      setViewState('error');
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    fetchGift(slugOrId, controller.signal);
    return () => {
      controller.abort();
    };
  }, [slugOrId, fetchGift]);

  // Loading skeleton state
  if (viewState === 'loading' || viewState === 'idle') {
    return (
      <div className="space-y-6 max-w-6xl animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="h-3.5 bg-white/10 rounded w-44 mb-3" />
            <div className="flex items-center gap-3">
              <div className="h-8 bg-white/15 rounded-lg w-64" />
              <div className="h-5 bg-white/10 rounded-full w-24" />
            </div>
            <div className="h-3 bg-white/5 rounded w-72 mt-2" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-white/10 rounded-xl w-24" />
            <div className="h-9 bg-white/10 rounded-xl w-24" />
          </div>
        </div>

        <div className="flex items-center justify-center p-6 rounded-2xl bg-[#0F172A] border border-white/10 text-stone-400 text-xs font-mono">
          <Clock className="w-4 h-4 mr-2 animate-spin text-indigo-400" />
          <span>Loading gift details and assets...</span>
        </div>

        <div className="h-11 bg-white/5 rounded-xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-[#0F172A] rounded-2xl border border-white/10" />
          <div className="h-44 bg-[#0F172A] rounded-2xl border border-white/10" />
          <div className="h-44 bg-[#0F172A] rounded-2xl border border-white/10" />
        </div>
      </div>
    );
  }

  // Not found state
  if (viewState === 'not_found' || !gift) {
    return (
      <div className="p-12 text-center space-y-4 bg-[#0F172A] rounded-2xl border border-white/10 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl text-white font-normal">Gift Record Not Found</h2>
        <p className="text-stone-400 text-xs font-mono max-w-sm mx-auto">
          No platform gift exists matching: <span className="text-stone-300 font-semibold">{slugOrId || 'unknown'}</span>.
        </p>
        <div className="pt-2">
          <Link
            href="/developer/gifts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors font-mono"
          >
            ← Back to Platform Gifts Directory
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (viewState === 'error') {
    return (
      <div className="p-12 text-center space-y-4 bg-[#0F172A] rounded-2xl border border-white/10 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl text-white font-normal">Unable to Load Gift Record</h2>
        <p className="text-rose-300 text-xs font-mono max-w-sm mx-auto">
          {errorMessage || 'A database or connection error occurred while loading this gift.'}
        </p>
        <div className="pt-3 flex items-center justify-center gap-3">
          <button
            onClick={() => fetchGift(slugOrId)}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <Link
            href="/developer/gifts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-medium transition-colors"
          >
            <span>Back to Gifts</span>
          </Link>
        </div>
      </div>
    );
  }

  const owner = (gift as any).owner || null;
  const themeDef = getThemeDefinition(gift.selected_theme, gift.theme_config);
  const memories = gift.memories || [];

  const isExpired =
    gift.expiry_enabled && gift.expires_at
      ? Date.now() > new Date(gift.expires_at).getTime()
      : false;

  const modStatus = gift.moderation_status || 'active';
  const isPaused = modStatus === 'paused';
  const isUnpublished = modStatus === 'unpublished';
  const isDeleted = modStatus === 'deleted';

  // Moderation Action Handlers
  const confirmPause = () => {
    const updated: GiftType = {
      ...gift,
      moderation_status: 'paused',
      moderation_reason: `${moderationReason}: ${moderationNotes || 'Administrative hold'}`,
      moderated_at: new Date().toISOString(),
    };
    setGift(updated);
    setShowPauseModal(false);
    setActionNotice(`Gift "${gift.title}" has been paused. Recipients can no longer access it.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleResume = () => {
    const updated: GiftType = {
      ...gift,
      moderation_status: 'active',
      moderation_reason: undefined,
      moderated_at: new Date().toISOString(),
    };
    setGift(updated);
    setActionNotice(`Gift "${gift.title}" resumed to active status.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleToggleUnpublish = () => {
    const nextStatus: ModerationStatus = isUnpublished ? 'active' : 'unpublished';
    const updated: GiftType = {
      ...gift,
      moderation_status: nextStatus,
      moderated_at: new Date().toISOString(),
      moderation_reason: isUnpublished ? undefined : 'Unpublished by platform developer',
    };
    setGift(updated);
    setActionNotice(
      isUnpublished
        ? `Gift "${gift.title}" republished and active.`
        : `Gift "${gift.title}" unpublished. Recipient access revoked.`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const confirmDelete = () => {
    const updated: GiftType = {
      ...gift,
      moderation_status: 'deleted',
      deleted_at: new Date().toISOString(),
      deletion_reason: moderationNotes || 'Soft-deleted by developer moderation',
    };
    setGift(updated);
    setShowDeleteModal(false);
    setActionNotice(`Gift "${gift.title}" has been soft-deleted and moved to trash.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRestore = () => {
    const updated: GiftType = {
      ...gift,
      moderation_status: 'active',
      deleted_at: null,
      deletion_reason: undefined,
      moderated_at: new Date().toISOString(),
    };
    setGift(updated);
    setActionNotice(`Gift "${gift.title}" has been successfully restored.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const confirmExpiryUpdate = () => {
    const updated: GiftType = {
      ...gift,
      expiry_enabled: newExpiryEnabled,
      expires_at: newExpiryEnabled && newExpiryDate ? `${newExpiryDate}T23:59:59Z` : null,
      updated_at: new Date().toISOString(),
    };
    setGift(updated);
    setShowExpiryModal(false);
    setActionNotice(`Expiry configuration updated for "${gift.title}".`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const inspectionTabs = [
    { id: 'overview', label: '1. Overview & Meta', icon: Gift },
    { id: 'recipient', label: '2. Recipient Info', icon: User },
    { id: 'theme', label: '3. Theme & Styling', icon: Palette },
    { id: 'written_content', label: '4. Written Letters', icon: FileText },
    { id: 'photos', label: '5. Photos & Memory Wall', icon: Camera },
    { id: 'interactive', label: '6. Interactive Features', icon: Sparkles },
    { id: 'expiry', label: '7. Publication & Expiry', icon: Clock },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <Link
            href="/developer/gifts"
            className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 mb-2 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Gifts Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal">
              {gift.title}
            </h1>
            <span
              className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                modStatus === 'active'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  : modStatus === 'paused'
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                  : modStatus === 'unpublished'
                  ? 'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
              }`}
            >
              MOD: {modStatus}
            </span>
          </div>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            Slug: <code>/g/{gift.slug}</code> • Created by {owner?.display_name || 'Creator'} ({owner?.email})
          </p>
        </div>

        {/* Live Read-Only Preview Launch Button */}
        <div className="flex items-center gap-2">
          <Link
            href={`/g/${gift.slug}/preview`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md transition-all font-mono"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Launch Live Preview</span>
          </Link>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMINISTRATIVE MODERATION CONTROL PANEL                 */}
      {/* ======================================================== */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase text-stone-400 tracking-wider">
              Developer Administrative Control Panel
            </span>
            <h3 className="text-sm font-semibold text-white mt-0.5">
              Live Gift Access & Moderation Status
            </h3>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pause / Resume Button */}
            {isPaused ? (
              <button
                onClick={handleResume}
                className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume Gift</span>
              </button>
            ) : (
              <button
                onClick={() => setShowPauseModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pause Gift</span>
              </button>
            )}

            {/* Unpublish / Republish Button */}
            <button
              onClick={handleToggleUnpublish}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                isUnpublished
                  ? 'bg-blue-600/30 text-blue-200 border-blue-500/40 hover:bg-blue-600/50'
                  : 'bg-black/40 text-stone-300 border-white/10 hover:border-blue-400 hover:text-blue-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isUnpublished ? 'Republish' : 'Unpublish'}</span>
            </button>

            {/* Edit Expiry Button */}
            <button
              onClick={() => setShowExpiryModal(true)}
              className="px-3 py-1.5 rounded-xl bg-black/40 text-stone-300 border border-white/10 hover:border-indigo-400 hover:text-indigo-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Extend Expiry</span>
            </button>

            {/* Soft Delete / Restore Button */}
            {isDeleted ? (
              <button
                onClick={handleRestore}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Gift</span>
              </button>
            ) : (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Gift</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Indicators Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-3 border-t border-white/5">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-stone-400 text-[10px] block uppercase">Recipient Access</span>
            <span className={modStatus === 'active' && !isExpired ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {modStatus === 'active' && !isExpired ? 'LIVE & AVAILABLE' : 'CUT OFF (BLOCKED)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-stone-400 text-[10px] block uppercase">Creator Account</span>
            <span className={owner?.account_status === 'active' ? 'text-stone-200' : 'text-rose-400 font-semibold'}>
              {owner?.account_status === 'active' ? 'Active Creator' : 'Suspended Creator'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-stone-400 text-[10px] block uppercase">Email Verification</span>
            <span className={owner?.email_verified !== false ? 'text-emerald-400' : 'text-amber-400'}>
              {owner?.email_verified !== false ? 'Verified Email' : 'Pending Verification'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-stone-400 text-[10px] block uppercase">Current Expiry</span>
            <span className="text-stone-200 truncate block">
              {gift.expiry_enabled && gift.expires_at ? formatDate(gift.expires_at) : 'No Expiry'}
            </span>
          </div>
        </div>

        {gift.moderation_reason && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-amber-200 text-xs font-mono flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Internal Moderation Record:</span>
              <span className="text-stone-300">{gift.moderation_reason}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 text-xs font-medium scrollbar-none font-mono">
        {inspectionTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-stone-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Meta */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-white">Gift Overview</h3>
            <div className="space-y-2">
              <p><span className="text-stone-400">Title:</span> <strong className="text-white font-sans">{gift.title}</strong></p>
              <p><span className="text-stone-400">ID:</span> <code className="text-stone-300">{gift.id}</code></p>
              <p><span className="text-stone-400">Slug:</span> <code className="text-stone-300">/g/{gift.slug}</code></p>
              <p><span className="text-stone-400">Category:</span> <span className="text-purple-300">{gift.event_type}</span></p>
              <p><span className="text-stone-400">Theme:</span> <span className="text-indigo-300">{gift.selected_theme}</span></p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-white">Creator Account</h3>
            <div className="space-y-2">
              <p><span className="text-stone-400">Name:</span> <span className="text-white font-sans">{owner?.display_name || 'N/A'}</span></p>
              <p><span className="text-stone-400">Email:</span> <span className="text-stone-300">{owner?.email || 'N/A'}</span></p>
              <p><span className="text-stone-400">Email Status:</span> <span className={owner?.email_verified !== false ? 'text-emerald-400' : 'text-amber-400'}>{owner?.email_verified !== false ? 'Verified' : 'Pending Verification'}</span></p>
              <p><span className="text-stone-400">Account Status:</span> <span className={owner?.account_status === 'active' ? 'text-stone-300' : 'text-rose-400'}>{owner?.account_status || 'active'}</span></p>
              <p><span className="text-stone-400">Registered:</span> <span className="text-stone-300">{owner ? formatDate(owner.created_at) : 'N/A'}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recipient Info */}
      {activeTab === 'recipient' && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4 text-xs font-mono">
          <h3 className="font-serif text-lg font-semibold text-white">Recipient & Access Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-stone-400 text-[11px] block uppercase">Recipient Name</span>
              <span className="text-white font-sans font-semibold text-base">{gift.recipient_name}</span>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-stone-400 text-[11px] block uppercase">Password Protection</span>
              <span className="text-emerald-400 font-semibold">Bcrypt Hashed (Secure)</span>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1 sm:col-span-2">
              <span className="text-stone-400 text-[11px] block uppercase">Password Hint (Publicly Visible)</span>
              <span className="text-stone-200 font-sans">{gift.password_hint || 'None set'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Theme & Styling */}
      {activeTab === 'theme' && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4 text-xs font-mono">
          <h3 className="font-serif text-lg font-semibold text-white">Theme & Palette Tokens</h3>
          <p className="text-stone-400">Active Theme Preset: <strong className="text-indigo-300">{gift.selected_theme}</strong></p>
        </div>
      )}

      {/* Tab 4: Written Content */}
      {activeTab === 'written_content' && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-6">
          <h3 className="font-serif text-lg font-semibold text-white">Written Letters & Messages</h3>
          <div className="p-5 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <h4 className="font-serif text-base text-white">{gift.welcome_heading}</h4>
            <p className="text-stone-300 text-xs leading-relaxed font-light">{gift.welcome_message}</p>
          </div>
          {gift.letters?.map((letter, i) => (
            <div key={i} className="p-5 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <h4 className="font-serif text-base text-white">{letter.heading}</h4>
              <p className="text-stone-300 text-xs leading-relaxed font-light">{letter.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Photos & Memory Wall */}
      {activeTab === 'photos' && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-6">
          <h3 className="font-serif text-lg font-semibold text-white">Photos & Memory Wall ({memories.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {memories.map((m) => (
              <div key={m.id} className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <img src={m.image_path} alt={m.caption} className="w-full h-32 object-cover rounded-lg" />
                <p className="text-[11px] text-stone-300 truncate">{m.caption}</p>
                <span className="text-[9px] text-stone-500 font-mono block">Style: {m.frame_style || 'polaroid'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Interactive Features */}
      {activeTab === 'interactive' && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4 text-xs font-mono">
          <h3 className="font-serif text-lg font-semibold text-white">Enabled Modules</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gift.sections?.map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-stone-300 uppercase">{s.section_type}</span>
                <span className={s.enabled ? 'text-emerald-400 font-semibold' : 'text-stone-500'}>
                  {s.enabled ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Publication & Expiry Details */}
      {activeTab === 'expiry' && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-6 text-xs font-mono">
          <h3 className="font-serif text-lg font-semibold text-white">Lifecycle & Expiry Details</h3>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <p><span className="text-stone-400">Expiry Configured:</span> <strong className="text-white">{gift.expiry_enabled ? 'ENABLED' : 'DISABLED'}</strong></p>
            <p><span className="text-stone-400">Scheduled Expiry:</span> <span className="text-stone-200">{gift.expires_at ? formatDateTimeZone(gift.expires_at, gift.expiry_timezone) : 'Never'}</span></p>
            <p><span className="text-stone-400">Timezone:</span> <span className="text-stone-200">{gift.expiry_timezone}</span></p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PAUSE GIFT WITH REASON CATEGORY                */}
      {/* ======================================================== */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0F172A] border border-amber-500/30 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2 text-amber-300">
                <PauseCircle className="w-5 h-5 text-amber-400" />
                <span>Pause Gift Access</span>
              </h3>
              <button onClick={() => setShowPauseModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-light">
              Pausing immediately blocks recipient access. Recipients will see a polite unavailable message without revealing moderation details. The creator’s data is preserved.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Moderation Reason:</label>
              <select
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value as ModerationReasonCategory)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="policy_violation">Policy Violation</option>
                <option value="spam_or_abuse">Spam or Abuse</option>
                <option value="inappropriate_content">Inappropriate Content</option>
                <option value="security_concern">Security Concern</option>
                <option value="user_request">Creator Request</option>
                <option value="technical_issue">Technical Issue</option>
                <option value="other">Other Administrative Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Internal Notes (Audit Trail):</label>
              <textarea
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes for developer logs..."
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPauseModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-stone-300 hover:bg-white/5 font-mono"
              >
                Cancel
              </button>
              <button
                onClick={confirmPause}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs font-mono shadow-md"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DELETE CONFIRMATION DIALOG                     */}
      {/* ======================================================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0F172A] border border-rose-500/30 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span>Confirm Gift Soft-Deletion</span>
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-xs text-rose-200 space-y-1">
              <p><strong>Gift:</strong> {gift.title}</p>
              <p><strong>Creator:</strong> {owner?.display_name} ({owner?.email})</p>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-light">
              This action soft-deletes the gift. It will be removed from recipient access and hidden from ordinary creator listings, but retained in the developer trash registry for recovery.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Deletion Reason:</label>
              <input
                type="text"
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder="Reason for deletion..."
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-stone-300 hover:bg-white/5 font-mono"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs font-mono shadow-md"
              >
                Confirm Soft Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EXTEND / EDIT EXPIRY                           */}
      {/* ======================================================== */}
      {showExpiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0F172A] border border-indigo-500/30 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2 text-indigo-300">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>Extend / Modify Expiry Date</span>
              </h3>
              <button onClick={() => setShowExpiryModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newExpiryEnabled}
                  onChange={(e) => setNewExpiryEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-indigo-600"
                />
                <span className="text-white">Enable Time-Bound Expiration</span>
              </label>

              {newExpiryEnabled && (
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">New Expiration Date:</label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExpiryModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-stone-300 hover:bg-white/5 font-mono"
              >
                Cancel
              </button>
              <button
                onClick={confirmExpiryUpdate}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs font-mono shadow-md"
              >
                Save Expiry Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
