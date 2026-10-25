import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFitness } from '../context/FitnessContext';
import { ThemeColors } from '../theme/colors';
import { getClayCardStyle, getClayPillStyle } from '../theme/clay';

interface MinimizedWorkoutBarProps {
  onExpand: () => void;
}

export const MinimizedWorkoutBar: React.FC<MinimizedWorkoutBarProps> = ({ onExpand }) => {
  const {
    activeSession,
    isWorkoutStarted,
    isWorkoutPaused,
    workoutElapsedSeconds,
    colors,
    isDark,
  } = useFitness();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Entrance slide-in and opacity animation
  const slideAnim = useRef(new Animated.Value(25)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Live pulsing dot animation for active running sessions
  useEffect(() => {
    if (isWorkoutStarted && !isWorkoutPaused) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isWorkoutStarted, isWorkoutPaused]);

  if (!activeSession) return null;

  const mins = Math.floor(workoutElapsedSeconds / 60);
  const secs = workoutElapsedSeconds % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const completedSets = activeSession.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = activeSession.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0
  );

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onExpand();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.innerTouchable}
        onPress={handlePress}
        activeOpacity={0.88}
        accessibilityLabel="Maximize workout modal"
      >
        {/* Status Indicator Icon */}
        <View style={styles.statusBox}>
          {!isWorkoutStarted ? (
            <View style={styles.stagingIconBox}>
              <MaterialCommunityIcons name="dumbbell" size={18} color={colors.accent} />
            </View>
          ) : isWorkoutPaused ? (
            <View style={styles.pausedIconBox}>
              <MaterialCommunityIcons name="pause" size={18} color="#F59E0B" />
            </View>
          ) : (
            <View style={styles.liveIconBox}>
              <Animated.View
                style={[
                  styles.liveDot,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0.9, 1.4],
                      outputRange: [0.6, 1],
                    }),
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* Workout Info */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.routineTitle} numberOfLines={1}>
              {activeSession.title}
            </Text>
            {!isWorkoutStarted ? (
              <View style={styles.statusBadgeStaging}>
                <Text style={styles.statusBadgeStagingText}>STAGING</Text>
              </View>
            ) : isWorkoutPaused ? (
              <View style={styles.statusBadgePaused}>
                <Text style={styles.statusBadgePausedText}>PAUSED</Text>
              </View>
            ) : (
              <View style={styles.statusBadgeLive}>
                <Text style={styles.statusBadgeLiveText}>LIVE</Text>
              </View>
            )}
          </View>

          <Text style={styles.subtitleText} numberOfLines={1}>
            {!isWorkoutStarted
              ? `Setup • ${activeSession.exercises.length} exercise${activeSession.exercises.length === 1 ? '' : 's'}`
              : isWorkoutPaused
              ? `Paused • ${timeFormatted} elapsed`
              : `${timeFormatted} • ${completedSets}/${totalSets} sets logged`}
          </Text>
        </View>

        {/* Expand Action */}
        <View style={styles.expandButton}>
          <Text style={styles.expandButtonText}>OPEN</Text>
          <MaterialCommunityIcons name="chevron-up" size={18} color={colors.accent} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 86,
      left: 16,
      right: 16,
      zIndex: 90,
      ...getClayCardStyle(isDark, isDark ? '#1C1C1E' : '#FFFFFF', 24),
    },
    innerTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 12,
    },
    statusBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    },
    stagingIconBox: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    pausedIconBox: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    liveIconBox: {
      width: 14,
      height: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    liveDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    infoCol: {
      flex: 1,
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    routineTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      flexShrink: 1,
      letterSpacing: 0.2,
    },
    statusBadgeStaging: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    statusBadgeStagingText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.6,
    },
    statusBadgePaused: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    statusBadgePausedText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: '#F59E0B',
      letterSpacing: 0.6,
    },
    statusBadgeLive: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    statusBadgeLiveText: {
      fontSize: 8.5,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 0.6,
    },
    subtitleText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 2,
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      ...getClayPillStyle(colors.accentSubtle, 14),
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderColor: colors.accent,
      borderWidth: 1,
      gap: 3,
    },
    expandButtonText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 0.6,
    },
  });
