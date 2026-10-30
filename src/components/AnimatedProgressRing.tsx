import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text, Easing } from 'react-native';
import Svg, { Circle, Line, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface CircularProgressRingProps {
  size: number;
  strokeWidth?: number;
  progress: number; // 0 to 1+
  color?: string;
  trackColor?: string;
  gradientColors?: [string, string];
  showIndicatorDot?: boolean;
  children?: React.ReactNode;
}

/**
 * High-performance SVG-powered circular progress ring.
 * - Starts precisely at 12 o'clock (top center, -90deg) and fills clockwise.
 * - Distinct start notch at 12 o'clock so the user always knows where 0% begins.
 * - Glowing endpoint head dot indicating the exact current progress position.
 * - Perfectly synced with step goals (0% empty, 50% bottom, 100% full circle).
 */
export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  size = 136,
  strokeWidth = 10,
  progress = 0,
  color = '#FFFFFF',
  trackColor = 'rgba(255, 255, 255, 0.22)',
  gradientColors,
  showIndicatorDot = true,
  children,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const targetProgress = Math.max(0, progress);
    const anim = Animated.timing(animatedValue, {
      toValue: targetProgress,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    const listenerId = animatedValue.addListener(({ value }) => {
      setCurrentProgress(value);
    });

    anim.start();

    return () => {
      animatedValue.removeListener(listenerId);
      anim.stop();
    };
  }, [progress, animatedValue]);

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Clamped progress for the ring stroke (0 to 1)
  const clampedProgress = Math.min(Math.max(currentProgress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  // Calculate endpoint (head dot) coordinates
  // 12 o'clock is -90 degrees in standard polar coords
  const angleRad = (clampedProgress * 360 - 90) * (Math.PI / 180);
  const headX = center + radius * Math.cos(angleRad);
  const headY = center + radius * Math.sin(angleRad);

  const hasProgress = clampedProgress > 0.01;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          {gradientColors ? (
            <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          ) : null}
        </Defs>

        {/* 1. Full 360deg Background Reference Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* 2. Start Benchmark Marker (12 o'clock notch) */}
        <Line
          x1={center}
          y1={center - radius - strokeWidth / 2 - 1}
          x2={center}
          y2={center - radius + strokeWidth / 2 + 1}
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* 3. Active Progress Arc (starts at 12 o'clock, sweeps clockwise) */}
        {hasProgress && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={gradientColors ? 'url(#progressGrad)' : color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}

        {/* 4. Glowing Head Indicator Dot at current progress endpoint */}
        {showIndicatorDot && hasProgress && (
          <G>
            {/* Soft glow halo */}
            <Circle
              cx={headX}
              cy={headY}
              r={strokeWidth / 2 + 3}
              fill="rgba(255, 255, 255, 0.35)"
            />
            {/* Solid central head dot */}
            <Circle
              cx={headX}
              cy={headY}
              r={strokeWidth / 2 - 1}
              fill="#FFFFFF"
              stroke="rgba(0, 0, 0, 0.2)"
              strokeWidth={1}
            />
          </G>
        )}
      </Svg>

      {/* Center Metric Display */}
      {children && (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: strokeWidth + 4 }}>
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
