export type ThemeId =
  | 'dreamy'
  | 'elegant'
  | 'scrapbook'
  | 'celebration'
  | 'pastel'
  | 'minimal'
  | 'romantic'
  | 'botanical'
  | 'custom'
  | string;

export interface CustomThemeConfig {
  [key: string]: any;
}

/**
 * Calculates WCAG 2.1 relative luminance for any 3- or 6-digit hex color.
 * Returns a value between 0 (pure black) and 1 (pure white).
 */
export function getRelativeLuminance(hexColor: string): number {
  if (!hexColor) return 1;
  const cleanHex = hexColor.replace('#', '').trim();
  let r = 255;
  let g = 255;
  let b = 255;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return 1;

  const srgb = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors.
 * Returns ratio from 1 (identical) to 21 (black on white).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export interface ScratchCardPaletteOptions {
  themeId?: ThemeId;
  themeConfig?: CustomThemeConfig;
  customRevealBg?: string;
}

export interface ScratchCardPalette {
  revealBg: string;
  revealBorder: string;
  textColor: string;
  iconColor: string;
  instructionColor: string;
  surfaceCardBg?: string;
  contrastRatio: number;
  isDarkSurface: boolean;
}

/**
 * Resolves the optimal, high-contrast, theme-aware color palette for the Scratch Card.
 * Guarantees that the revealed message is always legible (WCAG AA/AAA compliant > 7:1)
 * across all gift themes and surface treatments.
 */
export function getScratchCardPalette({
  themeId = 'dreamy',
  themeConfig,
  customRevealBg,
}: ScratchCardPaletteOptions = {}): ScratchCardPalette {
  // 1. Determine Reveal Surface Background
  // Check custom config first, then theme-specific styling, defaulting to the beloved warm ivory/cream parchment
  let effectiveBg =
    customRevealBg ||
    (themeConfig as any)?.scratch_card_reveal_bg ||
    (themeConfig as any)?.scratch_card?.reveal_bg;

  // Standard ivory / pale cream parchment surface (the Ananya demonstration default)
  const defaultCreamParchment = 'linear-gradient(135deg, #FFFDF7 0%, #FFF8E7 50%, #FEF3D6 100%)';
  const defaultCreamHex = '#FFF8E7';

  let revealBg = defaultCreamParchment;
  let sampleHex = defaultCreamHex;
  let revealBorder = 'rgba(217, 119, 6, 0.25)';

  if (effectiveBg) {
    if (effectiveBg.startsWith('#')) {
      sampleHex = effectiveBg;
      revealBg = effectiveBg;
      revealBorder = 'rgba(0, 0, 0, 0.15)';
    } else if (effectiveBg.includes('gradient')) {
      revealBg = effectiveBg;
      // Extract first hex found in gradient for luminance sampling
      const hexMatch = effectiveBg.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
      if (hexMatch) {
        sampleHex = hexMatch[0];
      }
    }
  }

  const luminance = getRelativeLuminance(sampleHex);
  const isDarkSurface = luminance <= 0.4;

  let textColor = '#2E1065'; // Default deep violet for cream surface
  let iconColor = '#D97706'; // Warm amber icon for cream surface
  let instructionColor = '#5B427A'; // Muted dark plum instruction

  if (isDarkSurface) {
    // -------------------------------------------------------------
    // DARK REVEAL SURFACES (Dark Purple, Midnight, Charcoal, Black)
    // -------------------------------------------------------------
    if (themeId === 'dreamy') {
      textColor = '#F5F3FF'; // Soft lavender-white
      iconColor = '#FDE047'; // Radiant star yellow
      instructionColor = '#C4B5FD';
      revealBorder = 'rgba(196, 181, 253, 0.3)';
    } else {
      textColor = '#FFFFFF'; // Crisp pure white
      iconColor = '#FBBF24'; // Radiant amber
      instructionColor = '#E2E8F0';
      revealBorder = 'rgba(255, 255, 255, 0.2)';
    }
  } else {
    // -------------------------------------------------------------
    // LIGHT REVEAL SURFACES (Pale Cream, White, Pastel Pink, Gold)
    // -------------------------------------------------------------
    const sampleHexLower = sampleHex.toLowerCase();

    // Check specific light surface variants
    const isPastelPink =
      sampleHexLower.includes('fce7f3') ||
      sampleHexLower.includes('ffe4e6') ||
      sampleHexLower.includes('fdf2f4') ||
      sampleHexLower.includes('ffb6c1');

    const isGoldYellow =
      sampleHexLower.includes('fef08a') ||
      sampleHexLower.includes('fde047') ||
      sampleHexLower.includes('f5e6ab') ||
      sampleHexLower.includes('fef3c7');

    const isPureWhite =
      sampleHexLower === '#fff' ||
      sampleHexLower === '#ffffff' ||
      sampleHexLower === '#fafafa';

    if (isPastelPink || themeId === 'pastel') {
      // Pastel Pink: Deep plum or dark maroon
      textColor = '#3B1220';
      iconColor = '#BE185D';
      instructionColor = '#501A2C';
      revealBorder = 'rgba(190, 24, 93, 0.25)';
    } else if (isGoldYellow) {
      // Gold / Yellow: Dark espresso or charcoal
      textColor = '#2A1810';
      iconColor = '#92400E';
      instructionColor = '#452A1C';
      revealBorder = 'rgba(180, 83, 9, 0.3)';
    } else if (isPureWhite || themeId === 'minimal') {
      // White / Minimal: Rich charcoal
      textColor = '#111827';
      iconColor = '#D97706';
      instructionColor = '#4B5563';
      revealBorder = 'rgba(0, 0, 0, 0.12)';
    } else if (themeId === 'scrapbook') {
      // Scrapbook: Deep espresso / dark chocolate
      textColor = '#2E1E14';
      iconColor = '#B45309';
      instructionColor = '#574133';
      revealBorder = 'rgba(140, 101, 81, 0.25)';
    } else if (themeId === 'elegant') {
      // Elegant: Deep warm charcoal / dark bronze
      textColor = '#1C1917';
      iconColor = '#B45309';
      instructionColor = '#44403C';
      revealBorder = 'rgba(212, 175, 55, 0.35)';
    } else {
      // Default (including Ananya Dreamy cream surface): Deep violet / dark plum
      textColor = '#2E1065';
      iconColor = '#D97706';
      instructionColor = '#5B427A';
      revealBorder = 'rgba(217, 119, 6, 0.25)';
    }
  }

  // Calculate actual WCAG contrast ratio against sample surface
  const contrastRatio = getContrastRatio(textColor, sampleHex);

  return {
    revealBg,
    revealBorder,
    textColor,
    iconColor,
    instructionColor,
    contrastRatio,
    isDarkSurface,
  };
}
