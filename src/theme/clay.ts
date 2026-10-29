import { ViewStyle, TextStyle } from 'react-native';
import { ThemeColors } from './colors';

/**
 * SPOTTER Tactile Clay Kinetic Design System
 * Strictly calibrated to .gemini/design.md and .gemini/design dark.md
 * 
 * Physics:
 * - Level 0: Pale Porcelain Clay (#F9F9FF) / Deep Obsidian Canvas (#081425)
 * - Level 1: Inflated Clay Tiles (#FFFFFF / #152031) with specular rim catch-lights
 * - Level 2: Interactive Squish Kinetic Lime (#84CC16) & Electric Cobalt (#3B82F6 / #2170E4)
 * - Level 3: Sunken Inset Wells (#E7EEFF / #040E1F)
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
    borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)';
  } else if (isDark) {
    switch (variant) {
      case 'recessed':
        baseBg = '#101326';
        borderColor = 'rgba(255, 255, 255, 0.05)';
        break;
      case 'accent':
        // Electric Violet tinted dark clay
        baseBg = '#191538';
        borderColor = 'rgba(122, 111, 240, 0.35)';
        break;
      case 'warm':
        // Sunset Coral tinted dark clay
        baseBg = '#261510';
        borderColor = 'rgba(251, 146, 60, 0.35)';
        break;
      default:
        // Level 1 Inflated Dark Clay Tile (surface-container)
        baseBg = '#161B30';
        borderColor = 'rgba(255, 255, 255, 0.08)';
        break;
    }
  } else {
    switch (variant) {
      case 'recessed':
        baseBg = '#F0F2FA';
        borderColor = 'rgba(17, 28, 45, 0.08)';
        break;
      case 'accent':
        // Electric Violet tinted light clay
        baseBg = '#EEECFA';
        borderColor = 'rgba(99, 85, 230, 0.30)';
        break;
      case 'warm':
        // Sunset Coral tinted light clay
        baseBg = '#FFF2EB';
        borderColor = 'rgba(255, 122, 61, 0.30)';
        break;
      default:
        // Level 1 Inflated Pale Porcelain Clay Tile
        baseBg = '#FFFFFF';
        borderColor = 'rgba(255, 255, 255, 0.95)';
        break;
    }
  }

  const shadowOpacity = isDark
    ? level === 'floating' ? 0.65 : level === 'high' ? 0.50 : 0.40
    : level === 'floating' ? 0.16 : level === 'high' ? 0.12 : 0.08;

  const shadowRadius = level === 'floating' ? 24 : level === 'high' ? 18 : 12;
  const shadowHeight = level === 'floating' ? 12 : level === 'high' ? 8 : 6;
  const elevation = level === 'floating' ? 14 : level === 'high' ? 8 : 4;

  return {
    backgroundColor: baseBg,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor,
    shadowColor: isDark ? '#000000' : '#111C2D',
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
      borderColor: 'rgba(255, 255, 255, 0.50)',
      shadowColor: bg,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.36,
      shadowRadius: 14,
      elevation: 6,
    };
  }

  const colors = arg1;
  const isDark = typeof arg2 === 'boolean' ? arg2 : true;
  const active = typeof arg3 === 'boolean' ? arg3 : false;
  const variant = arg4 ?? 'default';

  // Default secondary / ghost clay pill
  let bg = isDark ? '#1F2A3C' : '#E7EEFF';
  let border = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)';
  let shadow = isDark ? '#000000' : '#111C2D';

  if (active || variant !== 'default') {
    switch (variant) {
      case 'accent':
        // Electric Cobalt secondary from design.md
        bg = isDark ? '#0566D9' : '#2170E4';
        border = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.60)';
        shadow = '#2170E4';
        break;
      case 'success':
        // Kinetic Lime primary active state
        bg = '#84CC16';
        border = isDark ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.60)';
        shadow = '#84CC16';
        break;
      case 'warning':
        bg = isDark ? '#332210' : '#FEF3C7';
        border = isDark ? 'rgba(251, 191, 36, 0.50)' : 'rgba(245, 158, 11, 0.35)';
        shadow = '#F59E0B';
        break;
      case 'danger':
        // Punch Coral tertiary max-effort / alert from design.md
        bg = '#F43F5E';
        border = isDark ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.60)';
        shadow = '#F43F5E';
        break;
      default:
        // Primary Kinetic Button
        bg = colors.accent || '#84CC16';
        border = isDark ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.60)';
        shadow = colors.accent || '#84CC16';
        break;
    }
  }

  return {
    backgroundColor: bg,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: border,
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.35 : 0.16,
    shadowRadius: 10,
    elevation: 4,
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
    // Level 3 sunken inset well cavity from design.md & design dark.md
    const bg = typeof arg2 === 'string' ? arg2 : (isDark ? '#040E1F' : '#E7EEFF');
    const radius = typeof arg3 === 'number' ? arg3 : 18;
    return {
      backgroundColor: bg,
      borderRadius: radius,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(17, 28, 45, 0.08)',
      shadowColor: isDark ? '#000000' : '#111C2D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: 4,
      elevation: 1,
    };
  }

  const colors = arg1;
  const isDark = typeof arg2 === 'boolean' ? arg2 : true;
  const focused = typeof arg3 === 'boolean' ? arg3 : false;

  return {
    backgroundColor: isDark ? '#040E1F' : '#E7EEFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: focused
      ? (colors.accent || '#84CC16')
      : isDark
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(17, 28, 45, 0.08)',
    shadowColor: isDark ? '#000000' : '#111C2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.35 : 0.06,
    shadowRadius: 4,
    elevation: 1,
  };
}
