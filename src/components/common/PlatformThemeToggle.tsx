'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { usePlatformTheme, PlatformTheme } from '@/lib/theme/platform-theme';

interface PlatformThemeToggleProps {
  variant?: 'button' | 'compact' | 'menu' | 'segmented';
  className?: string;
  showLabel?: boolean;
}

export function PlatformThemeToggle({
  variant = 'button',
  className = '',
  showLabel = false,
}: PlatformThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme, mounted } = usePlatformTheme();

  // Prevent hydration mismatch during initial SSR
  const isDark = mounted ? resolvedTheme === 'dark' : false;

  // 1. Segmented Control (used in Settings and Preferences)
  if (variant === 'segmented') {
    const options: Array<{ id: PlatformTheme; label: string; icon: typeof Sun }> = [
      { id: 'light', label: 'Light', icon: Sun },
      { id: 'dark', label: 'Dark', icon: Moon },
      { id: 'system', label: 'System', icon: Laptop },
    ];

    return (
      <div
        className={`inline-flex items-center p-1 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 ${className}`}
        role="radiogroup"
        aria-label="Platform theme selection"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = mounted && theme === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-platform-card text-platform-text shadow-xs'
                  : 'text-platform-muted hover:text-platform-text'
              }`}
              role="radio"
              aria-checked={isSelected}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Menu Item (used in mobile navigation drawer and profile dropdown)
  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-platform-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-left ${className}`}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span className="flex items-center gap-2.5">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
          <span>Appearance</span>
        </span>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-platform-muted uppercase font-semibold">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  // 3. Compact Icon-only (used in Gift Builder toolbar & Live Preview controls)
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-1.5 sm:p-2 rounded-xl text-platform-muted hover:text-platform-text hover:bg-black/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 transition-all cursor-pointer flex items-center justify-center shrink-0 ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-platform-muted hover:text-indigo-600 transition-transform hover:-rotate-12" />
        )}
      </button>
    );
  }

  // 4. Standard Button (used in Top Headers and Navigation Bars)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-medium text-platform-muted hover:text-platform-text bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all cursor-pointer shadow-2xs active:scale-95 ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
      )}
      {showLabel && (
        <span className="font-medium text-[11px] sm:text-xs">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
