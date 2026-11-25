export type ThemeId =
  | 'dreamy'
  | 'elegant'
  | 'scrapbook'
  | 'celebration'
  | 'pastel'
  | 'minimal'
  | 'custom';

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  accentFont?: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  borderRadius: string;
  animationIntensity: 'gentle' | 'balanced' | 'festive';
  backgroundStyle: 'mesh' | 'stars' | 'confetti' | 'paper' | 'gradient' | 'clean';
  badge: string;
  previewGradient: string;
}

export interface CustomThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  accentColor?: string;
  headingFont?: 'Playfair Display' | 'Inter' | 'Caveat' | 'Cinzel' | 'Outfit';
  bodyFont?: 'Inter' | 'Plus Jakarta Sans' | 'Lora' | 'System';
  animationIntensity?: 'gentle' | 'balanced' | 'festive';
  backgroundStyle?: 'mesh' | 'stars' | 'confetti' | 'paper' | 'gradient' | 'clean';
  coverImageUrl?: string;
  password_page?: any;
  expiry_page?: any;
}
