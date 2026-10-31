import React, { useEffect, useRef, useContext, createContext } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  DimensionValue,
  Easing,
} from 'react-native';
import { useFitness } from '../context/FitnessContext';
import { isReducedMotionSync } from '../theme/motion';
import { isFolderFullWidth, FOLDER_LAYOUT } from '../utils/folderLayout';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Facebook-Inspired Neutral Skeleton Color Palette
 * Completely flat, neutral gray placeholders with zero Claymorphism.
 */
export const SKELETON_COLORS = {
  light: {
    background: '#F0F2F5', // Neutral Facebook background
    surface: '#FFFFFF',    // Flat clean card container
    border: '#EBEDF0',     // Subtle flat structural boundary
    placeholder: '#EBEDF0', // Neutral light gray placeholder block
    highlight: '#F5F6F7',
  },
  dark: {
    background: '#18191A', // Neutral dark background
    surface: '#242526',    // Flat dark card container
    border: '#2E2F30',     // Subtle dark boundary
    placeholder: '#3A3B3C', // Neutral dark gray placeholder block
    highlight: '#4E4F50',
  },
} as const;

// Global unified pulse clock for all skeletons on screen
// Runs 1 single hardware-accelerated native loop at 60 FPS instead of dozens of independent timers
const SkeletonPulseContext = createContext<Animated.Value | null>(null);

/**
 * Unified Pulse Provider: wraps skeleton layouts and provides a single, synchronized
 * native hardware-accelerated opacity pulse animation to all child skeleton blocks.
 */
export const SkeletonPulseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isReduced = isReducedMotionSync();
  const pulseAnim = useRef(new Animated.Value(isReduced ? 0.75 : 0.55)).current;

  useEffect(() => {
    if (isReduced) {
      pulseAnim.setValue(0.75);
      return;
    }

    const animLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.55,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animLoop.start();
    return () => animLoop.stop();
  }, [pulseAnim, isReduced]);

  return (
    <SkeletonPulseContext.Provider value={pulseAnim}>
      {children}
    </SkeletonPulseContext.Provider>
  );
};

/**
 * Neutral Flat Facebook-Style Skeleton Placeholder Box
 * Strictly flat geometry, neutral gray fill, zero clay shadows or colorful borders.
 */
export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  children,
}) => {
  const { isDark } = useFitness();
  const contextPulse = useContext(SkeletonPulseContext);

  const localPulse = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    if (contextPulse) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(localPulse, {
          toValue: 0.95,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(localPulse, {
          toValue: 0.55,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [contextPulse, localPulse]);

  const activeOpacity = contextPulse || localPulse;
  const palette = isDark ? SKELETON_COLORS.dark : SKELETON_COLORS.light;

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: palette.placeholder,
          opacity: activeOpacity,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const SkeletonLine: React.FC<{
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ width = '60%', height = 12, borderRadius, style }) => (
  <SkeletonBox
    width={width}
    height={height}
    borderRadius={borderRadius ?? Math.min(height / 2, 6)}
    style={style}
  />
);

export const SkeletonCircle: React.FC<{
  size?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ size = 44, style }) => (
  <SkeletonBox width={size} height={size} borderRadius={size / 2} style={style} />
);

/**
 * CRITICAL: Adaptive Routine Folders Skeleton Grid
 * Accurately reproduces the exact layout rules of the real Workout Routine Folders:
 * - 2 folders share one row (48.4% width each, 10px gap).
 * - Odd orphan or single folder expands to 100% full width.
 * - Sizing, spacing, radius, and internal hierarchy match real folder cards 1:1.
 */
export const FolderGridSkeleton: React.FC<{ count?: number }> = ({ count = FOLDER_LAYOUT.defaultFallbackCount }) => {
  const { isDark } = useFitness();
  const palette = isDark ? SKELETON_COLORS.dark : SKELETON_COLORS.light;
  const effectiveCount = Math.max(1, count);
  const items = Array.from({ length: effectiveCount }, (_, i) => i);

  return (
    <View style={styles.folderGrid}>
      {items.map((index) => {
        const isFull = isFolderFullWidth(index, effectiveCount);
        return (
          <View
            key={`sk-folder-${index}`}
            style={[
              styles.folderCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                width: isFull ? FOLDER_LAYOUT.fullWidth : FOLDER_LAYOUT.halfWidth,
              },
            ]}
          >
            {/* Top Row: Icon Box + Count Badge Placeholder */}
            <View style={styles.folderCardTopRow}>
              <SkeletonBox width={34} height={34} borderRadius={10} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SkeletonBox width={22} height={20} borderRadius={10} />
                <SkeletonBox width={16} height={16} borderRadius={8} />
              </View>
            </View>

            {/* Title & Preview Lines */}
            <SkeletonLine width="65%" height={14} style={{ marginTop: 12 }} />
            <SkeletonLine width="85%" height={11} style={{ marginTop: 6 }} />

            {/* Footer "Tap to open" Line */}
            <View style={styles.folderCardFooter}>
              <SkeletonLine width={70} height={10} />
              <SkeletonBox width={12} height={12} borderRadius={6} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

/**
 * 1. Facebook-Style Neutral Skeleton for the Log (Home) Screen
 */
export const LogScreenSkeleton: React.FC<{ folderCount?: number }> = ({ folderCount }) => {
  const { isDark } = useFitness();
  const palette = isDark ? SKELETON_COLORS.dark : SKELETON_COLORS.light;

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: palette.background }]}>
        {/* Athlete Greeting Card */}
        <View style={[styles.flatCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <SkeletonCircle size={52} />
            <View style={{ marginLeft: 14, gap: 6, flex: 1 }}>
              <SkeletonLine width="65%" height={18} />
              <SkeletonLine width="45%" height={12} />
            </View>
            <SkeletonBox width={72} height={32} borderRadius={16} />
          </View>
        </View>

        {/* Start Empty Workout Card */}
        <SkeletonBox width="100%" height={74} borderRadius={24} style={{ marginBottom: 14 }} />

        {/* Walking & Steps Summary Card */}
        <View style={[styles.flatCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SkeletonCircle size={36} />
              <View style={{ gap: 4 }}>
                <SkeletonLine width={140} height={14} />
                <SkeletonLine width={90} height={10} />
              </View>
            </View>
            <SkeletonBox width={90} height={30} borderRadius={15} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <SkeletonLine width={44} height={16} />
                <SkeletonLine width={36} height={10} />
              </View>
            ))}
          </View>
        </View>

        {/* Routine Folders Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SkeletonLine width={140} height={16} />
          <SkeletonBox width={60} height={24} borderRadius={12} />
        </View>

        {/* Adaptive Routine Folders Bento Grid */}
        <FolderGridSkeleton count={folderCount} />
      </View>
    </SkeletonPulseProvider>
  );
};

/**
 * 2. Facebook-Style Neutral Skeleton for the History Screen
 */
export const HistoryScreenSkeleton: React.FC = () => {
  const { isDark } = useFitness();
  const palette = isDark ? SKELETON_COLORS.dark : SKELETON_COLORS.light;

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: palette.background }]}>
        {/* Header Info Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ gap: 6 }}>
            <SkeletonLine width={150} height={22} />
            <SkeletonLine width={110} height={12} />
          </View>
          <SkeletonBox width={76} height={32} borderRadius={16} />
        </View>

        {/* Type Switch Tabs */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <SkeletonBox width="48.5%" height={44} borderRadius={22} />
          <SkeletonBox width="48.5%" height={44} borderRadius={22} />
        </View>

        {/* 2x2 Overview Bento */}
        <View style={styles.bentoGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.bentoTile,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <SkeletonCircle size={28} style={{ marginBottom: 8 }} />
              <SkeletonLine width="60%" height={18} style={{ marginBottom: 4 }} />
              <SkeletonLine width="40%" height={10} />
            </View>
          ))}
        </View>

        {/* Search Bar */}
        <SkeletonBox width="100%" height={46} borderRadius={23} style={{ marginBottom: 12 }} />

        {/* Filter & Sort Pill */}
        <SkeletonBox width={120} height={32} borderRadius={16} style={{ marginBottom: 16 }} />

        {/* History Log Items */}
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.flatCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <SkeletonCircle size={36} />
              <View style={{ marginLeft: 12, gap: 5, flex: 1 }}>
                <SkeletonLine width="60%" height={15} />
                <SkeletonLine width="40%" height={10} />
              </View>
              <SkeletonBox width={20} height={20} borderRadius={10} />
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <SkeletonBox width={64} height={24} borderRadius={8} />
              <SkeletonBox width={76} height={24} borderRadius={8} />
              <SkeletonBox width={56} height={24} borderRadius={8} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonPulseProvider>
  );
};

/**
 * 3. Facebook-Style Neutral Skeleton for the Routines Screen
 */
export const RoutinesScreenSkeleton: React.FC = () => {
  const { isDark } = useFitness();
  const palette = isDark ? SKELETON_COLORS.dark : SKELETON_COLORS.light;

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: palette.background }]}>
        {/* Segment Toggle */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <SkeletonBox width="48.5%" height={42} borderRadius={21} />
          <SkeletonBox width="48.5%" height={42} borderRadius={21} />
        </View>

        {/* Split Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} width={76} height={32} borderRadius={16} />
          ))}
        </View>

        {/* Search Bar */}
        <SkeletonBox width="100%" height={46} borderRadius={23} style={{ marginBottom: 16 }} />

        {/* Routine Cards */}
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.flatCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ gap: 6, flex: 1 }}>
                <SkeletonLine width="60%" height={18} />
                <SkeletonLine width="40%" height={12} />
              </View>
              <SkeletonCircle size={28} />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <SkeletonBox width={64} height={22} borderRadius={8} />
              <SkeletonBox width={88} height={22} borderRadius={8} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonLine width={100} height={12} />
              <SkeletonBox width={104} height={34} borderRadius={17} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonPulseProvider>
  );
};

/**
 * 4. Facebook-Style Neutral Skeleton for the Metrics Screen
 */
export const MetricsScreenSkeleton: React.FC = () => {
  const { isDark } = useFitness();
  const palette = isDark ? SKELETON_COLORS.dark : SKELETON_COLORS.light;

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: palette.background }]}>
        {/* Header Row */}
        <View style={styles.metricsHeaderRow}>
          <View style={{ gap: 6, flex: 1 }}>
            <SkeletonLine width="50%" height={22} />
            <SkeletonLine width="75%" height={12} />
          </View>
          <SkeletonBox width={88} height={34} borderRadius={17} />
        </View>

        {/* Timeframe Pills */}
        <View style={styles.timeframeRow}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} width="22%" height={36} borderRadius={18} />
          ))}
        </View>

        {/* Hero Card with Progress Ring */}
        <View style={[styles.flatCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.heroCardHeader}>
            <SkeletonCircle size={32} />
            <SkeletonLine width={140} height={14} style={{ marginLeft: 10 }} />
            <SkeletonBox width={74} height={22} borderRadius={11} style={{ marginLeft: 'auto' }} />
          </View>

          <View style={styles.heroCenterRing}>
            <SkeletonCircle size={128} />
          </View>

          <View style={[styles.heroFooter, { borderTopColor: palette.border }]}>
            <SkeletonBox width="30%" height={24} borderRadius={12} />
            <SkeletonBox width="30%" height={24} borderRadius={12} />
            <SkeletonBox width="30%" height={24} borderRadius={12} />
          </View>
        </View>

        {/* 2x2 Bento Tiles */}
        <View style={styles.bentoGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.bentoTile,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <SkeletonCircle size={30} />
                <SkeletonLine width={44} height={10} />
              </View>
              <SkeletonLine width="70%" height={20} style={{ marginBottom: 6 }} />
              <SkeletonLine width="50%" height={10} />
            </View>
          ))}
        </View>

        {/* Chart Card Placeholder */}
        <View style={[styles.flatCard, { backgroundColor: palette.surface, borderColor: palette.border, height: 160 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <SkeletonLine width={110} height={14} />
            <SkeletonBox width={64} height={20} borderRadius={10} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1, alignItems: 'flex-end', paddingBottom: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
              <View key={bar} style={{ alignItems: 'center', gap: 8 }}>
                <SkeletonBox width={14} height={40 + (bar % 3) * 20} borderRadius={7} />
                <SkeletonLine width={16} height={8} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </SkeletonPulseProvider>
  );
};

/**
 * 5. Facebook-Style Neutral Skeleton for the Profile Screen
 */
export const ProfileScreenSkeleton: React.FC = () => {
  const { isDark } = useFitness();
  const palette = isDark ? SKELETON_COLORS.dark : SKELETON_COLORS.light;

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: palette.background }]}>
        {/* Profile Info Header Card */}
        <View style={[styles.flatCard, { backgroundColor: palette.surface, borderColor: palette.border, padding: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <SkeletonCircle size={64} />
            <View style={{ marginLeft: 16, gap: 6, flex: 1 }}>
              <SkeletonLine width="60%" height={20} />
              <SkeletonLine width="40%" height={13} />
            </View>
            <SkeletonBox width={36} height={36} borderRadius={18} />
          </View>

          {/* Level Progress Bar */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <SkeletonLine width={70} height={12} />
              <SkeletonLine width={50} height={12} />
            </View>
            <SkeletonBox width="100%" height={10} borderRadius={5} />
          </View>
        </View>

        {/* 2x2 Lifetime Stats Bento */}
        <View style={styles.bentoGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.bentoTile,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <SkeletonCircle size={30} style={{ marginBottom: 10 }} />
              <SkeletonLine width="65%" height={18} style={{ marginBottom: 5 }} />
              <SkeletonLine width="45%" height={11} />
            </View>
          ))}
        </View>

        {/* Personal Records Showcase Card */}
        <View style={[styles.flatCard, { backgroundColor: palette.surface, borderColor: palette.border, padding: 18 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SkeletonLine width={120} height={16} />
            <SkeletonBox width={60} height={24} borderRadius={12} />
          </View>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: i < 3 ? 1 : 0,
                borderBottomColor: palette.border,
              }}
            >
              <View style={{ gap: 4 }}>
                <SkeletonLine width={110} height={14} />
                <SkeletonLine width={70} height={10} />
              </View>
              <SkeletonBox width={54} height={22} borderRadius={6} />
            </View>
          ))}
        </View>
      </View>
    </SkeletonPulseProvider>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  metricsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  flatCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCenterRing: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  bentoTile: {
    width: '48.4%',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: FOLDER_LAYOUT.gridGap,
    marginBottom: 16,
  },
  folderCard: {
    borderRadius: FOLDER_LAYOUT.cardRadius,
    padding: 16,
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  folderCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  folderCardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
