import { CustomThemeConfig, ThemeDefinition, ThemeId } from '@/types/theme';

export const THEME_PRESETS: Record<Exclude<ThemeId, 'custom'>, ThemeDefinition> = {
  dreamy: {
    id: 'dreamy',
    name: 'Dreamy & Magical',
    tagline: 'Stars, soft glow, and night-sky wonder',
    description: 'Lavender, deep purple, stars, moon, and soft glowing ambient effects. Perfect for emotional birthdays and deep bonds.',
    badge: '★ Magical',
    previewGradient: 'from-violet-900 via-purple-900 to-indigo-950',
    borderRadius: '1rem',
    animationIntensity: 'gentle',
    backgroundStyle: 'stars',
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      accentFont: 'Caveat',
    },
    colors: {
      bg: '#0D0B18',
      surface: '#18142C',
      text: '#F5F3FF',
      muted: '#A79BC8',
      primary: '#9D85C5',
      secondary: '#C4B5FD',
      accent: '#FDE047',
      border: 'rgba(157, 133, 197, 0.25)',
    },
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant & Premium',
    tagline: 'Black, champagne, ivory, and refined gold',
    description: 'High-contrast luxury with gold accents, sophisticated serif typography, and subtle transitions.',
    badge: '✦ Luxury',
    previewGradient: 'from-zinc-950 via-stone-900 to-neutral-950',
    borderRadius: '0.75rem',
    animationIntensity: 'gentle',
    backgroundStyle: 'clean',
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      accentFont: 'Playfair Display',
    },
    colors: {
      bg: '#0C0A09',
      surface: '#1C1917',
      text: '#FAF7F2',
      muted: '#A8A29E',
      primary: '#D4AF37',
      secondary: '#F5E6AB',
      accent: '#E5C158',
      border: 'rgba(212, 175, 55, 0.3)',
    },
  },
  scrapbook: {
    id: 'scrapbook',
    name: 'Memories & Scrapbook',
    tagline: 'Polaroids, kraft paper, and nostalgic warmth',
    description: 'Warm cream, muted pastels, paper textures, and handwritten captions reminiscent of a handcrafted memory album.',
    badge: '♥ Nostalgic',
    previewGradient: 'from-amber-100 via-orange-50 to-stone-200',
    borderRadius: '0.5rem',
    animationIntensity: 'gentle',
    backgroundStyle: 'paper',
    typography: {
      headingFont: 'Caveat',
      bodyFont: 'Inter',
      accentFont: 'Caveat',
    },
    colors: {
      bg: '#F7F3EB',
      surface: '#FFFDF9',
      text: '#3D312A',
      muted: '#7C6F65',
      primary: '#8C6551',
      secondary: '#C4A482',
      accent: '#D48C70',
      border: 'rgba(140, 101, 81, 0.2)',
    },
  },
  celebration: {
    id: 'celebration',
    name: 'Celebration & Birthday',
    tagline: 'Festive confetti, cake, and vibrant joy',
    description: 'Vibrant but tasteful colors, celebration effects, cake candles, and confetti. Full of upbeat excitement.',
    badge: '🎉 Festive',
    previewGradient: 'from-rose-500 via-amber-400 to-teal-400',
    borderRadius: '1.25rem',
    animationIntensity: 'festive',
    backgroundStyle: 'confetti',
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      accentFont: 'Caveat',
    },
    colors: {
      bg: '#FFFAF5',
      surface: '#FFFFFF',
      text: '#1F1B24',
      muted: '#6E6779',
      primary: '#FF4D6D',
      secondary: '#FFAA00',
      accent: '#06D6A0',
      border: 'rgba(255, 77, 109, 0.2)',
    },
  },
  pastel: {
    id: 'pastel',
    name: 'Soft Pastel',
    tagline: 'Blush pink, peach mist, and gentle comfort',
    description: 'Pink, peach, soft lavender, and cream. Gentle animations and calming, tender aesthetic.',
    badge: '✿ Gentle',
    previewGradient: 'from-pink-100 via-rose-100 to-purple-100',
    borderRadius: '1.25rem',
    animationIntensity: 'gentle',
    backgroundStyle: 'mesh',
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      accentFont: 'Caveat',
    },
    colors: {
      bg: '#FFF6F7',
      surface: '#FFFFFF',
      text: '#43343A',
      muted: '#8D7B83',
      primary: '#E07A5F',
      secondary: '#F28482',
      accent: '#84A59D',
      border: 'rgba(242, 132, 130, 0.25)',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal & Modern',
    tagline: 'Architectural clarity, neutral calm, and focus',
    description: 'Neutral monochromatic background, clean typography, generous whitespace, and understated transitions.',
    badge: '◻ Modern',
    previewGradient: 'from-slate-100 via-zinc-100 to-stone-200',
    borderRadius: '0.5rem',
    animationIntensity: 'gentle',
    backgroundStyle: 'clean',
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      accentFont: 'Inter',
    },
    colors: {
      bg: '#F8F9FA',
      surface: '#FFFFFF',
      text: '#111827',
      muted: '#6B7280',
      primary: '#111827',
      secondary: '#4B5563',
      accent: '#3B82F6',
      border: 'rgba(17, 24, 39, 0.12)',
    },
  },
};

export function getThemeDefinition(
  themeId: ThemeId,
  customConfig?: CustomThemeConfig
): ThemeDefinition {
  if (themeId !== 'custom') {
    return THEME_PRESETS[themeId] || THEME_PRESETS.dreamy;
  }

  // Generate dynamic custom theme
  const bg = customConfig?.backgroundColor || '#0F0E17';
  const primary = customConfig?.primaryColor || '#FF8906';
  const secondary = customConfig?.secondaryColor || '#F25F4C';
  const accent = customConfig?.accentColor || '#E53170';

  return {
    id: 'custom',
    name: 'Custom Theme',
    tagline: 'Tailored palette and personalized styling',
    description: 'Administrator-configured colors, typography, and visual atmosphere.',
    badge: '⚙ Custom',
    previewGradient: 'from-amber-500 via-orange-600 to-pink-600',
    borderRadius: '1rem',
    animationIntensity: customConfig?.animationIntensity || 'balanced',
    backgroundStyle: customConfig?.backgroundStyle || 'mesh',
    typography: {
      headingFont: customConfig?.headingFont || 'Playfair Display',
      bodyFont: customConfig?.bodyFont || 'Inter',
      accentFont: 'Caveat',
    },
    colors: {
      bg,
      surface: customConfig?.surfaceColor || '#1A1829',
      text: customConfig?.textColor || '#FFFFFE',
      muted: '#A7A9BE',
      primary,
      secondary,
      accent,
      border: `${primary}33`,
    },
  };
}

export function generateThemeCssVariables(theme: ThemeDefinition): Record<string, string> {
  return {
    '--theme-bg': theme.colors.bg,
    '--theme-surface': theme.colors.surface,
    '--theme-text': theme.colors.text,
    '--theme-muted': theme.colors.muted,
    '--theme-primary': theme.colors.primary,
    '--theme-secondary': theme.colors.secondary,
    '--theme-accent': theme.colors.accent,
    '--theme-border': theme.colors.border,
    '--theme-radius': theme.borderRadius,
  };
}
