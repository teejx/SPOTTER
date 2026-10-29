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

    animationSequence.start(({ finished }) => {
      if (finished) {
        onAnimationComplete();
      }
    });

    return () => {
      animationSequence.stop();
    };
  }, [onAnimationComplete]);

  const rotationInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-3deg'],
  });

  const bgColor = isDark ? '#0D1020' : '#F5F6FA';
  const textColor = isDark ? '#FFFFFF' : '#181B2F';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, opacity: containerOpacity, transform: [{ scale: containerScale }] },
      ]}
      pointerEvents="none"
    >
      {/* Ambient Clay Glow Ring */}
      <Animated.View
        style={[
          styles.ambientGlowRing,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Hero Dumbbell Clay Icon Container */}
      <Animated.View
        style={[
          styles.iconWrapper,
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
          style={styles.logoImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Brand Wordmark & Slogan */}
      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: brandOpacity,
            transform: [{ translateY: brandTranslateY }],
          },
        ]}
      >
        <Text style={[styles.brandTitle, { color: textColor }]}>SPOTTER</Text>
        <Animated.Text style={[styles.brandSubtitle, { opacity: taglineOpacity }]}>
          INTELLIGENT STRENGTH LOGBOOK
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlowRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(99, 85, 230, 0.28)',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 34,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#6355E6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6355E6',
    letterSpacing: 2.5,
    marginTop: 6,
  },
});
