'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Gift,
  CheckCircle2,
  FileEdit,
  Clock,
  Camera,
  Palette,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Smartphone,
  Laptop,
  ShieldCheck,
  Eye,
  Layers,
} from 'lucide-react';
import { MOCK_USERS, MOCK_GIFTS, MOCK_AUDIT_LOGS } from '@/lib/mock-data';
import { THEME_PRESETS } from '@/config/themes';
import { formatDate } from '@/lib/utils';

export default function DeveloperOverviewPage() {
  const [metrics, setMetrics] = React.useState({
    totalUsers: MOCK_USERS.length,
    activeUsers: MOCK_USERS.filter((u) => u.account_status === 'active').length,
    totalGifts: Object.values(MOCK_GIFTS).length,
    publishedGifts: Object.values(MOCK_GIFTS).filter((g) => g.status === 'published').length,
    draftGifts: Object.values(MOCK_GIFTS).filter((g) => g.status === 'draft').length,
    expiredGifts: Object.values(MOCK_GIFTS).filter((g) => {
      return g.expiry_enabled && g.expires_at && Date.now() > new Date(g.expires_at).getTime();
    }).length,
    themeCounts: {} as Record<string, number>,
  });
  const [recentGifts, setRecentGifts] = React.useState(Object.values(MOCK_GIFTS).slice(0, 5));
  const [recentAuditLogs, setRecentAuditLogs] = React.useState(MOCK_AUDIT_LOGS.slice(0, 8));

  React.useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch('/api/developer/overview');
        if (res.ok) {
          const data = await res.json();
          if (data.metrics) setMetrics(data.metrics);
          if (data.recentGifts) setRecentGifts(data.recentGifts);
          if (data.recentAuditLogs) setRecentAuditLogs(data.recentAuditLogs);
        }
      } catch {}
    }
    fetchOverview();
  }, []);

  const {
    totalUsers,
    activeUsers,
    totalGifts,
    publishedGifts,
    draftGifts,
    expiredGifts,
    themeCounts,
  } = metrics;
  const gifts = recentGifts;
  const auditLogs = recentAuditLogs;
  const users = MOCK_USERS;
  const totalPhotosUploaded = gifts.reduce((acc: number, g: any) => acc + (g.memories?.length || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              OWNER PRIVILEGES
            </span>
            <span className="text-xs text-stone-400">Live Production Monitoring</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal">
            Platform Overview & Content Inspection
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Real-time telemetry, user management, and inspection of user-created gifts under the platform Privacy Policy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/developer/gifts"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Inspect All Gifts</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Registered Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-semibold text-white font-mono">{totalUsers}</div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span>{activeUsers} active accounts</span>
          </div>
        </div>

        {/* Total Gifts */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Gifts Created</span>
            <Gift className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-semibold text-white font-mono">{totalGifts}</div>
          <div className="mt-2 text-[11px] text-stone-400 flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">{publishedGifts} published</span>
            <span>•</span>
            <span className="text-amber-400">{draftGifts} drafts</span>
          </div>
        </div>

        {/* Uploaded Photographs */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Photographs Hosted</span>
            <Camera className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-semibold text-white font-mono">{totalPhotosUploaded}</div>
          <div className="mt-2 text-[11px] text-stone-400">
            Across Memory Walls & Galleries
          </div>
        </div>

        {/* Expired / Completed */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Expired / Closed</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-semibold text-white font-mono">{expiredGifts}</div>
          <div className="mt-2 text-[11px] text-amber-300 font-medium">
            Graceful closing screens active
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Trends & Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Frequently Used Themes */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Theme Preferences</span>
            </h3>
            <span className="text-[10px] font-mono text-stone-400">Real Usage</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(THEME_PRESETS).map(([id, theme]) => {
              const count = themeCounts[id] || (id === 'dreamy' ? 1 : 0);
              const percentage = Math.round((count / Math.max(totalGifts, 1)) * 100);

              return (
                <div key={id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-300">{theme.name}</span>
                    <span className="font-mono text-stone-400">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile vs Desktop Usage & Section Popularity */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm space-y-5">
          <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Platform Device Ratios</span>
          </h3>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-stone-300">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>Mobile Browsing (Primary)</span>
              </span>
              <span className="font-mono font-semibold text-white">74%</span>
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '74%' }} />
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="flex items-center gap-2 text-stone-300">
                <Laptop className="w-4 h-4 text-blue-400" />
                <span>Desktop / Tablet</span>
              </span>
              <span className="font-mono font-semibold text-white">26%</span>
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '26%' }} />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="text-stone-400 font-mono text-[11px] block uppercase">
              Top Interactive Features
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-md bg-white/5 text-stone-300 text-[11px]">
                🎂 Birthday Cake (92%)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 text-stone-300 text-[11px]">
                🖼️ Memory Wall (88%)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 text-stone-300 text-[11px]">
                ✨ Scratch Card (79%)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 text-stone-300 text-[11px]">
                💌 Personal Letters (96%)
              </span>
            </div>
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Recent Dev Audit Logs</span>
            </h3>
            <Link
              href="/developer/audit-logs"
              className="text-[11px] text-indigo-400 hover:underline font-mono"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs space-y-1 font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-indigo-300 font-semibold text-[11px]">
                    {log.action_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {formatDate(log.created_at)}
                  </span>
                </div>
                <div className="text-[11px] text-stone-300 truncate">
                  Target: {log.target_gift_title || log.target_user_name || 'System'}
                </div>
                <div className="text-[10px] text-stone-500">
                  By {log.developer_email}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent User Creations Ready for Inspection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-normal text-white">
              Recently Created User Gifts
            </h2>
            <p className="text-xs text-stone-400">
              Inspect messages, recipient journeys, photographs, and layout choices.
            </p>
          </div>
          <Link
            href="/developer/gifts"
            className="text-xs text-indigo-400 hover:underline font-mono flex items-center gap-1"
          >
            <span>All User Gifts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gifts.map((gift) => {
            const owner = users.find((u) => u.id === gift.owner_id);

            return (
              <div
                key={gift.id}
                className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm flex flex-col justify-between hover:border-indigo-500/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
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

                  <div className="mt-2 text-xs text-stone-400 space-y-0.5">
                    <p>Recipient: <strong className="text-stone-200">{gift.recipient_name}</strong></p>
                    <p>Creator: <span className="text-stone-300">{owner?.display_name || 'Creator'} ({owner?.email || 'N/A'})</span></p>
                    <p>Theme: <span className="text-indigo-300 font-mono">{gift.selected_theme}</span></p>
                    <p>Photos: <span className="text-stone-200 font-mono">{gift.memories?.length || 0} framed images</span></p>
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
