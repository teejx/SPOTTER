import { Easing, Animated, AccessibilityInfo } from 'react-native';

/**
 * SPOTTER Kinetic Clay Motion System
 * 
 * Calibrated for physical depth, tactile interactions, soft elasticity,
 * and high-performance 60 FPS hardware-accelerated animations.
 */

// 1. Duration Presets (ms)
export const MOTION_DURATIONS = {
  micro: 120,       // Toggles, icons, micro-ticks
  fast: 180,        // Button presses, badge reveals
  standard: 240,    // Card expansions, tab switches
  emphasized: 340,  // Modal appearances, hero cards
  deliberate: 460,  // Full-screen entrances, complex charts
} as const;

// 2. Spring Physics Configurations
// Friction (damping) & Tension (stiffness) tuned for soft clay elasticity
export const MOTION_SPRINGS = {
  // Instant tactile squeeze on finger-down
  tactilePress: {
    friction: 7,
    tension: 240,
    useNativeDriver: true,
  },
  // Snappy yet cushioned release on finger-up
  tactileRelease: {
    friction: 6,
    tension: 160,
    useNativeDriver: true,
  },
  // Soft, clay-like squish & rebound for cards and tiles
  claySquish: {
    friction: 8,
    tension: 180,
    useNativeDriver: true,
  },
  // Smooth resting settling for screen cards, dialogs, and overlays
  gentleSettle: {
    friction: 8.5,
    tension: 110,
    useNativeDriver: true,
  },
  // Subtle energetic pop for badges, PR trophies, and checkboxes
  bouncyPop: {
    friction: 5,
    tension: 150,
    useNativeDriver: true,
  },
  // Bottom sheet drag-settle spring
  sheetSlide: {
    friction: 9,
    tension: 125,
    useNativeDriver: true,
  },
} as const;

// 3. Tactile Press Scales (Depth compression)
export const MOTION_PRESS_SCALES = {
  button: 0.96,     // Primary & secondary action buttons
  card: 0.982,      // Routine cards, workout cards
  tile: 0.97,       // 2x2 Bento grid tiles
  icon: 0.90,       // Floating action & icon hit-targets
  chip: 0.94,       // Filter pills & timeframe selectors
  tab: 0.92,        // Bottom navigation tabs
} as const;

// 4. Easing Curves
export const MOTION_EASINGS = {
  // Elements entering the screen: enters fast, gently decelerates
  decelerate: Easing.out(Easing.cubic),
  // Elements exiting the screen: accelerates offscreen
  accelerate: Easing.in(Easing.cubic),
  // Natural bidirectional transitions
  softEase: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  // Clay elastic overshoot curve for badges and trophies
  clayElastic: Easing.bezier(0.175, 0.885, 0.32, 1.15),
} as const;

// 5. Stagger Intervals
export const MOTION_STAGGER = {
  itemDelay: 35,    // Stagger delay between sequential items (ms)
  headerDelay: 50,  // Stagger delay for top hero cards (ms)
  maxItems: 7,      // Cap stagger count so list tails don't lag
} as const;

// 6. Accessibility Helper
let isReducedMotionCached = false;
let isReducedMotionChecked = false;

export async function isReducedMotion(): Promise<boolean> {
  if (isReducedMotionChecked) return isReducedMotionCached;
  try {
    isReducedMotionCached = await AccessibilityInfo.isReduceMotionEnabled();
    isReducedMotionChecked = true;
    return isReducedMotionCached;
  } catch {
    return false;
  }
}

AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
  isReducedMotionCached = enabled;
});
