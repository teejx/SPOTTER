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
