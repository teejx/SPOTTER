import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
  isDark?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
  isDark = true,
}) => {
  const onCompleteRef = useRef(onAnimationComplete);
  onCompleteRef.current = onAnimationComplete;
  const hasCompletedRef = useRef(false);

  const safeComplete = () => {
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onCompleteRef.current?.();
    }
  };

  // Phase A & B: Icon entrance & dumbbell tactile motion
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconTranslateY = useRef(new Animated.Value(24)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  // Phase C: Supporting clay glow / ambient rings
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Phase D: Brand wordmark reveal
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(14)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Phase E: Master container transition into real app
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hard safety timer: Guaranteed dismissal after 1.8 seconds max
    const safetyTimer = setTimeout(() => {
      safeComplete();
    }, 1800);

    // 5-Phase Coordinated Motion Orchestration
    const animationSequence = Animated.sequence([
      // Phase A: Entrance (0-450ms)
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(iconTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        // Phase C ambient ring expand
        Animated.timing(ringOpacity, {
          toValue: 0.35,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, {
          toValue: 1.15,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),

      // Phase B: Dumbbell hero motion & subtle settle (settles into place)
      Animated.parallel([
        Animated.sequence([
          Animated.timing(iconRotate, {
            toValue: 1, // slight tilt -2 deg
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(iconRotate, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.elastic(1)),
            useNativeDriver: true,
          }),
        ]),
        // Phase D: Reveal SPOTTER wordmark
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Reveal Tagline
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      // Readiness hold (300ms)
      Animated.delay(320),

      // Phase E: Seamless exit transition
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 360,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 1.05,
          duration: 360,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animationSequence.start(() => {
      safeComplete();
    });

    return () => {
      clearTimeout(safetyTimer);
      animationSequence.stop();
    };
  }, []);

  const rotationInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-3deg'],
  });

  const bgColor = isDark ? '#0D1020' : '#F5F6FA';
  const textColor = isDark ? '#FFFFFF' : '#181B2F';

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        {
          backgroundColor: bgColor,
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
          zIndex: 99999,
        },
      ]}
      pointerEvents="none"
    >
      {/* Supporting Ambient Rings (Clay Soft Glow) */}
      <Animated.View
        style={[
          styles.ambientRingOuter,
          {
            borderColor: isDark ? 'rgba(99, 85, 230, 0.28)' : 'rgba(99, 85, 230, 0.16)',
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientRingInner,
          {
            borderColor: isDark ? 'rgba(0, 193, 246, 0.22)' : 'rgba(0, 193, 246, 0.14)',
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Hero Claymorphic Dumbbell Icon */}
      <Animated.View
        style={[
          styles.heroIconWrapper,
          {
            opacity: iconOpacity,
            transform: [
              { scale: iconScale },
              { translateY: iconTranslateY },
              { rotate: rotationInterpolate },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={styles.heroLogoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand Wordmark and Tagline */}
      <Animated.View
        style={[
          styles.brandTextContainer,
          {
            opacity: brandOpacity,
            transform: [{ translateY: brandTranslateY }],
          },
        ]}
      >
        <Text style={[styles.brandTitle, { color: textColor }]}>
          SPOTTER
        </Text>
        <Animated.Text
          style={[
            styles.brandTagline,
            {
              color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(24, 27, 47, 0.65)',
              opacity: taglineOpacity,
            },
          ]}
        >
          Track Every Rep • Elevate Every Set
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6355E6',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    elevation: 20,
    marginBottom: 20,
  },
  heroLogoImage: {
    width: 120,
    height: 120,
  },
  brandTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  ambientRingOuter: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: (SCREEN_WIDTH * 0.85) / 2,
    borderWidth: 2,
  },
  ambientRingInner: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.62,
    height: SCREEN_WIDTH * 0.62,
    borderRadius: (SCREEN_WIDTH * 0.62) / 2,
    borderWidth: 1.5,
  },
});
