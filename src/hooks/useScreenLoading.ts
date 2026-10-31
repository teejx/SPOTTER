import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface ScreenLoadingOptions {
  isLoading: boolean;
  minDelayMs?: number;
  fadeDurationMs?: number;
}

/**
 * High-performance hook for seamless skeleton transitions.
 * - Prevents skeleton flashing when data is cached or resolves in < 50ms.
 * - Smoothly crossfades loaded content in using native hardware acceleration.
 * - Completely stops rendering skeleton once content is fully visible.
 */
export function useScreenLoading({
  isLoading,
  minDelayMs = 50,
  fadeDurationMs = 180,
}: ScreenLoadingOptions) {
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const contentOpacity = useRef(new Animated.Value(isLoading ? 0 : 1)).current;

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    if (isLoading) {
      // Delay showing skeleton slightly to prevent flicker if data is already cached in memory/AsyncStorage
      delayTimer = setTimeout(() => {
        setShowSkeleton(true);
        contentOpacity.setValue(0);
      }, minDelayMs);
    } else {
      if (delayTimer) {
        clearTimeout(delayTimer);
      }
      if (showSkeleton) {
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: fadeDurationMs,
          useNativeDriver: true,
        }).start(() => {
          setShowSkeleton(false);
        });
      } else {
        contentOpacity.setValue(1);
        setShowSkeleton(false);
      }
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [isLoading, minDelayMs, fadeDurationMs, showSkeleton, contentOpacity]);

  return {
    showSkeleton,
    contentOpacity,
  };
}
