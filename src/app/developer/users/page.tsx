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
  Mail,
  Smartphone,
  ShieldAlert,
  MinusCircle,
} from 'lucide-react';
import { MOCK_USERS } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { AccountStatus, RegistrationMethod } from '@/types/user';

export default function DeveloperUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus | 'pending'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | RegistrationMethod>('all');
  const [users, setUsers] = useState(MOCK_USERS);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/developer/users');
        if (res.ok) {
          const data = await res.json();
          if (data.users && data.users.length > 0) {
            setUsers(data.users);
          }
        }
      } catch {} finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.phone && user.phone.includes(query)) ||
      (user.display_name && user.display_name.toLowerCase().includes(query)) ||
      user.id.toLowerCase().includes(query);

    const isPending =
      (user.registration_method === 'email' && user.email_verified === false) ||
      (user.registration_method === 'mobile' && user.phone_verified === false);

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = user.account_status === 'active';
    else if (statusFilter === 'suspended') matchesStatus = user.account_status === 'suspended';
    else if (statusFilter === 'pending') matchesStatus = isPending;

    const matchesMethod =
      methodFilter === 'all' || user.registration_method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
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
            Audit registered creators, OTP verification methods, policy acceptance, and creator gifts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0F172A] p-4 rounded-2xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone (+91...), or user ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-mono">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="email">Email Signup</option>
              <option value="mobile">Mobile Signup</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
            >
              <option value="all">All Accounts ({users.length})</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="pending">Verification Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 font-mono text-stone-400 text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">User</th>
                <th className="py-3.5 px-4 font-semibold">Method & Identifier</th>
                <th className="py-3.5 px-4 font-semibold">Email Status</th>
                <th className="py-3.5 px-4 font-semibold">Mobile Status</th>
                <th className="py-3.5 px-4 font-semibold">Registered</th>
                <th className="py-3.5 px-4 font-semibold text-center">Gifts (Pub / Draft)</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredUsers.map((user) => {
                const isEmailMethod = user.registration_method === 'email';
                const isMobileMethod = user.registration_method === 'mobile';

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-white/[0.02] transition-colors group text-stone-300"
                  >
                    {/* User Name & ID */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-white block text-sm">
                          {user.display_name || 'Anonymous Creator'}
                        </span>
                        <span className="text-stone-500 font-mono text-[10px]">
                          ID: {user.id}
                        </span>
                      </div>
                    </td>

                    {/* Method & Identifier */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            isMobileMethod
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                              : 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {isMobileMethod ? (
                            <>
                              <Smartphone className="w-3 h-3" />
                              <span>MOBILE NUMBER</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3 h-3" />
                              <span>EMAIL ADDRESS</span>
                            </>
                          )}
                        </span>
                        <p className="text-stone-300 font-mono text-xs font-medium">
                          {isMobileMethod ? user.phone : user.email}
                        </p>
                      </div>
                    </td>

                    {/* Email Verification Status */}
                    <td className="py-3.5 px-4">
                      {isEmailMethod ? (
                        user.email_verified !== false ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-500 px-2 py-0.5 rounded-full bg-stone-900 border border-white/5">
                          <MinusCircle className="w-3 h-3" />
                          <span>Not Provided</span>
                        </span>
                      )}
                    </td>

                    {/* Mobile Verification Status */}
                    <td className="py-3.5 px-4">
                      {isMobileMethod ? (
                        user.phone_verified !== false ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-500 px-2 py-0.5 rounded-full bg-stone-900 border border-white/5">
                          <MinusCircle className="w-3 h-3" />
                          <span>Not Provided</span>
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-400">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Gifts Counts */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="text-white font-semibold">{user.gifts_count || 0}</span>
                      <span className="text-stone-500 text-[11px] ml-1.5">
                        ({user.published_count || 0} / {user.draft_count || 0})
                      </span>
                    </td>

                    {/* Account Status Badge */}
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

                    {/* Actions */}
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
                  <td colSpan={8} className="py-12 text-center text-stone-500 text-xs font-mono">
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
