import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { useFitness } from '../context/FitnessContext';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

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
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  const baseBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const borderBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)';

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
          opacity: opacityAnim,
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
 * High-fidelity Skeleton for the Metrics Screen
 */
export const MetricsScreenSkeleton: React.FC = () => {
  const { colors, isDark } = useFitness();

  return (
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

      {/* 3. Hero Walk & Activity Card */}
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

      {/* 4. 2x2 Bento Grid */}
      <View style={styles.bentoGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.bentoTile, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <SkeletonCircle size={32} />
              <SkeletonLine width={44} height={10} />
            </View>
            <SkeletonLine width="70%" height={20} style={{ marginBottom: 6 }} />
            <SkeletonLine width="50%" height={10} />
          </View>
        ))}
      </View>

      {/* 5. 7-Day Histogram Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, height: 190 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
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
  );
};

/**
 * High-fidelity Skeleton for the History Screen
 */
export const HistoryScreenSkeleton: React.FC = () => {
  const { colors } = useFitness();

  return (
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
  );
};

/**
 * High-fidelity Skeleton for the Log Screen
 */
export const LogScreenSkeleton: React.FC = () => {
  const { colors } = useFitness();

  return (
    <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
      {/* Athlete Header Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, padding: 18, marginBottom: 14 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SkeletonCircle size={52} />
          <View style={{ marginLeft: 14, gap: 6, flex: 1 }}>
            <SkeletonLine width="65%" height={18} />
            <SkeletonLine width="45%" height={12} />
          </View>
        </View>
      </View>

      {/* Start Empty Workout Card */}
      <SkeletonBox width="100%" height={74} borderRadius={26} style={{ marginBottom: 14 }} />

      {/* Recent Walk Card */}
      <SkeletonBox width="100%" height={88} borderRadius={26} style={{ marginBottom: 16 }} />

      {/* Routines Folders Header */}
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
