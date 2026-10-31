import React, { useEffect, useRef, useContext, createContext, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  DimensionValue,
  AccessibilityInfo,
  Easing,
} from 'react-native';
import { useFitness } from '../context/FitnessContext';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// Global unified pulse clock for all skeletons on screen
// Ensures 1 single animation loop on the native thread instead of dozens of independent timers
const SkeletonPulseContext = createContext<Animated.Value | null>(null);

/**
 * Unified Pulse Provider: wraps skeleton layouts and provides a single, synchronized
 * 60 FPS hardware-accelerated pulse animation to all child skeleton blocks.
 */
export const SkeletonPulseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((reducedMotion) => {
      if (!isMounted) return;
      if (reducedMotion) {
        pulseAnim.setValue(0.6);
      } else {
        animLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 0.85,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0.35,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
        animLoop.start();
      }
    });

    return () => {
      isMounted = false;
      animLoop?.stop();
    };
  }, [pulseAnim]);

  return (
    <SkeletonPulseContext.Provider value={pulseAnim}>
      {children}
    </SkeletonPulseContext.Provider>
  );
};

/**
 * Base pulsing hardware-accelerated Skeleton block that matches SPOTTER's Claymorphic aesthetic.
 */
export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 14,
  style,
  children,
}) => {
  const { isDark } = useFitness();
  const contextPulse = useContext(SkeletonPulseContext);

  // Fallback local animation if used standalone without SkeletonPulseProvider
  const localPulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (contextPulse) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(localPulse, {
          toValue: 0.85,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(localPulse, {
          toValue: 0.35,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [contextPulse, localPulse]);

  const activeOpacity = contextPulse || localPulse;

  const baseBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const borderBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseBg,
          borderWidth: 1,
          borderColor: borderBg,
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
  style?: StyleProp<ViewStyle>;
}> = ({ width = '60%', height = 12, style }) => (
  <SkeletonBox width={width} height={height} borderRadius={height / 2} style={style} />
);

export const SkeletonCircle: React.FC<{
  size?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ size = 44, style }) => (
  <SkeletonBox width={size} height={size} borderRadius={size / 2} style={style} />
);

/**
 * High-fidelity Skeleton for the Log (Home) Screen
 */
export const LogScreenSkeleton: React.FC = () => {
  const { colors, isDark } = useFitness();

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
        {/* Athlete Greeting Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, padding: 18, marginBottom: 14 }]}>
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
        <SkeletonBox width="100%" height={74} borderRadius={26} style={{ marginBottom: 14 }} />

        {/* Walking & Steps Summary Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, padding: 18, marginBottom: 16 }]}>
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
          <SkeletonBox width={70} height={26} borderRadius={13} />
        </View>

        {/* 2 Routine Folder Cards */}
        {[1, 2].map((i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surface, padding: 16, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <SkeletonCircle size={36} />
              <SkeletonLine width={120} height={15} style={{ marginLeft: 12 }} />
            </View>
            <SkeletonLine width="90%" height={12} style={{ marginBottom: 6 }} />
            <SkeletonLine width="70%" height={12} />
          </View>
        ))}
      </View>
    </SkeletonPulseProvider>
  );
};

/**
 * High-fidelity Skeleton for the History Screen
 */
export const HistoryScreenSkeleton: React.FC = () => {
  const { colors } = useFitness();

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
        {/* Header Info */}
        <View style={{ gap: 6, marginBottom: 16 }}>
          <SkeletonLine width="45%" height={22} />
          <SkeletonLine width="65%" height={12} />
        </View>

        {/* Type Switch Tabs */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <SkeletonBox width="48%" height={44} borderRadius={22} />
          <SkeletonBox width="48%" height={44} borderRadius={22} />
        </View>

        {/* 2x2 Overview Bento */}
        <View style={styles.bentoGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.bentoTile, { backgroundColor: colors.surface }]}>
              <SkeletonCircle size={28} style={{ marginBottom: 8 }} />
              <SkeletonLine width="60%" height={18} style={{ marginBottom: 4 }} />
              <SkeletonLine width="40%" height={10} />
            </View>
          ))}
        </View>

        {/* Search Bar */}
        <SkeletonBox width="100%" height={46} borderRadius={23} style={{ marginBottom: 14 }} />

        {/* History Log Items */}
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surface, marginBottom: 12, padding: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <SkeletonCircle size={36} />
              <View style={{ marginLeft: 12, gap: 5, flex: 1 }}>
                <SkeletonLine width="60%" height={15} />
                <SkeletonLine width="40%" height={10} />
              </View>
              <SkeletonBox width={60} height={24} borderRadius={12} />
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <SkeletonBox width={60} height={20} borderRadius={6} />
              <SkeletonBox width={70} height={20} borderRadius={6} />
              <SkeletonBox width={50} height={20} borderRadius={6} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonPulseProvider>
  );
};

/**
 * High-fidelity Skeleton for the Routines Screen
 */
export const RoutinesScreenSkeleton: React.FC = () => {
  const { colors } = useFitness();

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
        {/* Segment Button Toggle (My Routines | Exercise Library) */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <SkeletonBox width="48%" height={42} borderRadius={21} />
          <SkeletonBox width="48%" height={42} borderRadius={21} />
        </View>

        {/* Split Pill Selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} width={74} height={32} borderRadius={16} />
          ))}
        </View>

        {/* Search & Actions Bar */}
        <SkeletonBox width="100%" height={46} borderRadius={23} style={{ marginBottom: 16 }} />

        {/* Routine Cards */}
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surface, padding: 18, marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ gap: 6, flex: 1 }}>
                <SkeletonLine width="60%" height={18} />
                <SkeletonLine width="40%" height={12} />
              </View>
              <SkeletonCircle size={30} />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <SkeletonBox width={64} height={22} borderRadius={8} />
              <SkeletonBox width={88} height={22} borderRadius={8} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonLine width={100} height={12} />
              <SkeletonBox width={96} height={34} borderRadius={17} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonPulseProvider>
  );
};

/**
 * High-fidelity Skeleton for the Metrics Screen
 */
export const MetricsScreenSkeleton: React.FC = () => {
  const { colors } = useFitness();

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
        {/* 1. Header Row (Greeting + Unit Toggle) */}
        <View style={styles.metricsHeaderRow}>
          <View style={{ gap: 6, flex: 1 }}>
            <SkeletonLine width="50%" height={22} />
            <SkeletonLine width="75%" height={12} />
          </View>
          <SkeletonBox width={88} height={34} borderRadius={17} />
        </View>

        {/* 2. Timeframe Filter Pills */}
        <View style={styles.timeframeRow}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} width="22%" height={36} borderRadius={20} />
          ))}
        </View>

        {/* 3. Hero Card with Progress Ring */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.heroCardHeader}>
            <SkeletonCircle size={32} />
            <SkeletonLine width={140} height={14} style={{ marginLeft: 10 }} />
            <SkeletonBox width={74} height={22} borderRadius={11} style={{ marginLeft: 'auto' }} />
          </View>

          <View style={styles.heroCenterRing}>
            <SkeletonCircle size={128} />
          </View>

          <View style={styles.heroFooter}>
            <SkeletonBox width="30%" height={24} borderRadius={12} />
            <SkeletonBox width="30%" height={24} borderRadius={12} />
            <SkeletonBox width="30%" height={24} borderRadius={12} />
          </View>
        </View>

        {/* 4. 2x2 Bento Tiles */}
        <View style={styles.bentoGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.bentoTile, { backgroundColor: colors.surface }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <SkeletonCircle size={32} />
                <SkeletonLine width={44} height={10} />
              </View>
              <SkeletonLine width="70%" height={20} style={{ marginBottom: 6 }} />
              <SkeletonLine width="50%" height={10} />
            </View>
          ))}
        </View>

        {/* 5. Chart Card Placeholder */}
        <View style={[styles.card, { backgroundColor: colors.surface, height: 160 }]}>
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
 * High-fidelity Skeleton for the Profile Screen
 */
export const ProfileScreenSkeleton: React.FC = () => {
  const { colors } = useFitness();

  return (
    <SkeletonPulseProvider>
      <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
        {/* Profile Info Header */}
        <View style={[styles.card, { backgroundColor: colors.surface, padding: 20, marginBottom: 16 }]}>
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
            <View key={i} style={[styles.bentoTile, { backgroundColor: colors.surface }]}>
              <SkeletonCircle size={30} style={{ marginBottom: 10 }} />
              <SkeletonLine width="65%" height={18} style={{ marginBottom: 5 }} />
              <SkeletonLine width="45%" height={11} />
            </View>
          ))}
        </View>

        {/* Personal Records Showcase Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, padding: 18 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SkeletonLine width={120} height={16} />
            <SkeletonBox width={60} height={24} borderRadius={12} />
          </View>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
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
  card: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  bentoTile: {
    width: '48%',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
