import React, { useRef, useEffect } from 'react';
import {
  Animated,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  MOTION_DURATIONS,
  MOTION_SPRINGS,
  MOTION_PRESS_SCALES,
  MOTION_EASINGS,
  MOTION_STAGGER,
  isReducedMotionSync,
} from '../theme/motion';

export interface ClayPressableProps {
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  variant?: 'button' | 'card' | 'tile' | 'icon' | 'chip' | 'tab';
  scaleTo?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
  disabled?: boolean;
  activeOpacity?: number;
  accessibilityLabel?: string;
  testID?: string;
  children?: React.ReactNode;
}

/**
 * ClayPressable: Hardware-accelerated tactile pressable component.
 * Provides micro-scale compression and spring release.
 */
export const ClayPressable: React.FC<ClayPressableProps> = ({
  onPress,
  onLongPress,
  style,
  containerStyle,
  variant = 'button',
  scaleTo,
  haptic = 'light',
  disabled = false,
  activeOpacity = 0.95,
  accessibilityLabel,
  testID,
  children,
}) => {
  const targetScale = scaleTo ?? MOTION_PRESS_SCALES[variant] ?? 0.96;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;

    if (haptic !== 'none') {
      if (haptic === 'selection') {
        Haptics.selectionAsync().catch(() => {});
      } else if (haptic === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } else if (haptic === 'heavy') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }

    Animated.spring(scaleAnim, {
      toValue: targetScale,
      friction: MOTION_SPRINGS.tactilePress.friction,
      tension: MOTION_SPRINGS.tactilePress.tension,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: MOTION_SPRINGS.tactileRelease.friction,
      tension: MOTION_SPRINGS.tactileRelease.tension,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={activeOpacity}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={containerStyle}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export interface AnimatedEntranceProps {
  index?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';
  distance?: number;
  duration?: number;
  spring?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * AnimatedEntrance: Staggered, hardware-accelerated entrance container.
 * Synchronous initialization prevents invisible flash or blank-screen delays.
 */
export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({
  index = 0,
  delay = 0,
  direction = 'up',
  distance = 12,
  duration = 180,
  spring = true,
  style,
  children,
}) => {
  const isReduced = isReducedMotionSync();
  const opacityAnim = useRef(new Animated.Value(isReduced || direction === 'none' ? 1 : 0)).current;
  const translateAnim = useRef(new Animated.Value(isReduced || direction === 'none' ? 0 : distance)).current;
  const scaleAnim = useRef(new Animated.Value(isReduced || direction !== 'scale' ? 1 : 0.96)).current;

  useEffect(() => {
    if (isReduced || direction === 'none') {
      opacityAnim.setValue(1);
      translateAnim.setValue(0);
      scaleAnim.setValue(1);
      return;
    }

    const effectiveIndex = Math.min(index, MOTION_STAGGER.maxItems);
    const startDelay = effectiveIndex * MOTION_STAGGER.itemDelay + delay;

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: duration,
        delay: startDelay,
        easing: MOTION_EASINGS.decelerate,
        useNativeDriver: true,
      }),
    ];

    if (direction !== 'scale') {
      if (spring) {
        animations.push(
          Animated.sequence([
            Animated.delay(startDelay),
            Animated.spring(translateAnim, {
              toValue: 0,
              friction: MOTION_SPRINGS.gentleSettle.friction,
              tension: MOTION_SPRINGS.gentleSettle.tension,
              useNativeDriver: true,
            }),
          ])
        );
      } else {
        animations.push(
          Animated.timing(translateAnim, {
            toValue: 0,
            duration: duration,
            delay: startDelay,
            easing: MOTION_EASINGS.decelerate,
            useNativeDriver: true,
          })
        );
      }
    } else {
      animations.push(
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: MOTION_SPRINGS.bouncyPop.friction,
          tension: MOTION_SPRINGS.bouncyPop.tension,
          delay: startDelay,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  }, [direction, distance, duration, spring, index, delay, isReduced]);

  const transformStyle: any[] = [];
  if (direction === 'up' || direction === 'down') {
    transformStyle.push({
      translateY: direction === 'up' ? translateAnim : Animated.multiply(translateAnim, -1),
    });
  } else if (direction === 'left' || direction === 'right') {
    transformStyle.push({
      translateX: direction === 'left' ? translateAnim : Animated.multiply(translateAnim, -1),
    });
  } else if (direction === 'scale') {
    transformStyle.push({
      scale: scaleAnim,
    });
  }

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: transformStyle.length > 0 ? transformStyle : undefined,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export interface ClayBadgeProps {
  label?: string | number;
  color?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  children?: React.ReactNode;
}

/**
 * ClayBadge: Tactile pill badge with pop-in micro-animation.
 */
export const ClayBadge: React.FC<ClayBadgeProps> = ({
  label,
  color = '#3B82F6',
  textColor = '#FFFFFF',
  style,
  size = 'md',
  children,
}) => {
  const isReduced = isReducedMotionSync();
  const scaleAnim = useRef(new Animated.Value(isReduced ? 1 : 0.8)).current;

  useEffect(() => {
    if (isReduced) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: MOTION_SPRINGS.bouncyPop.friction,
      tension: MOTION_SPRINGS.bouncyPop.tension,
      useNativeDriver: true,
    }).start();
  }, [isReduced]);

  const paddingV = size === 'sm' ? 2 : size === 'lg' ? 6 : 4;
  const paddingH = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 13 : 11;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: color,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          borderRadius: 999,
          alignSelf: 'flex-start',
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {label !== undefined ? (
        <Animated.Text
          style={{
            color: textColor,
            fontSize,
            fontWeight: '800',
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Animated.Text>
      ) : (
        children
      )}
    </Animated.View>
  );
};
