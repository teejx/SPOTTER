import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitness } from '../context/FitnessContext';

/**
 * Dynamically computes the required bottom padding for scrollable views
 * (ScrollView / FlatList) to ensure that the bottom-most elements are never
 * obscured by:
 * 1. The floating Bottom Navigation bar
 * 2. Android 3-Button Navigation bar (Back, Home, Recents)
 * 3. The floating Minimized Workout bar (when an active session is in progress)
 * 4. Gesture navigation pill bars
 */
export function useScreenBottomPadding(extraMargin: number = 24): number {
  const insets = useSafeAreaInsets();
  const { activeSession } = useFitness();

  const navBottomOffset = Math.max(insets.bottom + 8, 18);
  const navHeight = 58;
  const minimizedBarHeight = activeSession ? 72 : 0;

  return navBottomOffset + navHeight + minimizedBarHeight + extraMargin;
}
