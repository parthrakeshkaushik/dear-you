'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { MOCK_USERS, MOCK_GIFTS } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { AccountStatus } from '@/types/user';

export default function DeveloperUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [users, setUsers] = useState(MOCK_USERS);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.account_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            PLATFORM USER DIRECTORY
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal mt-1.5">
            Registered Users & Creator Accounts
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Audit registered creators, policy acceptance timestamps, and associated digital gifts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F172A] p-4 rounded-2xl border border-white/10">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or user ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-stone-400 flex items-center gap-1 font-mono">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="all">All Accounts ({users.length})</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 font-mono text-stone-400 text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">User</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Registered</th>
                <th className="py-3.5 px-4 font-semibold">Policy Version</th>
                <th className="py-3.5 px-4 font-semibold text-center">Gifts (Pub / Draft)</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredUsers.map((user) => {
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-white/[0.02] transition-colors group text-stone-300"
                  >
                    {/* User Name & Email */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-white block text-sm">
                          {user.display_name || 'Anonymous Creator'}
                        </span>
                        <span className="text-stone-400 font-mono text-[11px]">
                          {user.email}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          user.role === 'developer'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                            : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-400">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Policy Acceptance */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Accepted ({user.terms_version || 'v1.0'})</span>
                      </div>
                    </td>

                    {/* Gifts Counts */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="text-white font-semibold">{user.gifts_count || 0}</span>
                      <span className="text-stone-500 text-[11px] ml-1.5">
                        ({user.published_count || 0} / {user.draft_count || 0})
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                          user.account_status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {user.account_status.toUpperCase()}
                      </span>
                    </td>

                    {/* View Profile Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/developer/users/${user.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white transition-all text-xs font-semibold cursor-pointer border border-indigo-500/30"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Profile</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500 text-xs font-mono">
                    No users matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
