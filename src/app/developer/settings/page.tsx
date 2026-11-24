'use client';

import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Users,
  Code2,
  CheckCircle2,
  Key,
  Lock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { AUTHORIZED_DEVELOPERS } from '@/lib/mock-data';

export default function DeveloperSettingsPage() {
  const [developers, setDevelopers] = useState(AUTHORIZED_DEVELOPERS);
  const [newDevEmail, setNewDevEmail] = useState('');
  const [termsVersion, setTermsVersion] = useState('v1.0');
  const [privacyVersion, setPrivacyVersion] = useState('v1.0');
  const [saveNotice, setSaveNotice] = useState(false);

  const handleAddDeveloper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevEmail || developers.includes(newDevEmail)) return;
    setDevelopers([...developers, newDevEmail]);
    setNewDevEmail('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="pb-6 border-b border-white/10">
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          SYSTEM CONFIGURATION
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal mt-1.5">
          Developer Settings & RBAC Access
        </h1>
        <p className="mt-1 text-xs text-stone-400">
          Configure authorized developer accounts, legal policy version tracking, and audit parameters.
        </p>
      </div>

      <div className="space-y-6">
        {/* Authorized Developer Accounts */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Authorized Developer Team ({developers.length} accounts)</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 font-medium">
              Multi-Factor Protected
            </span>
          </div>

          <p className="text-xs text-stone-400 leading-relaxed">
            Only accounts explicitly listed here possess permissions to inspect user gifts, review photographs, and query user telemetry. Ordinary registered creators cannot access developer endpoints.
          </p>

          <div className="space-y-2 pt-2">
            {developers.map((devEmail, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-white font-semibold">{devEmail}</span>
                  {idx < 2 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      Primary Developer
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-stone-500">Full Inspection Access</span>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Versions Control */}
        <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Policy Governance & Active Versions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Active Terms & Conditions Version
              </label>
              <input
                type="text"
                value={termsVersion}
                onChange={(e) => setTermsVersion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Active Privacy Policy Version
              </label>
              <input
                type="text"
                value={privacyVersion}
                onChange={(e) => setPrivacyVersion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Update Policy Tracking
            </button>

            {saveNotice && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration saved successfully.</span>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
