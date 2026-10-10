import { ThemeId, ColorMode } from '../types';

export interface ThemeColors {
  id: ThemeId;
  mode: 'dark' | 'light';
  name: string;
  tagline: string;

  // Primary brand / accent colors
  accent: string;
  accentHover: string;
  accentDark: string;
  accentSubtle: string;
  accentGlow: string;
  accentContrastText: string; // Color of text when placed directly on accent background

  // Surfaces and Structure
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceBorder: string;
  surfaceSubtle: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;

  // Functional Status Colors
  flame: string;
  flameSubtle: string;
  azure: string;
  azureSubtle: string;
  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
  emerald: string;
  emeraldBg: string;

  // Legacy compatibility aliases (so existing Colors.volt calls stay functional)
  volt: string;
  voltHover: string;
  voltDark: string;
  voltSubtle: string;
  voltGlow: string;
}

export interface ThemeMetadata {
  id: ThemeId;
  name: string;
  tagline: string;
  accentHex: string;
  darkBg: string;
  lightBg: string;
}

export const THEME_METADATA: Record<ThemeId, ThemeMetadata> = {
  crimson: {
    id: 'crimson',
    name: 'Hyper Crimson',
    tagline: 'Obsidian & Surgical Red',
    accentHex: '#FF3B30',
    darkBg: '#090A0F',
    lightBg: '#F8F9FA',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Pro',
    tagline: 'Deep Slate & Matrix Mint',
    accentHex: '#00F5A0',
    darkBg: '#060C09',
    lightBg: '#F4FAF6',
  },
  cobalt: {
    id: 'cobalt',
    name: 'Electric Cobalt',
    tagline: 'Midnight Abyss & Cyan',
    accentHex: '#00D2FF',
    darkBg: '#070A14',
    lightBg: '#F3F8FC',
  },
  amber: {
    id: 'amber',
    name: 'Molten Amber',
    tagline: 'Warm Espresso & Molten Gold',
    accentHex: '#FF9F0A',
    darkBg: '#0C0A07',
    lightBg: '#FAF8F3',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Swiss Editorial',
    tagline: 'OLED Black & Titanium White',
    accentHex: '#F8FAFC',
    darkBg: '#080808',
    lightBg: '#F5F5F7',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst Void',
    tagline: 'Dark Twilight & Laser Lilac',
    accentHex: '#C084FC',
    darkBg: '#0B0814',
    lightBg: '#F9F6FC',
  },
};

export const THEME_LIST = Object.values(THEME_METADATA);

export const THEME_PALETTES: Record<ThemeId, { dark: ThemeColors; light: ThemeColors }> = {
  // 1. Hyper Crimson
  crimson: {
    dark: {
      id: 'crimson',
      mode: 'dark',
      name: 'Hyper Crimson',
      tagline: 'Obsidian & Surgical Red',
      accent: '#FF3B30',
      accentHover: '#E02D22',
      accentDark: '#450A0A',
      accentSubtle: 'rgba(255, 59, 48, 0.16)',
      accentGlow: 'rgba(255, 59, 48, 0.32)',
      accentContrastText: '#FFFFFF',
      background: '#090A0F',
      surface: '#131520',
      surfaceRaised: '#1C1F2E',
      surfaceBorder: '#282D42',
      surfaceSubtle: '#363D57',
      textPrimary: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      textDim: '#64748B',
      flame: '#FF9500',
      flameSubtle: 'rgba(255, 149, 0, 0.16)',
      azure: '#38BDF8',
      azureSubtle: 'rgba(56, 189, 248, 0.15)',
      danger: '#EF4444',
      dangerBg: 'rgba(239, 68, 68, 0.16)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.16)',
      emerald: '#10B981',
      emeraldBg: 'rgba(16, 185, 129, 0.16)',
      volt: '#FF3B30',
      voltHover: '#E02D22',
      voltDark: '#450A0A',
      voltSubtle: 'rgba(255, 59, 48, 0.16)',
      voltGlow: 'rgba(255, 59, 48, 0.32)',
    },
    light: {
      id: 'crimson',
      mode: 'light',
      name: 'Hyper Crimson',
      tagline: 'Obsidian & Surgical Red',
      accent: '#E0241B',
      accentHover: '#C81E15',
      accentDark: '#991B1B',
      accentSubtle: 'rgba(224, 36, 27, 0.12)',
      accentGlow: 'rgba(224, 36, 27, 0.22)',
      accentContrastText: '#FFFFFF',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      surfaceRaised: '#F1F3F5',
      surfaceBorder: '#E2E4E9',
      surfaceSubtle: '#EDEDF2',
      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#64748B',
      textDim: '#94A3B8',
      flame: '#D97706',
      flameSubtle: 'rgba(217, 119, 6, 0.12)',
      azure: '#0284C7',
      azureSubtle: 'rgba(2, 132, 199, 0.12)',
      danger: '#DC2626',
      dangerBg: 'rgba(220, 38, 38, 0.12)',
      warning: '#D97706',
      warningBg: 'rgba(217, 119, 6, 0.12)',
      emerald: '#059669',
      emeraldBg: 'rgba(5, 150, 105, 0.12)',
      volt: '#E0241B',
      voltHover: '#C81E15',
      voltDark: '#991B1B',
      voltSubtle: 'rgba(224, 36, 27, 0.12)',
      voltGlow: 'rgba(224, 36, 27, 0.22)',
    },
  },

  // 2. Emerald Pro
  emerald: {
    dark: {
      id: 'emerald',
      mode: 'dark',
      name: 'Emerald Pro',
      tagline: 'Deep Slate & Matrix Mint',
      accent: '#00F5A0',
      accentHover: '#00D68C',
      accentDark: '#064E3B',
      accentSubtle: 'rgba(0, 245, 160, 0.16)',
      accentGlow: 'rgba(0, 245, 160, 0.32)',
      accentContrastText: '#000000',
      background: '#060C09',
      surface: '#0F1A14',
      surfaceRaised: '#16271E',
      surfaceBorder: '#233E30',
      surfaceSubtle: '#2E523F',
      textPrimary: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      textDim: '#64748B',
      flame: '#F59E0B',
      flameSubtle: 'rgba(245, 158, 11, 0.16)',
      azure: '#38BDF8',
      azureSubtle: 'rgba(56, 189, 248, 0.15)',
      danger: '#EF4444',
      dangerBg: 'rgba(239, 68, 68, 0.16)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.16)',
      emerald: '#10B981',
      emeraldBg: 'rgba(16, 185, 129, 0.16)',
      volt: '#00F5A0',
      voltHover: '#00D68C',
      voltDark: '#064E3B',
      voltSubtle: 'rgba(0, 245, 160, 0.16)',
      voltGlow: 'rgba(0, 245, 160, 0.32)',
    },
    light: {
      id: 'emerald',
      mode: 'light',
      name: 'Emerald Pro',
      tagline: 'Deep Slate & Matrix Mint',
      accent: '#059669',
      accentHover: '#047857',
      accentDark: '#065F46',
      accentSubtle: 'rgba(5, 150, 105, 0.12)',
      accentGlow: 'rgba(5, 150, 105, 0.22)',
      accentContrastText: '#FFFFFF',
      background: '#F4FAF6',
      surface: '#FFFFFF',
      surfaceRaised: '#EBF5EF',
      surfaceBorder: '#D1E7DD',
      surfaceSubtle: '#E2F0E8',
      textPrimary: '#062516',
      textSecondary: '#1E3F2E',
      textMuted: '#4B6F5D',
      textDim: '#789886',
      flame: '#D97706',
      flameSubtle: 'rgba(217, 119, 6, 0.12)',
      azure: '#0284C7',
      azureSubtle: 'rgba(2, 132, 199, 0.12)',
      danger: '#DC2626',
      dangerBg: 'rgba(220, 38, 38, 0.12)',
      warning: '#D97706',
      warningBg: 'rgba(217, 119, 6, 0.12)',
      emerald: '#059669',
      emeraldBg: 'rgba(5, 150, 105, 0.12)',
      volt: '#059669',
      voltHover: '#047857',
      voltDark: '#065F46',
      voltSubtle: 'rgba(5, 150, 105, 0.12)',
      voltGlow: 'rgba(5, 150, 105, 0.22)',
    },
  },

  // 3. Electric Cobalt
  cobalt: {
    dark: {
      id: 'cobalt',
      mode: 'dark',
      name: 'Electric Cobalt',
      tagline: 'Midnight Abyss & Cyan',
      accent: '#00D2FF',
      accentHover: '#00B4DB',
      accentDark: '#1E3A8A',
      accentSubtle: 'rgba(0, 210, 255, 0.16)',
      accentGlow: 'rgba(0, 210, 255, 0.32)',
      accentContrastText: '#000000',
      background: '#070A14',
      surface: '#0F1629',
      surfaceRaised: '#16223D',
      surfaceBorder: '#23345E',
      surfaceSubtle: '#2F457A',
      textPrimary: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      textDim: '#64748B',
      flame: '#F97316',
      flameSubtle: 'rgba(249, 115, 22, 0.16)',
      azure: '#38BDF8',
      azureSubtle: 'rgba(56, 189, 248, 0.15)',
      danger: '#EF4444',
      dangerBg: 'rgba(239, 68, 68, 0.16)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.16)',
      emerald: '#10B981',
      emeraldBg: 'rgba(16, 185, 129, 0.16)',
      volt: '#00D2FF',
      voltHover: '#00B4DB',
      voltDark: '#1E3A8A',
      voltSubtle: 'rgba(0, 210, 255, 0.16)',
      voltGlow: 'rgba(0, 210, 255, 0.32)',
    },
    light: {
      id: 'cobalt',
      mode: 'light',
      name: 'Electric Cobalt',
      tagline: 'Midnight Abyss & Cyan',
      accent: '#0284C7',
      accentHover: '#0369A1',
      accentDark: '#075985',
      accentSubtle: 'rgba(2, 132, 199, 0.12)',
      accentGlow: 'rgba(2, 132, 199, 0.22)',
      accentContrastText: '#FFFFFF',
      background: '#F3F8FC',
      surface: '#FFFFFF',
      surfaceRaised: '#E8F2FA',
      surfaceBorder: '#CCE2F5',
      surfaceSubtle: '#DCEBF7',
      textPrimary: '#0C2340',
      textSecondary: '#203A58',
      textMuted: '#4C6B8B',
      textDim: '#829DB8',
      flame: '#EA580C',
      flameSubtle: 'rgba(234, 88, 12, 0.12)',
      azure: '#0284C7',
      azureSubtle: 'rgba(2, 132, 199, 0.12)',
      danger: '#DC2626',
      dangerBg: 'rgba(220, 38, 38, 0.12)',
      warning: '#D97706',
      warningBg: 'rgba(217, 119, 6, 0.12)',
      emerald: '#059669',
      emeraldBg: 'rgba(5, 150, 105, 0.12)',
      volt: '#0284C7',
      voltHover: '#0369A1',
      voltDark: '#075985',
      voltSubtle: 'rgba(2, 132, 199, 0.12)',
      voltGlow: 'rgba(2, 132, 199, 0.22)',
    },
  },

  // 4. Molten Amber
  amber: {
    dark: {
      id: 'amber',
      mode: 'dark',
      name: 'Molten Amber',
      tagline: 'Warm Espresso & Molten Gold',
      accent: '#FF9F0A',
      accentHover: '#E68A00',
      accentDark: '#78350F',
      accentSubtle: 'rgba(255, 159, 10, 0.16)',
      accentGlow: 'rgba(255, 159, 10, 0.32)',
      accentContrastText: '#000000',
      background: '#0C0A07',
      surface: '#1A150F',
      surfaceRaised: '#262017',
      surfaceBorder: '#3C3225',
      surfaceSubtle: '#4E4231',
      textPrimary: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      textDim: '#64748B',
      flame: '#EF4444',
      flameSubtle: 'rgba(239, 68, 68, 0.16)',
      azure: '#38BDF8',
      azureSubtle: 'rgba(56, 189, 248, 0.15)',
      danger: '#EF4444',
      dangerBg: 'rgba(239, 68, 68, 0.16)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.16)',
      emerald: '#10B981',
      emeraldBg: 'rgba(16, 185, 129, 0.16)',
      volt: '#FF9F0A',
      voltHover: '#E68A00',
      voltDark: '#78350F',
      voltSubtle: 'rgba(255, 159, 10, 0.16)',
      voltGlow: 'rgba(255, 159, 10, 0.32)',
    },
    light: {
      id: 'amber',
      mode: 'light',
      name: 'Molten Amber',
      tagline: 'Warm Espresso & Molten Gold',
      accent: '#D97706',
      accentHover: '#B45309',
      accentDark: '#92400E',
      accentSubtle: 'rgba(217, 119, 6, 0.12)',
      accentGlow: 'rgba(217, 119, 6, 0.22)',
      accentContrastText: '#FFFFFF',
      background: '#FAF8F3',
      surface: '#FFFFFF',
      surfaceRaised: '#F5EFE4',
      surfaceBorder: '#E8DDC9',
      surfaceSubtle: '#EFE6D6',
      textPrimary: '#291E0A',
      textSecondary: '#4A3B20',
      textMuted: '#736142',
      textDim: '#9E8C6D',
      flame: '#DC2626',
      flameSubtle: 'rgba(220, 38, 38, 0.12)',
      azure: '#0284C7',
      azureSubtle: 'rgba(2, 132, 199, 0.12)',
      danger: '#DC2626',
      dangerBg: 'rgba(220, 38, 38, 0.12)',
      warning: '#D97706',
      warningBg: 'rgba(217, 119, 6, 0.12)',
      emerald: '#059669',
      emeraldBg: 'rgba(5, 150, 105, 0.12)',
      volt: '#D97706',
      voltHover: '#B45309',
      voltDark: '#92400E',
      voltSubtle: 'rgba(217, 119, 6, 0.12)',
      voltGlow: 'rgba(217, 119, 6, 0.22)',
    },
  },

  // 5. Swiss Editorial
  monochrome: {
    dark: {
      id: 'monochrome',
      mode: 'dark',
      name: 'Swiss Editorial',
      tagline: 'OLED Black & Titanium White',
      accent: '#FFFFFF',
      accentHover: '#E5E5E5',
      accentDark: '#52525B',
      accentSubtle: 'rgba(255, 255, 255, 0.16)',
      accentGlow: 'rgba(255, 255, 255, 0.32)',
      accentContrastText: '#000000',
      background: '#080808',
      surface: '#151515',
      surfaceRaised: '#222222',
      surfaceBorder: '#333333',
      surfaceSubtle: '#444444',
      textPrimary: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      textDim: '#64748B',
      flame: '#F59E0B',
      flameSubtle: 'rgba(245, 158, 11, 0.16)',
      azure: '#38BDF8',
      azureSubtle: 'rgba(56, 189, 248, 0.15)',
      danger: '#EF4444',
      dangerBg: 'rgba(239, 68, 68, 0.16)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.16)',
      emerald: '#10B981',
      emeraldBg: 'rgba(16, 185, 129, 0.16)',
      volt: '#FFFFFF',
      voltHover: '#E5E5E5',
      voltDark: '#52525B',
      voltSubtle: 'rgba(255, 255, 255, 0.16)',
      voltGlow: 'rgba(255, 255, 255, 0.32)',
    },
    light: {
      id: 'monochrome',
      mode: 'light',
      name: 'Swiss Editorial',
      tagline: 'OLED Black & Titanium White',
      accent: '#18181B',
      accentHover: '#27272A',
      accentDark: '#3F3F46',
      accentSubtle: 'rgba(24, 24, 27, 0.10)',
      accentGlow: 'rgba(24, 24, 27, 0.20)',
      accentContrastText: '#FFFFFF',
      background: '#F5F5F7',
      surface: '#FFFFFF',
      surfaceRaised: '#EAEAEF',
      surfaceBorder: '#D8D8E0',
      surfaceSubtle: '#E2E2EA',
      textPrimary: '#09090B',
      textSecondary: '#27272A',
      textMuted: '#71717A',
      textDim: '#A1A1AA',
      flame: '#D97706',
      flameSubtle: 'rgba(217, 119, 6, 0.12)',
      azure: '#0284C7',
      azureSubtle: 'rgba(2, 132, 199, 0.12)',
      danger: '#DC2626',
      dangerBg: 'rgba(220, 38, 38, 0.12)',
      warning: '#D97706',
      warningBg: 'rgba(217, 119, 6, 0.12)',
      emerald: '#059669',
      emeraldBg: 'rgba(5, 150, 105, 0.12)',
      volt: '#18181B',
      voltHover: '#27272A',
      voltDark: '#3F3F46',
      voltSubtle: 'rgba(24, 24, 27, 0.10)',
      voltGlow: 'rgba(24, 24, 27, 0.20)',
    },
  },

  // 6. Amethyst Void
  amethyst: {
    dark: {
      id: 'amethyst',
      mode: 'dark',
      name: 'Amethyst Void',
      tagline: 'Dark Twilight & Laser Lilac',
      accent: '#C084FC',
      accentHover: '#A855F7',
      accentDark: '#581C87',
      accentSubtle: 'rgba(192, 132, 252, 0.16)',
      accentGlow: 'rgba(192, 132, 252, 0.32)',
      accentContrastText: '#000000',
      background: '#0B0814',
      surface: '#161028',
      surfaceRaised: '#22193D',
      surfaceBorder: '#362861',
      surfaceSubtle: '#4A3785',
      textPrimary: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      textDim: '#64748B',
      flame: '#F43F5E',
      flameSubtle: 'rgba(244, 63, 94, 0.16)',
      azure: '#38BDF8',
      azureSubtle: 'rgba(56, 189, 248, 0.15)',
      danger: '#EF4444',
      dangerBg: 'rgba(239, 68, 68, 0.16)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.16)',
      emerald: '#10B981',
      emeraldBg: 'rgba(16, 185, 129, 0.16)',
      volt: '#C084FC',
      voltHover: '#A855F7',
      voltDark: '#581C87',
      voltSubtle: 'rgba(192, 132, 252, 0.16)',
      voltGlow: 'rgba(192, 132, 252, 0.32)',
    },
    light: {
      id: 'amethyst',
      mode: 'light',
      name: 'Amethyst Void',
      tagline: 'Dark Twilight & Laser Lilac',
      accent: '#9333EA',
      accentHover: '#7E22CE',
      accentDark: '#6B21A8',
      accentSubtle: 'rgba(147, 51, 234, 0.12)',
      accentGlow: 'rgba(147, 51, 234, 0.22)',
      accentContrastText: '#FFFFFF',
      background: '#F9F6FC',
      surface: '#FFFFFF',
      surfaceRaised: '#F1EBF7',
      surfaceBorder: '#E0D4EC',
      surfaceSubtle: '#EADFF2',
      textPrimary: '#1F0E38',
      textSecondary: '#38205E',
      textMuted: '#694E91',
      textDim: '#987FBE',
      flame: '#E11D48',
      flameSubtle: 'rgba(225, 29, 72, 0.12)',
      azure: '#0284C7',
      azureSubtle: 'rgba(2, 132, 199, 0.12)',
      danger: '#DC2626',
      dangerBg: 'rgba(220, 38, 38, 0.12)',
      warning: '#D97706',
      warningBg: 'rgba(217, 119, 6, 0.12)',
      emerald: '#059669',
      emeraldBg: 'rgba(5, 150, 105, 0.12)',
      volt: '#9333EA',
      voltHover: '#7E22CE',
      voltDark: '#6B21A8',
      voltSubtle: 'rgba(147, 51, 234, 0.12)',
      voltGlow: 'rgba(147, 51, 234, 0.22)',
    },
  },
};

export function getThemeColors(themeId: ThemeId, mode: 'dark' | 'light'): ThemeColors {
  const bundle = THEME_PALETTES[themeId] || THEME_PALETTES.crimson;
  return bundle[mode] || bundle.dark;
}

// Global active Colors object (defaults to Hyper Crimson dark)
export const Colors: ThemeColors = { ...THEME_PALETTES.crimson.dark };

let activeThemeId: ThemeId = 'crimson';
let activeResolvedMode: 'dark' | 'light' = 'dark';

export function getActiveThemeId(): ThemeId {
  return activeThemeId;
}

export function getActiveResolvedMode(): 'dark' | 'light' {
  return activeResolvedMode;
}

export function setAppTheme(themeId: ThemeId, mode: 'dark' | 'light' = 'dark') {
  activeThemeId = themeId;
  activeResolvedMode = mode;
  const newColors = getThemeColors(themeId, mode);
  Object.assign(Colors, newColors);
}
