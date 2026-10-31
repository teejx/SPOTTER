import { useRef } from 'react';
import { Animated } from 'react-native';

export interface ScreenLoadingOptions {
  isLoading: boolean;
  hasCachedData?: boolean;
  minDelayMs?: number;
  fadeDurationMs?: number;
}

/**
 * Intelligent Adaptive Loading State Controller.
 * 
 * Performance & UX Guarantees:
 * 1. ZERO BLOCKED RENDERS: If usable cached content is already in memory,
 *    showSkeleton is immediately false on frame 0.
 * 2. ZERO ARTIFICIAL DELAYS: Eliminates synthetic setTimeout / delay timers.
 * 3. NO SKELETON RE-ENTRY: Background refetching and sync NEVER replace usable content with skeletons.
 * 4. INSTANT RESOLUTION: Skeletons disappear immediately when data resolves.
 */
export function useScreenLoading({
  isLoading,
  hasCachedData = false,
}: ScreenLoadingOptions) {
  // If we already have cached data in state/memory, never display a skeleton over it
  const showSkeleton = isLoading && !hasCachedData;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  return {
    showSkeleton,
    contentOpacity,
  };
}
