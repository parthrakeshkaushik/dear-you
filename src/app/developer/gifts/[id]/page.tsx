'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
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
} from 'lucide-react';
import { MOCK_GIFTS, MOCK_USERS } from '@/lib/mock-data';
import { THEME_PRESETS, getThemeDefinition } from '@/config/themes';
import { formatDate, formatDateTimeZone } from '@/lib/utils';
import { MemoryWall } from '@/components/recipient/MemoryWall';
import { MemoriesGallery } from '@/components/recipient/MemoriesGallery';
import { PhotoViewerModal } from '@/components/recipient/PhotoViewerModal';

export default function GiftInspectionPage() {
  const params = useParams();
  const slugOrId = params?.id as string;

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'recipient'
    | 'theme'
    | 'written_content'
    | 'photos'
    | 'interactive'
    | 'expiry'
  >('overview');

  // Look up gift by slug or id
  const giftsList = Object.values(MOCK_GIFTS);
  const gift = giftsList.find((g) => g.slug === slugOrId || g.id === slugOrId);

  if (!gift) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-stone-400 text-sm">Gift record not found.</p>
        <Link href="/developer/gifts" className="text-indigo-400 underline text-xs font-mono">
          ← Back to Platform Gifts Directory
        </Link>
      </div>
    );
  }

  const owner = MOCK_USERS.find((u) => u.id === gift.owner_id);
  const themeDef = getThemeDefinition(gift.selected_theme, gift.theme_config);
  const memories = gift.memories || [];

  const isExpired =
    gift.expiry_enabled && gift.expires_at
      ? Date.now() > new Date(gift.expires_at).getTime()
      : false;

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
      {/* Top Header & Inspection Actions */}
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
              className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                gift.status === 'published'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
              }`}
            >
              {gift.status.toUpperCase()}
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
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Launch Live Recipient Preview</span>
          </Link>
        </div>
      </div>

      {/* Developer Inspection Disclosure Notice */}
      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Authorized Read-Only Inspection • Access governed by published Privacy Policy & Terms acceptance.
          </span>
        </div>
        <span className="font-mono text-[11px] text-stone-400 hidden sm:inline">
          Audit Log ID: log-{gift.id.slice(0, 8)}
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 text-xs font-medium scrollbar-none">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
            <h3 className="font-serif text-base font-semibold text-white">Gift Metadata</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-stone-400">Gift ID:</span>
                <span className="text-white">{gift.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-stone-400">Event Type:</span>
                <span className="text-purple-300 font-semibold">{gift.event_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-stone-400">Occasion Date:</span>
                <span className="text-white">{gift.event_date || 'None specified'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-stone-400">Created Date:</span>
                <span className="text-white">{formatDate(gift.created_at)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-400">Last Modified:</span>
                <span className="text-white">{formatDate(gift.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
            <h3 className="font-serif text-base font-semibold text-white">Creator Account</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-stone-400">Creator Name:</span>
                <span className="text-white">{owner?.display_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-stone-400">Creator Email:</span>
                <span className="text-white">{owner?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-stone-400">Terms Accepted:</span>
                <span className="text-emerald-400 font-semibold">Yes ({owner?.terms_version || 'v1.0'})</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-400">Privacy Policy Version:</span>
                <span className="text-emerald-400 font-semibold">{owner?.privacy_policy_version || 'v1.0'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recipient Info */}
      {activeTab === 'recipient' && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-5">
          <h3 className="font-serif text-lg font-semibold text-white">
            Recipient Experience Entry Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-stone-400 text-[11px] block uppercase">Recipient Display Name</span>
              <span className="text-lg font-serif text-white block">{gift.recipient_name}</span>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-stone-400 text-[11px] block uppercase">Opening Button Label</span>
              <span className="text-sm text-stone-200 block">{gift.welcome_button_text || 'Open Your Surprise'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-stone-400 block uppercase">
              Welcome Headline Configured by Creator:
            </span>
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-sm font-serif text-white">
              "{gift.welcome_heading || 'A special moment created for you.'}"
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-stone-400 block uppercase">
              Introductory Message:
            </span>
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
              "{gift.welcome_message || 'No custom intro message written.'}"
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Theme & Styling */}
      {activeTab === 'theme' && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-white">
              Selected Theme: {themeDef.name} ({gift.selected_theme})
            </h3>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-300">
              Style: {themeDef.backgroundStyle}
            </span>
          </div>

          {/* Color Tokens Palette */}
          <div>
            <span className="text-xs font-mono text-stone-400 block uppercase mb-3">
              Design Token Palette Values:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: themeDef.colors.bg }} />
                <div>
                  <span className="text-[10px] text-stone-400 block">Background</span>
                  <span className="text-stone-200">{themeDef.colors.bg}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: themeDef.colors.primary }} />
                <div>
                  <span className="text-[10px] text-stone-400 block">Primary</span>
                  <span className="text-stone-200">{themeDef.colors.primary}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: themeDef.colors.secondary }} />
                <div>
                  <span className="text-[10px] text-stone-400 block">Secondary</span>
                  <span className="text-stone-200">{themeDef.colors.secondary}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: themeDef.colors.accent }} />
                <div>
                  <span className="text-[10px] text-stone-400 block">Accent</span>
                  <span className="text-stone-200">{themeDef.colors.accent}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Pairings */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-stone-400 text-[10px] block uppercase">Heading Font</span>
              <span className="text-white text-sm font-serif">{themeDef.typography.headingFont}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] block uppercase">Body Font</span>
              <span className="text-white text-sm">{themeDef.typography.bodyFont}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Written Content & Letters */}
      {activeTab === 'written_content' && (
        <div className="space-y-6">
          {/* Personal Letters (Un-truncated) */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Personal Letter to {gift.recipient_name}</span>
            </h3>

            {gift.letters && gift.letters.length > 0 ? (
              gift.letters.map((letter, idx) => (
                <div
                  key={letter.id || idx}
                  className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3"
                >
                  <h4 className="font-serif text-base font-medium text-purple-200">
                    "{letter.heading || 'Letter'}"
                  </h4>
                  <div className="space-y-4 text-xs sm:text-sm text-stone-300 font-light leading-relaxed whitespace-pre-wrap">
                    {letter.content}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 font-mono">No personal letter added.</p>
            )}
          </div>

          {/* Final Farewell Closing Message */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-2">
            <span className="text-xs font-mono text-stone-400 block uppercase">
              Closing Farewell Message:
            </span>
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs sm:text-sm text-stone-300 leading-relaxed italic">
              "{gift.closing_message || 'No custom closing note configured.'}"
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Photographs & Memory Wall */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">
                Framed Photographs ({memories.length})
              </h3>
              <p className="text-xs text-stone-400">
                Inspect frames, sizes, rotation angles, and handwritten captions.
              </p>
            </div>
          </div>

          {/* Photos Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memories.map((photo, index) => (
              <div
                key={photo.id || index}
                className="p-4 rounded-2xl bg-[#0F172A] border border-white/10 shadow-xs space-y-3"
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/40 border border-white/5">
                  <img
                    src={photo.image_path}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-handwriting text-lg text-white line-clamp-2 leading-tight">
                    {photo.caption || 'No caption'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 pt-1">
                    <span>Frame: <strong className="text-indigo-300">{photo.frame_style || 'polaroid'}</strong></span>
                    <span>Tilt: {photo.rotation ?? 0}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Embedded Wall Preview Section */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <h4 className="font-serif text-base font-semibold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-400" />
              <span>Full Interactive Memory Wall Preview</span>
            </h4>
            <div className="rounded-xl overflow-hidden bg-stone-950 border border-white/10">
              <MemoryWall memories={memories} wallConfig={gift.memory_wall_config} />
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Interactive Features */}
      {activeTab === 'interactive' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scratch Card */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-3">
            <h4 className="font-serif text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Golden Scratch Card Note</span>
            </h4>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs font-handwriting text-xl text-amber-200">
              "{gift.scratch_card_hidden_text || 'Default scratch surprise'}"
            </div>
          </div>

          {/* Gift Box Note */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-3">
            <h4 className="font-serif text-base font-semibold text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-rose-400" />
              <span>Gift Box Surprise Note</span>
            </h4>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs sm:text-sm text-stone-300 leading-relaxed">
              "{gift.gift_box_message || 'Default box message'}"
            </div>
          </div>

          {/* Secret Messages */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-3 md:col-span-2">
            <h4 className="font-serif text-base font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Secret Messages (Unsealed Inspection)</span>
            </h4>
            {gift.secret_messages && gift.secret_messages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gift.secret_messages.map((s, idx) => (
                  <div key={s.id || idx} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[11px] font-mono text-indigo-300 font-semibold">{s.title}</span>
                    <p className="font-handwriting text-lg text-white leading-snug">"{s.content}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 font-mono">No secret messages added.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Publication & Expiry Details */}
      {activeTab === 'expiry' && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-6">
          <h3 className="font-serif text-lg font-semibold text-white">
            Publication Lifecycle & Expiry Audit
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-stone-400 text-[11px] block uppercase">Expiry Configured</span>
              <span className="text-white font-semibold">
                {gift.expiry_enabled ? 'ENABLED (Time-Bound)' : 'DISABLED (Indefinite Access)'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-stone-400 text-[11px] block uppercase">Scheduled Timestamp</span>
              <span className="text-white">
                {gift.expires_at ? formatDateTimeZone(gift.expires_at, gift.expiry_timezone) : 'N/A'}
              </span>
            </div>
          </div>

          {gift.expiry_enabled && (
            <div className="space-y-3">
              <span className="text-xs font-mono text-stone-400 block uppercase">
                Post-Expiry Farewell Message Configured:
              </span>
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2 text-xs">
                <h5 className="font-serif text-sm font-semibold text-white">
                  {gift.expiry_heading || 'This surprise has reached its final page.'}
                </h5>
                <p className="text-stone-300 leading-relaxed font-light">
                  {gift.expiry_message}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
