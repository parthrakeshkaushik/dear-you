'use client';

import React, { useMemo } from 'react';
import { getThemeDefinition, generateThemeCssVariables } from '@/config/themes';
import { CustomThemeConfig, ThemeId } from '@/types/theme';

interface ThemeContainerProps {
  themeId: ThemeId;
  customConfig?: CustomThemeConfig;
  children: React.ReactNode;
  className?: string;
}

export function ThemeContainer({
  themeId,
  customConfig,
  children,
  className = '',
}: ThemeContainerProps) {
  const theme = useMemo(
    () => getThemeDefinition(themeId, customConfig),
    [themeId, customConfig]
  );

  const cssVariables = useMemo(
    () => generateThemeCssVariables(theme) as React.CSSProperties,
    [theme]
  );

  // Background atmosphere overlay based on theme
  const renderBackgroundAtmosphere = () => {
    switch (theme.backgroundStyle) {
      case 'stars':
        return (
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            {/* Glowing stars */}
            <div className="absolute top-[15%] left-[20%] w-1.5 h-1.5 rounded-full bg-white animate-sparkle" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-[28%] left-[75%] w-2 h-2 rounded-full bg-purple-200 animate-sparkle" style={{ animationDelay: '1.2s' }} />
            <div className="absolute top-[45%] left-[10%] w-1 h-1 rounded-full bg-amber-100 animate-sparkle" style={{ animationDelay: '0.8s' }} />
            <div className="absolute top-[65%] left-[85%] w-2 h-2 rounded-full bg-white animate-sparkle" style={{ animationDelay: '1.8s' }} />
            <div className="absolute top-[80%] left-[30%] w-1.5 h-1.5 rounded-full bg-purple-100 animate-sparkle" style={{ animationDelay: '0.4s' }} />
            {/* Ambient subtle glow */}
            <div className="absolute top-[10%] right-[5%] w-96 h-96 rounded-full bg-purple-600/10 blur-[100px]" />
            <div className="absolute bottom-[20%] left-[5%] w-96 h-96 rounded-full bg-indigo-600/10 blur-[100px]" />
          </div>
        );
      case 'paper':
        return (
          <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-0 bg-[radial-gradient(#3d312a_1px,transparent_1px)] [background-size:16px_16px]" />
        );
      case 'confetti':
        return (
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div className="absolute top-10 left-[12%] w-3 h-3 rounded-full bg-rose-400/20 blur-xs" />
            <div className="absolute top-40 right-[15%] w-4 h-4 rounded-sm rotate-45 bg-amber-400/20 blur-xs" />
            <div className="absolute bottom-32 left-[20%] w-3 h-3 rounded-full bg-teal-400/20 blur-xs" />
          </div>
        );
      case 'mesh':
        return (
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-pink-300/15 blur-[120px]" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-purple-300/15 blur-[120px]" />
          </div>
        );
      case 'clean':
      default:
        return null;
    }
  };

  return (
    <div
      style={cssVariables}
      className={`relative min-h-screen transition-colors duration-500 bg-[var(--theme-bg)] text-[var(--theme-text)] font-sans ${className}`}
    >
      {renderBackgroundAtmosphere()}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
