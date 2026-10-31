import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  MOTION_SPRINGS,
  MOTION_PRESS_SCALES,
  MOTION_STAGGER,
  MOTION_DURATIONS,
  MOTION_EASINGS,
  isReducedMotion,
} from '../theme/motion';

export type ClayPressableVariant = 'button' | 'card' | 'tile' | 'icon' | 'chip' | 'tab';

export interface ClayPressableProps {
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  variant?: ClayPressableVariant;
  scaleTo?: number;
  haptic?: 'light' | 'medium' | 'selection' | 'none';
  disabled?: boolean;
  activeOpacity?: number;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * ClayPressable: Drop-in tactile interactive wrapper with claymorphic physical compression.
 * Hardware-accelerated 60 FPS native driver spring physics.
 */
export const ClayPressable: React.FC<ClayPressableProps> = ({
  onPress,
  onLongPress,
  style,
  containerStyle,
  children,
  variant = 'button',
  scaleTo,
  haptic = 'light',
  disabled = false,
  activeOpacity = 0.92,
  accessibilityLabel,
  testID,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const targetScale = scaleTo ?? MOTION_PRESS_SCALES[variant] ?? 0.96;

  const handlePressIn = () => {
    if (disabled) return;

    if (haptic === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (haptic === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (haptic === 'selection') {
      Haptics.selectionAsync();
    }

    Animated.spring(scaleAnim, {
      toValue: targetScale,
      friction: MOTION_SPRINGS.tactilePress.friction,
      tension: MOTION_SPRINGS.tactilePress.tension,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.0,
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
 * AnimatedEntrance: Staggered, hardware-accelerated entrance container for screen sections and list items.
 */
export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({
  index = 0,
  delay = 0,
  direction = 'up',
  distance = 16,
  duration = MOTION_DURATIONS.standard,
  spring = true,
  style,
  children,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(direction === 'none' ? 0 : distance)).current;
  const scaleAnim = useRef(new Animated.Value(direction === 'scale' ? 0.94 : 1)).current;

  useEffect(() => {
    let isMounted = true;

    isReducedMotion().then((reduced) => {
      if (!isMounted) return;

      if (reduced) {
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

      if (direction !== 'none' && direction !== 'scale') {
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
      } else if (direction === 'scale') {
        animations.push(
          Animated.sequence([
            Animated.delay(startDelay),
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: MOTION_SPRINGS.bouncyPop.friction,
              tension: MOTION_SPRINGS.bouncyPop.tension,
              useNativeDriver: true,
            }),
          ])
        );
      }

      Animated.parallel(animations).start();
    });

    return () => {
      isMounted = false;
    };
  }, [index, delay, direction, distance, duration, spring, opacityAnim, translateAnim, scaleAnim]);

  const transformStyle = direction === 'none'
    ? []
    : direction === 'scale'
    ? [{ scale: scaleAnim }]
    : direction === 'up'
    ? [{ translateY: translateAnim }]
    : direction === 'down'
    ? [{ translateY: Animated.multiply(translateAnim, -1) }]
    : direction === 'left'
    ? [{ translateX: translateAnim }]
    : [{ translateX: Animated.multiply(translateAnim, -1) }];

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: transformStyle,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export interface ClayBadgeProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  delay?: number;
}

/**
 * ClayBadge: Bouncy elastic badge for PR trophies, level badges, and counters.
 */
export const ClayBadge: React.FC<ClayBadgeProps> = ({
  style,
  children,
  delay = 100,
}) => {
  const popAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isReducedMotion().then((reduced) => {
      if (reduced) {
        popAnim.setValue(1);
        opacityAnim.setValue(1);
        return;
      }

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.spring(popAnim, {
            toValue: 1.0,
            friction: MOTION_SPRINGS.bouncyPop.friction,
            tension: MOTION_SPRINGS.bouncyPop.tension,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, [delay, popAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [{ scale: popAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
