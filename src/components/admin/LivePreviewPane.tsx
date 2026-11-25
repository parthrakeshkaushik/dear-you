'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Laptop,
  Tablet,
  Smartphone,
  Eye,
  Lock,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCcw,
  X,
  Radio,
} from 'lucide-react';
import { Gift as GiftType } from '@/types/gift';
import { RecipientExperience } from '@/components/recipient/RecipientExperience';
import { PasswordGate } from '@/components/recipient/PasswordGate';
import { ExpiryScreen } from '@/components/recipient/ExpiryScreen';
import { ThemeContainer } from '@/components/recipient/ThemeContainer';

interface LivePreviewPaneProps {
  gift: GiftType;
  activeSectionId?: string;
  stateMode?: PreviewStateMode;
  onStateModeChange?: (mode: PreviewStateMode) => void;
  onSectionVisible?: (sectionId: string) => void;
  onCloseMobilePreview?: () => void;
  isMobileDrawer?: boolean;
}

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
export type PreviewStateMode = 'unlocked' | 'password_gate' | 'expired_closing';

export function LivePreviewPane({
  gift,
  activeSectionId = 'welcome',
  stateMode: controlledStateMode,
  onStateModeChange,
  onSectionVisible,
  onCloseMobilePreview,
  isMobileDrawer = false,
}: LivePreviewPaneProps) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [internalStateMode, setInternalStateMode] = useState<PreviewStateMode>('unlocked');
  const activeStateMode = controlledStateMode || internalStateMode;
  const [previewKey, setPreviewKey] = useState(0);

  const handleStateChange = useCallback(
    (newMode: PreviewStateMode) => {
      setInternalStateMode(newMode);
      if (onStateModeChange) {
        onStateModeChange(newMode);
      }
    },
    [onStateModeChange]
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleResetPreview = () => {
    setPreviewKey((k) => k + 1);
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Programmatic smooth scroll to target section inside the preview viewport
  const scrollToSection = useCallback((sectionId: string) => {
    if (!viewportRef.current) return;

    // Handle special preview state modes
    if (sectionId === 'password' || sectionId === 'password_gate') {
      handleStateChange('password_gate');
      viewportRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'closing_screen' || sectionId === 'expired_closing') {
      handleStateChange('expired_closing');
      viewportRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Only scroll within unlocked gift journey if the mode is unlocked
    if (activeStateMode !== 'unlocked') {
      return;
    }

    // Allow React a tick to render if needed
    setTimeout(() => {
      if (!viewportRef.current) return;

      const target =
        (viewportRef.current.querySelector(`#${sectionId}`) as HTMLElement) ||
        (viewportRef.current.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement);

      if (target) {
        isProgrammaticScrollRef.current = true;
        const containerTop = viewportRef.current.getBoundingClientRect().top;
        const targetTop = target.getBoundingClientRect().top;
        const scrollOffset = targetTop - containerTop + viewportRef.current.scrollTop;

        viewportRef.current.scrollTo({
          top: Math.max(0, scrollOffset - 16),
          behavior: 'smooth',
        });

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 800);
      }
    }, 60);
  }, [activeStateMode, handleStateChange]);

  // Synchronize preview when creator navigates active section in editor
  useEffect(() => {
    if (activeSectionId && activeStateMode === 'unlocked') {
      scrollToSection(activeSectionId);
    }
  }, [activeSectionId, activeStateMode, scrollToSection]);

  // Bidirectional Synchronization: Detect currently visible section when creator scrolls preview
  useEffect(() => {
    const container = viewportRef.current;
    if (!container || !onSectionVisible) return;

    let throttleTimer: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      if (activeStateMode !== 'unlocked') return;

      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        if (!container || isProgrammaticScrollRef.current) return;

        const candidateSections = [
          'welcome',
          'gift_box',
          'celebration',
          'memory_wall',
          'memories',
          'timeline',
          'quiz',
          'scratch_card',
          'secret_messages',
          'future_wishes',
          'letters',
          'closing',
        ];

        const containerRect = container.getBoundingClientRect();
        const probeY = containerRect.top + containerRect.height * 0.35;

        let visibleSectionId: string | null = null;

        for (const secId of candidateSections) {
          const el = container.querySelector(`#${secId}`) as HTMLElement | null;
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= probeY && rect.bottom >= probeY) {
              visibleSectionId = secId;
              break;
            }
          }
        }

        if (visibleSectionId && onSectionVisible) {
          onSectionVisible(visibleSectionId);
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [onSectionVisible, activeStateMode]);

  // Compute container dimensions based on selected device preview mode
  const getDeviceFrameStyles = () => {
    if (isMobileDrawer) {
      return 'w-full h-full';
    }

    switch (device) {
      case 'mobile':
        return 'w-[380px] h-[720px] max-h-[82vh] rounded-[42px] border-[10px] border-stone-800 shadow-[0_25px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/10';
      case 'tablet':
        return 'w-[640px] h-[780px] max-h-[82vh] rounded-[32px] border-[10px] border-stone-800 shadow-[0_25px_60px_rgba(0,0,0,0.4)] ring-1 ring-white/10';
      case 'desktop':
      default:
        return 'w-full h-full min-h-[600px] max-h-[84vh] rounded-2xl border border-black/10 shadow-xl';
    }
  };

  // Render content according to stateMode (Unlocked vs Password Gate vs Expired Screen)
  const renderPreviewContent = () => {
    switch (activeStateMode) {
      case 'password_gate':
        return (
          <ThemeContainer themeId={gift.selected_theme} customConfig={gift.theme_config}>
            <PasswordGate
              giftTitle={gift.title}
              recipientName={gift.recipient_name}
              passwordHint={gift.password_hint}
              isDemo={false}
              revocationNotice={null}
              config={gift.theme_config?.password_page || gift.password_page_config}
              onSubmit={async (entered) => {
                if (!entered.trim()) {
                  return { success: false, error: 'Please enter a password to test.' };
                }
                return { success: true };
              }}
              onSuccess={() => handleStateChange('unlocked')}
            />
          </ThemeContainer>
        );

      case 'expired_closing':
        const expiryCfg = gift.theme_config?.expiry_page || gift.expiry_page_config;
        const expiryTheme = expiryCfg?.theme_id || gift.selected_theme;
        return (
          <ThemeContainer themeId={expiryTheme} customConfig={gift.theme_config}>
            <ExpiryScreen
              recipientName={gift.recipient_name}
              themeId={expiryTheme}
              heading={expiryCfg?.heading || gift.expiry_heading || 'This Gift Has Concluded'}
              message={
                expiryCfg?.message ||
                gift.expiry_message ||
                'Thank you for being part of this special moment. This digital keepsake has reached its scheduled conclusion.'
              }
              config={expiryCfg}
            />
          </ThemeContainer>
        );

      case 'unlocked':
      default:
        return (
          <RecipientExperience
            key={`preview-experience-${previewKey}-${gift.selected_theme}`}
            gift={gift}
            initialUnlocked={true}
            isPreview={true}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-stone-950/95 text-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Top Toolbar */}
      <div className="px-4 py-3 bg-stone-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Status Indicator & Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Auto Sync Live</span>
          </div>

          {/* Experience View Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-black/40 border border-white/10 text-xs">
            <button
              onClick={() => {
                handleStateChange('unlocked');
                if (activeSectionId) scrollToSection(activeSectionId);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activeStateMode === 'unlocked'
                  ? 'bg-platform-violet text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="Preview main unlocked gift journey"
            >
              Gift Journey
            </button>
            <button
              onClick={() => handleStateChange('password_gate')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activeStateMode === 'password_gate'
                  ? 'bg-platform-violet text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="Preview recipient password gate screen"
            >
              Password Gate
            </button>
            <button
              onClick={() => handleStateChange('expired_closing')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activeStateMode === 'expired_closing'
                  ? 'bg-platform-violet text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="Preview post-expiry farewell screen"
            >
              Closing Screen
            </button>
          </div>
        </div>

        {/* Right: Device Switcher & Controls */}
        <div className="flex items-center gap-2">
          {/* Device toggle (desktop only) */}
          {!isMobileDrawer && (
            <div className="hidden sm:inline-flex items-center p-0.5 rounded-lg bg-black/40 border border-white/10">
              <button
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  device === 'desktop'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="Desktop View (Full Width)"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevice('tablet')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  device === 'tablet'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="Tablet View (640px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  device === 'mobile'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="Mobile View (380px iPhone frame)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reset Preview Interaction */}
          <button
            onClick={handleResetPreview}
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/60 border border-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Replay from start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Reset</span>
          </button>

          {/* Close button for Mobile Full-Screen Overlay */}
          {isMobileDrawer && onCloseMobilePreview && (
            <button
              onClick={onCloseMobilePreview}
              className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer text-xs flex items-center gap-1 ml-2"
            >
              <X className="w-4 h-4" />
              <span className="font-semibold text-xs">Back to Editor</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Viewing Canvas Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex items-start justify-center bg-stone-950/80 relative">
        <div
          ref={viewportRef}
          className={`${getDeviceFrameStyles()} bg-[var(--theme-bg)] transition-all duration-300 overflow-y-auto relative scroll-smooth`}
        >
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
}
