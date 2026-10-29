import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, StyleSheet, Animated, Text, Easing } from 'react-native';

interface CircularProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
}

/**
 * High-performance pure React Native animated circular progress ring.
 * Uses two half-circle rotation transforms for 0-360 deg smooth filling.
 */
export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  size,
  strokeWidth,
  progress,
  color,
  trackColor = 'rgba(255, 255, 255, 0.20)',
  children,
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, animatedProgress]);

  // First half: 0 -> 180 deg (progress 0 -> 0.5)
  const firstHalfRotation = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
  });

  // Second half: 180 -> 360 deg (progress 0.5 -> 1)
  const secondHalfRotation = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
  });

  const halfSize = size / 2;
  const isZero = progress <= 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background Track Ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: halfSize,
          borderWidth: strokeWidth,
          borderColor: trackColor,
          position: 'absolute',
        }}
      />

      {/* First Half Ring (0-180deg) */}
      {!isZero && (
        <View
          style={{
            width: size,
            height: size,
            position: 'absolute',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: color,
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              transform: [{ rotate: firstHalfRotation }],
            }}
          />
        </View>
      )}

      {/* Second Half Ring (180-360deg) */}
      {!isZero && progress > 0.5 && (
        <View
          style={{
            width: size,
            height: size,
            position: 'absolute',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              transform: [{ rotate: secondHalfRotation }],
            }}
          />
        </View>
      )}

      {/* Center Content */}
      {children && (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </View>
      )}
    </View>
  );
};

interface SpeedometerArcGaugeProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  activeColor?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

/**
 * Semi-circular arched speedometer gauge directly modeled after
 * the "Goal Achieved! / 7,235 Steps / 1,000 Steps" mockups.
 * Completely empty when progress = 0.
 */
export const SpeedometerArcGauge: React.FC<SpeedometerArcGaugeProps> = ({
  progress,
  size = 180,
  strokeWidth = 14,
  activeColor = '#00D084',
  trackColor = 'rgba(0, 208, 132, 0.15)',
  children,
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clamped = Math.min(Math.max(progress, 0), 1);
    const listenerId = animatedProgress.addListener(({ value }) => {
      setCurrentProgress(value);
    });

    Animated.spring(animatedProgress, {
      toValue: clamped,
      damping: 20,
      mass: 0.8,
      stiffness: 140,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedProgress.removeListener(listenerId);
    };
  }, [progress, animatedProgress]);

  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // 44 overlapping smooth circular segments along the 180deg arch
  const TOTAL_SEGMENTS = 44;
  const activeCount = Math.round(currentProgress * TOTAL_SEGMENTS);

  // Generate overlapping positions along 180deg semi-circle (from 180deg / left to 0deg / right)
  const segments = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const angle = Math.PI - (i / (TOTAL_SEGMENTS - 1)) * Math.PI;
      const x = centerX + radius * Math.cos(angle) - strokeWidth / 2;
      const y = centerY - radius * Math.sin(angle) - strokeWidth / 2;
      list.push({ x, y });
    }
    return list;
  }, [size, strokeWidth, radius, centerX, centerY]);

  return (
    <View style={{ width: size, height: size * 0.60, alignItems: 'center' }}>
      {/* Outer Semi-Circle Arch Track */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: trackColor,
          borderBottomColor: 'transparent',
          position: 'absolute',
          top: 0,
        }}
      />

      {/* Dynamic Active Progress Overlapping Dots - completely empty when progress === 0 */}
      {activeCount > 0 &&
        segments.slice(0, activeCount).map((pt, idx) => (
          <View
            key={idx}
            style={{
              position: 'absolute',
              left: pt.x,
              top: pt.y,
              width: strokeWidth,
              height: strokeWidth,
              borderRadius: strokeWidth / 2,
              backgroundColor: activeColor,
            }}
          />
        ))}

      {/* Center Content Slot - Placed comfortably so "Steps Today" is never clipped */}
      <View
        style={{
          position: 'absolute',
          top: 14,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {children}
      </View>
    </View>
  );
};

/**
 * Audio / Equalizer Rhythm Bars component for Exercise Intensity.
 */
export const EqualizerRhythmBars: React.FC<{
  color?: string;
  active?: boolean;
}> = ({ color = '#00C1F6', active = true }) => {
  const bar1 = useRef(new Animated.Value(12)).current;
  const bar2 = useRef(new Animated.Value(24)).current;
  const bar3 = useRef(new Animated.Value(16)).current;
  const bar4 = useRef(new Animated.Value(28)).current;
  const bar5 = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (!active) return;
    const animateBar = (val: Animated.Value, min: number, max: number, dur: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: max,
            duration: dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(val, {
            toValue: min,
            duration: dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    animateBar(bar1, 8, 22, 500);
    animateBar(bar2, 14, 28, 620);
    animateBar(bar3, 10, 24, 450);
    animateBar(bar4, 16, 30, 580);
    animateBar(bar5, 6, 20, 480);
  }, [active, bar1, bar2, bar3, bar4, bar5]);

  return (
    <View style={styles.equalizerRow}>
      {[bar1, bar2, bar3, bar4, bar5].map((b, i) => (
        <Animated.View
          key={i}
          style={[
            styles.equalizerBar,
            {
              backgroundColor: color,
              height: b,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 32,
  },
  equalizerBar: {
    width: 4,
    borderRadius: 2,
  },
});
