'use client';

import React, { useState } from 'react';
import { THEME_PRESETS, getThemeDefinition } from '@/config/themes';
import { ThemeId } from '@/types/theme';
import { Palette, Sparkles, Check, Heart, Gift } from 'lucide-react';

export default function AdminThemesPage() {
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>('dreamy');
  const activeTheme = getThemeDefinition(activeThemeId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-black/5">
        <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal">
          Theme Design Tokens & Presets
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-platform-muted">
          Explore and inspect the 7 independent visual atmospheres crafted for Dear You gifts.
        </p>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(THEME_PRESETS).map(([id, theme]) => {
          const isSelected = activeThemeId === id;

          return (
            <div
              key={id}
              onClick={() => setActiveThemeId(id as ThemeId)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-platform-violet bg-platform-card shadow-md ring-2 ring-platform-violet/20'
                  : 'border-platform-border hover:border-platform-muted/40 bg-platform-card'
              }`}
            >
              <div>
                <div
                  className={`w-full h-24 rounded-xl bg-gradient-to-br ${theme.previewGradient} flex items-center justify-center shadow-inner mb-4`}
                >
                  <span className="text-white text-xs font-medium px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs">
                    {theme.badge}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-semibold text-platform-dark">
                  {theme.name}
                </h3>
                <p className="text-xs text-platform-muted mt-1 leading-relaxed">
                  {theme.description}
                </p>

                {/* Color swatches */}
                <div className="mt-4 flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.colors.bg }}
                    title={`Background: ${theme.colors.bg}`}
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.colors.primary }}
                    title={`Primary: ${theme.colors.primary}`}
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.colors.secondary }}
                    title={`Secondary: ${theme.colors.secondary}`}
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.colors.accent }}
                    title={`Accent: ${theme.colors.accent}`}
                  />
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                <span className="text-platform-muted">{theme.typography.headingFont}</span>
                {isSelected ? (
                  <span className="text-platform-violet font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Inspected
                  </span>
                ) : (
                  <span className="text-platform-muted">Click to preview</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Sample Component Sandbox in Active Theme */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-normal text-platform-dark">
          Live Component Rendering: {activeTheme.name}
        </h2>

        <div
          className="p-8 sm:p-12 rounded-3xl transition-colors duration-500 shadow-xl border flex flex-col items-center text-center relative overflow-hidden"
          style={{
            backgroundColor: activeTheme.colors.bg,
            color: activeTheme.colors.text,
            borderColor: activeTheme.colors.border,
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md"
            style={{
              backgroundColor: `${activeTheme.colors.primary}20`,
              color: activeTheme.colors.primary,
            }}
          >
            <Gift className="w-7 h-7" />
          </div>

          <span
            className="font-handwriting text-2xl tracking-wide"
            style={{ color: activeTheme.colors.secondary }}
          >
            Sample Recipient Card
          </span>

          <h3 className="mt-2 font-serif text-3xl sm:text-4xl font-normal max-w-md">
            Every little moment counts with you.
          </h3>

          <p
            className="mt-4 text-xs sm:text-sm max-w-sm font-light leading-relaxed"
            style={{ color: activeTheme.colors.muted }}
          >
            This interactive preview demonstrates how buttons, badges, typography, and contrast harmonize within the selected palette.
          </p>

          <button
            className="mt-8 px-6 py-3 rounded-full text-xs font-semibold shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            style={{
              backgroundColor: activeTheme.colors.primary,
              color: activeTheme.colors.bg,
            }}
          >
            Experience Theme Buttons
          </button>
        </div>
      </div>
    </div>
  );
}
