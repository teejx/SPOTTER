import { ViewStyle, TextStyle } from 'react-native';
import { ThemeColors } from './colors';

/**
 * SPOTTER Claymorphic Design System
 * Engineered for tactile 3D depth, squishy volumetric surfaces,
 * double-bezel concentric curves, and optical top-lighting.
 */

export interface ClayShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export function getClayCardStyle(
  isDark: boolean,
  baseBg?: string,
  radius?: number
): ViewStyle;
export function getClayCardStyle(
  colors: ThemeColors,
  isDark: boolean,
  options?: {
    variant?: 'convex' | 'flat' | 'recessed' | 'accent' | 'warm';
    radius?: number;
    elevationLevel?: 'low' | 'medium' | 'high' | 'floating';
  }
): ViewStyle;
export function getClayCardStyle(
  arg1: boolean | ThemeColors,
  arg2?: string | boolean,
  arg3?: number | {
    variant?: 'convex' | 'flat' | 'recessed' | 'accent' | 'warm';
    radius?: number;
    elevationLevel?: 'low' | 'medium' | 'high' | 'floating';
  }
): ViewStyle {
  let isDark: boolean;
  let baseBg: string | undefined;
  let radius: number = 24;
  let variant: 'convex' | 'flat' | 'recessed' | 'accent' | 'warm' = 'convex';
  let level: 'low' | 'medium' | 'high' | 'floating' = 'medium';

  if (typeof arg1 === 'boolean') {
    isDark = arg1;
    baseBg = typeof arg2 === 'string' ? arg2 : undefined;
    if (typeof arg3 === 'number') {
      radius = arg3;
    }
  } else {
    isDark = typeof arg2 === 'boolean' ? arg2 : true;
    if (typeof arg3 === 'object' && arg3 !== null) {
      radius = arg3.radius ?? 24;
      variant = arg3.variant ?? 'convex';
      level = arg3.elevationLevel ?? 'medium';
    }
  }

  let borderColor: string;

  if (baseBg) {
    borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.95)';
  } else if (isDark) {
    switch (variant) {
      case 'recessed':
        baseBg = '#0E1017';
        borderColor = 'rgba(255, 255, 255, 0.05)';
        break;
      case 'accent':
        baseBg = '#1E172E';
        borderColor = 'rgba(192, 132, 252, 0.35)';
        break;
      case 'warm':
        baseBg = '#221910';
        borderColor = 'rgba(251, 146, 60, 0.35)';
        break;
      default:
        baseBg = '#171922';
        borderColor = 'rgba(255, 255, 255, 0.12)';
        break;
    }
  } else {
    switch (variant) {
      case 'recessed':
        baseBg = '#EEF2F6';
        borderColor = 'rgba(0, 0, 0, 0.05)';
        break;
      case 'accent':
        baseBg = '#F3EEFF';
        borderColor = 'rgba(124, 58, 237, 0.25)';
        break;
      case 'warm':
        baseBg = '#FFF7ED';
        borderColor = 'rgba(234, 88, 12, 0.25)';
        break;
      default:
        baseBg = '#FFFFFF';
        borderColor = 'rgba(255, 255, 255, 0.95)';
        break;
    }
  }

  const shadowOpacity = isDark
    ? level === 'floating' ? 0.65 : level === 'high' ? 0.5 : 0.35
    : level === 'floating' ? 0.22 : level === 'high' ? 0.16 : 0.10;

  const shadowRadius = level === 'floating' ? 24 : level === 'high' ? 16 : 10;
  const shadowHeight = level === 'floating' ? 12 : level === 'high' ? 8 : 4;
  const elevation = level === 'floating' ? 14 : level === 'high' ? 8 : 4;

  return {
    backgroundColor: baseBg,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor,
    shadowColor: isDark ? '#000000' : '#475569',
    shadowOffset: { width: 0, height: shadowHeight },
    shadowOpacity,
    shadowRadius,
    elevation,
  };
}

export function getClayPillStyle(
  colorOrBg: string,
  radius?: number
): ViewStyle;
export function getClayPillStyle(
  colors: ThemeColors,
  isDark: boolean,
  active?: boolean,
  variant?: 'default' | 'accent' | 'warning' | 'success' | 'danger'
): ViewStyle;
export function getClayPillStyle(
  arg1: string | ThemeColors,
  arg2?: number | boolean,
  arg3?: boolean,
  arg4?: 'default' | 'accent' | 'warning' | 'success' | 'danger'
): ViewStyle {
  if (typeof arg1 === 'string') {
    const bg = arg1;
    const radius = typeof arg2 === 'number' ? arg2 : 9999;
    return {
      backgroundColor: bg,
      borderRadius: radius,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.32)',
      shadowColor: bg,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.38,
      shadowRadius: 8,
      elevation: 5,
    };
  }

  const colors = arg1;
  const isDark = typeof arg2 === 'boolean' ? arg2 : true;
  const active = typeof arg3 === 'boolean' ? arg3 : false;
  const variant = arg4 ?? 'default';

  let bg = isDark ? '#202330' : '#F1F5F9';
  let border = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.9)';
  let shadow = isDark ? '#000000' : '#64748B';

  if (active || variant !== 'default') {
    switch (variant) {
      case 'accent':
        bg = isDark ? '#32224D' : '#EDE9FE';
        border = isDark ? 'rgba(192, 132, 252, 0.5)' : 'rgba(147, 51, 234, 0.35)';
        shadow = colors.accent || '#8B5CF6';
        break;
      case 'success':
        bg = isDark ? '#142C20' : '#DCFCE7';
        border = isDark ? 'rgba(52, 211, 153, 0.5)' : 'rgba(16, 185, 129, 0.35)';
        shadow = '#10B981';
        break;
      case 'warning':
        bg = isDark ? '#332210' : '#FEF3C7';
        border = isDark ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.35)';
        shadow = '#F59E0B';
        break;
      case 'danger':
        bg = isDark ? '#331518' : '#FEE2E2';
        border = isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.35)';
        shadow = '#EF4444';
        break;
      default:
        bg = colors.accent;
        border = isDark ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF';
        shadow = colors.accent;
        break;
    }
  }

  return {
    backgroundColor: bg,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: border,
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.4 : 0.15,
    shadowRadius: 6,
    elevation: 3,
  };
}

export function getClayInputStyle(
  isDark: boolean,
  bg?: string,
  radius?: number
): ViewStyle;
export function getClayInputStyle(
  colors: ThemeColors,
  isDark: boolean,
  focused?: boolean
): ViewStyle;
export function getClayInputStyle(
  arg1: boolean | ThemeColors,
  arg2?: string | boolean,
  arg3?: number | boolean
): ViewStyle {
  if (typeof arg1 === 'boolean') {
    const isDark = arg1;
    const bg = typeof arg2 === 'string' ? arg2 : (isDark ? '#10121A' : '#F8FAFC');
    const radius = typeof arg3 === 'number' ? arg3 : 16;
    return {
      backgroundColor: bg,
      borderRadius: radius,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: isDark ? '#000000' : '#CBD5E1',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    };
  }

  const colors = arg1;
  const isDark = typeof arg2 === 'boolean' ? arg2 : true;
  const focused = typeof arg3 === 'boolean' ? arg3 : false;

  return {
    backgroundColor: isDark ? '#10121A' : '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: focused
      ? colors.accent
      : isDark
      ? 'rgba(255, 255, 255, 0.10)'
      : 'rgba(0, 0, 0, 0.08)',
    shadowColor: isDark ? '#000000' : '#CBD5E1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 4,
    elevation: 2,
  };
}
