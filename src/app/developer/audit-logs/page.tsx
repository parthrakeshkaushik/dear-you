'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSearch,
  Search,
  Filter,
  ShieldCheck,
  Lock,
  User,
  Gift,
  Camera,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DeveloperAuditLog } from '@/types/user';

export default function DeveloperAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [logs, setLogs] = useState<DeveloperAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/developer/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        const errData = await res.json().catch(() => null);
        setFetchError(errData?.error || 'Failed to load audit logs.');
      }
    } catch {
      setFetchError('Unable to connect to the audit logs server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.developer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.target_gift_title && log.target_gift_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.target_user_name && log.target_user_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            COMPLIANCE & GOVERNANCE
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal mt-1.5">
            Developer Audit Log Registry
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Immutable records of all administrative logins, user profile visits, and gift content inspections.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F172A] p-4 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, target, or developer..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-xs">
          <span className="text-stone-400 text-[11px]">Action Filter:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Sensitive Actions</option>
            <option value="developer_login">developer_login</option>
            <option value="inspect_gift_content">inspect_gift_content</option>
            <option value="inspect_photograph_media">inspect_photograph_media</option>
            <option value="view_user_profile">view_user_profile</option>
            <option value="change_user_status">change_user_status</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 text-stone-400 text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Developer Account</th>
                <th className="py-3.5 px-4 font-semibold">Action Performed</th>
                <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                <th className="py-3.5 px-4 font-semibold">IP Address</th>
                <th className="py-3.5 px-4 font-semibold text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`log-skeleton-${idx}`} className="animate-pulse border-b border-white/5">
                    <td className="py-4 px-4"><div className="h-3 bg-white/10 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-white/10 rounded w-36" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-white/10 rounded-md w-28" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-white/10 rounded w-32" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-white/5 rounded w-20" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-white/10 rounded-full w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : fetchError ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                      <p className="text-rose-300 text-xs font-mono">{fetchError}</p>
                      <button
                        onClick={fetchAuditLogs}
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500 text-xs font-mono">
                    {searchQuery ? 'No audit records matching query.' : 'No audit records logged yet.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors text-stone-300">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-stone-400">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-indigo-300 font-semibold">
                    {log.developer_email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-white/5 text-purple-300 border border-purple-500/20">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {log.target_gift_title ? (
                      <span className="text-white font-medium">Gift: {log.target_gift_title}</span>
                    ) : log.target_user_name ? (
                      <span className="text-white font-medium">User: {log.target_user_name}</span>
                    ) : (
                      <span className="text-stone-500">System</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-stone-400">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{log.action_result.toUpperCase()}</span>
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
