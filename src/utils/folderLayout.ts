import { DimensionValue } from 'react-native';

/**
 * SPOTTER Workout Routine Folder Layout System
 * 
 * Single source of truth for folder placement and responsive geometry.
 * Consumed by BOTH real folder components and skeleton loading placeholders
 * to guarantee 100% layout consistency with zero layout shift.
 * 
 * Rules:
 * - Two folders normally share one row (48.4% width each, 10px row/column gap).
 * - If only one folder occupies a row, it expands to 100% full width.
 * - 1 folder: 1 full-width card.
 * - 2 folders: 2 half-width cards.
 * - 3 folders: 2 half-width cards on row 1, 1 full-width card on row 2.
 * - 4 folders: 2 half-width cards on row 1, 2 half-width cards on row 2.
 * - 5 folders: 2 half-width cards on row 1, 2 half-width cards on row 2, 1 full-width card on row 3.
 * - N folders: Any odd orphan at index === N - 1 expands to 100% full width.
 */

export const FOLDER_LAYOUT = {
  halfWidth: '48.4%' as DimensionValue,
  fullWidth: '100%' as DimensionValue,
  gridGap: 10,
  cardRadius: 22,
  defaultFallbackCount: 3,
} as const;

/**
 * Determines whether a folder at a given index occupies full width.
 */
export function isFolderFullWidth(index: number, totalCount: number): boolean {
  if (totalCount <= 0) return true;
  if (totalCount === 1) return true;
  // If odd number of folders, the last folder expands to full width
  return totalCount % 2 === 1 && index === totalCount - 1;
}

/**
 * Returns the exact width percentage for a folder at a given index.
 */
export function getFolderWidth(index: number, totalCount: number): DimensionValue {
  return isFolderFullWidth(index, totalCount) ? FOLDER_LAYOUT.fullWidth : FOLDER_LAYOUT.halfWidth;
}
