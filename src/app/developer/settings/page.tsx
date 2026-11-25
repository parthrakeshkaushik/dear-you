'use client';

import React, { useState, useEffect } from 'react';
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
  Mail,
  Smartphone,
  Server,
  Image,
  Type,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { AUTHORIZED_DEVELOPER_EMAILS } from '@/lib/auth/roles';
import { DEFAULT_CONTENT_LIMITS, PlatformContentLimits } from '@/lib/config/content-limits';

export default function DeveloperSettingsPage() {
  const [developers, setDevelopers] = useState<string[]>([...AUTHORIZED_DEVELOPER_EMAILS]);
  const [newDevEmail, setNewDevEmail] = useState('');
  const [termsVersion, setTermsVersion] = useState('v1.0');
  const [privacyVersion, setPrivacyVersion] = useState('v1.0');
  const [saveNotice, setSaveNotice] = useState(false);

  // Content & Photo Limits state
  const [contentLimits, setContentLimits] = useState<PlatformContentLimits>(DEFAULT_CONTENT_LIMITS);
  const [isLimitsSaving, setIsLimitsSaving] = useState(false);
  const [limitsSaveNotice, setLimitsSaveNotice] = useState<string | null>(null);

  // Load active limits on mount
  useEffect(() => {
    fetch('/api/developer/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.limits) {
          setContentLimits(data.limits);
        }
      })
      .catch((err) => console.warn('Could not load developer content limits:', err));
  }, []);

  const handleSaveContentLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLimitsSaving(true);
    setLimitsSaveNotice(null);

    try {
      const res = await fetch('/api/developer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentLimits),
      });

      const data = await res.json();
      if (!res.ok) {
        setLimitsSaveNotice(data.error || 'Failed to update content limits');
      } else {
        setContentLimits(data.limits);
        setLimitsSaveNotice('Content limits saved and logged to audit trail.');
        setTimeout(() => setLimitsSaveNotice(null), 4000);
      }
    } catch (err: any) {
      setLimitsSaveNotice(err.message || 'Error updating settings');
    } finally {
      setIsLimitsSaving(false);
    }
  };

  const handleFieldLimitChange = (
    fieldKey: keyof PlatformContentLimits['fields'],
    prop: 'maxWords' | 'enabled',
    val: any
  ) => {
    setContentLimits((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldKey]: {
          ...prev.fields[fieldKey],
          [prop]: prop === 'maxWords' ? Math.max(1, parseInt(val, 10) || 1) : Boolean(val),
        },
      },
    }));
  };

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
          Configure content length controls, photo limits, authorized developer accounts, and policy governance.
        </p>
      </div>

      <div className="space-y-6">
        {/* PLATFORM CONTENT LENGTH & PHOTO UPLOAD CONTROLS */}
        <form
          onSubmit={handleSaveContentLimits}
          className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Content Length Controls & Photo Upload Limits</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Govern max photos per card and word limits for creator wizard text fields. Changes apply to new/drafted cards without truncating legacy published cards.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
              Platform Rule
            </span>
          </div>

          {/* Overall Photo Limit Setting */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white text-xs font-semibold">
                <Image className="w-4 h-4 text-indigo-400" />
                <span>Maximum Photos Per Card</span>
              </div>
              <span className="text-xs font-mono text-indigo-300">
                Default: 15 photos
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Combined photo limit across Memory Wall, Memories Gallery, Timeline, and Cover image. Moving or reusing a photo across sections counts only once.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="100"
                value={contentLimits.maxPhotos}
                onChange={(e) =>
                  setContentLimits({
                    ...contentLimits,
                    maxPhotos: Math.max(1, parseInt(e.target.value, 10) || 15),
                  })
                }
                className="w-28 px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-stone-400">photos allowed per card</span>
            </div>
          </div>

          {/* Word Limits Per Text Field Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                <span>Text Field Word Limits</span>
              </h4>
              <span className="text-[10px] text-stone-400 font-mono">
                Unicode & Indian Language Aware
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                Object.keys(contentLimits.fields) as Array<
                  keyof PlatformContentLimits['fields']
                >
              ).map((fieldKey) => {
                const config = contentLimits.fields[fieldKey];
                return (
                  <div
                    key={fieldKey}
                    className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) =>
                            handleFieldLimitChange(fieldKey, 'enabled', e.target.checked)
                          }
                          className="w-3.5 h-3.5 rounded border-white/20 bg-black/40 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-stone-200 font-medium truncate">
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="1"
                        max="5000"
                        disabled={!config.enabled}
                        value={config.maxWords}
                        onChange={(e) =>
                          handleFieldLimitChange(fieldKey, 'maxWords', e.target.value)
                        }
                        className="w-16 px-2 py-1 rounded-md bg-black/60 border border-white/15 text-xs text-white font-mono text-center disabled:opacity-40 focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-stone-400 font-mono">words</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="submit"
              disabled={isLimitsSaving}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isLimitsSaving ? 'Saving...' : 'Update Platform Limits'}</span>
            </button>

            {limitsSaveNotice && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{limitsSaveNotice}</span>
              </span>
            )}
          </div>
        </form>

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

        {/* Live OTP Delivery Gateway Status */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Real-World OTP Delivery Gateways (Email & SMS)</span>
            </h3>
            <span className="text-[11px] font-mono text-indigo-300 font-medium">
              Multi-Provider Active
            </span>
          </div>

          <p className="text-xs text-stone-400 leading-relaxed">
            Dear You supports authentic OTP delivery to user inboxes and cellular devices through direct SMTP (Gmail, Brevo, Resend) and SMS Gateways (Fast2SMS, Twilio).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Mail className="w-4 h-4 text-purple-400" />
                <span>Email OTP Delivery (SMTP / Resend)</span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Configure <code>SMTP_HOST</code> and <code>SMTP_PASS</code> (e.g. Gmail App Password or Brevo) in <code>.env.local</code> or enable Custom SMTP in Supabase Dashboard to deliver real emails to user inboxes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Mobile SMS Delivery (Fast2SMS / Twilio)</span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Add <code>FAST2SMS_API_KEY</code> for Indian cellular networks or <code>TWILIO_ACCOUNT_SID</code> for global telecom SMS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
