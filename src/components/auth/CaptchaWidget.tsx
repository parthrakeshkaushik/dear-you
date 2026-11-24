'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err?: any) => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (err?: any) => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function CaptchaWidget({
  onVerify,
  onExpire,
  onError,
  className = '',
}: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [isSimulatedVerified, setIsSimulatedVerified] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    // If real Cloudflare Turnstile site key is configured, load Turnstile script
    if (siteKey && typeof window !== 'undefined') {
      const scriptId = 'cf-turnstile-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      const initTurnstile = () => {
        if (window.turnstile && containerRef.current && !widgetId) {
          try {
            const id = window.turnstile.render(containerRef.current, {
              sitekey: siteKey,
              callback: (token: string) => {
                onVerify(token);
              },
              'expired-callback': () => {
                if (onExpire) onExpire();
              },
              'error-callback': (err) => {
                if (onError) onError(err);
              },
              theme: 'light',
            });
            setWidgetId(id);
          } catch (e) {
            console.warn('Turnstile render warning:', e);
          }
        }
      };

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => initTurnstile();
        document.head.appendChild(script);
      } else if (window.turnstile) {
        initTurnstile();
      }

      return () => {
        if (widgetId && window.turnstile) {
          try {
            window.turnstile.remove(widgetId);
          } catch {}
        }
      };
    }
  }, [siteKey]);

  // Simulated interactive verification for local dev / environments without Turnstile keys
  const handleSimulatedVerify = () => {
    if (isSimulatedVerified || isSimulating) return;
    setIsSimulating(true);

    setTimeout(() => {
      setIsSimulating(false);
      setIsSimulatedVerified(true);
      const testToken = `test_valid_captcha_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      onVerify(testToken);
    }, 600);
  };

  if (siteKey) {
    return (
      <div className={`flex flex-col items-center justify-center my-3 ${className}`}>
        <div ref={containerRef} className="cf-turnstile" />
      </div>
    );
  }

  // Polished fallback verification box consistent with Dear You styling
  return (
    <div
      className={`p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3 text-xs my-2.5 transition-all select-none ${
        isSimulatedVerified ? 'border-emerald-300 bg-emerald-50/40' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleSimulatedVerify}
          disabled={isSimulatedVerified || isSimulating}
          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
            isSimulatedVerified
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : isSimulating
              ? 'border-platform-violet bg-platform-violet/10'
              : 'border-stone-400 bg-white hover:border-platform-violet'
          }`}
          aria-label="Verify you are human"
        >
          {isSimulatedVerified ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : isSimulating ? (
            <RefreshCw className="w-3.5 h-3.5 text-platform-violet animate-spin" />
          ) : null}
        </button>

        <span
          onClick={handleSimulatedVerify}
          className={`font-medium cursor-pointer ${
            isSimulatedVerified ? 'text-emerald-900' : 'text-stone-700'
          }`}
        >
          {isSimulatedVerified
            ? 'Security verification passed'
            : isSimulating
            ? 'Verifying human presence...'
            : 'Verify you are human'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-stone-600 font-mono text-[10px]">
        <ShieldCheck className="w-3.5 h-3.5 text-platform-violet" />
        <span>Bot Shield</span>
      </div>
    </div>
  );
}
