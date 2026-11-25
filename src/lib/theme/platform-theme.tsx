'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type PlatformTheme = 'light' | 'dark' | 'system';
export type ResolvedPlatformTheme = 'light' | 'dark';

interface PlatformThemeContextValue {
  theme: PlatformTheme;
  resolvedTheme: ResolvedPlatformTheme;
  setTheme: (theme: PlatformTheme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const STORAGE_KEY = 'dear_you_platform_theme';

const PlatformThemeContext = createContext<PlatformThemeContextValue>({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  mounted: false,
});

/**
 * Resolves whether the system prefers dark mode
 */
function getSystemPreference(): ResolvedPlatformTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Applies the resolved platform theme directly to the root element.
 * Applies data-platform-theme attribute and Tailwind dark class.
 */
function applyPlatformThemeToDOM(resolved: ResolvedPlatformTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-platform-theme', resolved);
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

export function PlatformThemeProvider({
  children,
  defaultTheme = 'light',
}: {
  children: React.ReactNode;
  defaultTheme?: PlatformTheme;
}) {
  const [theme, setThemeState] = useState<PlatformTheme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedPlatformTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as PlatformTheme | null;
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setThemeState(stored);
      }
    } catch {}

    const initialSys = getSystemPreference();
    setSystemTheme(initialSys);
    setMounted(true);

    // Listen for system appearance changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Compute resolved theme
  const resolvedTheme: ResolvedPlatformTheme = useMemo(() => {
    if (theme === 'system') {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // Update DOM and local storage when theme or resolvedTheme changes
  useEffect(() => {
    if (!mounted) return;
    applyPlatformThemeToDOM(resolvedTheme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme, resolvedTheme, mounted]);

  const setTheme = (newTheme: PlatformTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
    const nextResolved = newTheme === 'system' ? getSystemPreference() : newTheme;
    applyPlatformThemeToDOM(nextResolved);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      mounted,
    }),
    [theme, resolvedTheme, mounted]
  );

  return (
    <PlatformThemeContext.Provider value={value}>
      {children}
    </PlatformThemeContext.Provider>
  );
}

/**
 * Access the global platform appearance anywhere in the application
 */
export function usePlatformTheme() {
  const context = useContext(PlatformThemeContext);
  if (!context) {
    throw new Error('usePlatformTheme must be used within a PlatformThemeProvider');
  }
  return context;
}

/**
 * Self-executing anti-flash script injected into HTML head before initial render.
 * Reads saved preference from localStorage and sets data-platform-theme immediately.
 */
export const platformThemeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('${STORAGE_KEY}');
      var preference = stored || 'light';
      var resolved = preference;
      if (preference === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-platform-theme', resolved);
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.add('light');
      }
    } catch (e) {}
  })();
`;
