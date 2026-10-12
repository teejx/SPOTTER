import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFitness } from '../context/FitnessContext';
import { ThemeColors } from '../theme/colors';

const REST_PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
];

export const WorkoutRestTimerBar: React.FC = () => {
  const { restTimer, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const isTimerActive = (restTimer.isRunning && restTimer.secondsRemaining > 0) || !!restTimer.isFinished;
  const [shouldRender, setShouldRender] = useState(isTimerActive);
  const [displayMode, setDisplayMode] = useState<'running' | 'finished'>(restTimer.isFinished ? 'finished' : 'running');

  // Animated values for sliding up from bottom and fading in/out
  const slideY = useRef(new Animated.Value(isTimerActive ? 0 : 140)).current;
  const opacity = useRef(new Animated.Value(isTimerActive ? 1 : 0)).current;

  // Track mode without abrupt state shifts during exit animation
  useEffect(() => {
    if (restTimer.isFinished) {
      setDisplayMode('finished');
    } else if (restTimer.isRunning && restTimer.secondsRemaining > 0) {
      setDisplayMode('running');
    }
  }, [restTimer.isFinished, restTimer.isRunning, restTimer.secondsRemaining]);

  useEffect(() => {
    if (isTimerActive) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 0,
          duration: 280,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 140,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [isTimerActive]);

  if (!shouldRender) {
    return null;
  }

  // Finished State: Celebratory Alert Banner
  if (displayMode === 'finished') {
    return (
      <Animated.View
        style={[
          styles.floatingWrapper,
          {
            transform: [{ translateY: slideY }],
            opacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.finishedContainer}>
          <View style={styles.finishedLeft}>
            <View style={styles.finishedIconBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.accentContrastText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.finishedTitle}>REST COMPLETE • READY TO LIFT!</Text>
              <Text style={styles.finishedSubtitle}>
                {restTimer.exerciseName ? `${restTimer.exerciseName} • Next Set` : 'Time to crush your next set!'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.finishedDismissBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              restTimer.dismissFinished?.();
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={18} color={colors.accentContrastText} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // Active Running Timer State
  const minutes = Math.floor(restTimer.secondsRemaining / 60);
  const seconds = restTimer.secondsRemaining % 60;
  const timeFormatted = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      restTimer.totalSeconds > 0
        ? ((restTimer.totalSeconds - restTimer.secondsRemaining) / restTimer.totalSeconds) * 100
        : 0
    )
  );

  return (
    <Animated.View
      style={[
        styles.floatingWrapper,
        {
          transform: [{ translateY: slideY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.container}>
        {/* Dynamic Progress Track on top */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Main Header Row */}
        <View style={styles.mainRow}>
          {/* Left: Stopwatch pulse badge & Time */}
          <View style={styles.leftGroup}>
            <View style={styles.timerBadge}>
              <MaterialCommunityIcons name="timer-outline" size={18} color={colors.accentContrastText} />
            </View>
            <View>
              <Text style={styles.countdownText}>{timeFormatted}</Text>
              <Text style={styles.exerciseNameText} numberOfLines={1}>
                {restTimer.exerciseName ? `REST • ${restTimer.exerciseName}` : 'REST PERIOD'}
              </Text>
            </View>
          </View>

          {/* Right: Quick Adjustments (-15s, +30s, Skip) */}
          <View style={styles.quickControls}>
            <TouchableOpacity
              style={styles.adjustChip}
              onPress={() => {
                restTimer.addSeconds(-15);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.adjustChipText}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adjustChip}
              onPress={() => {
                restTimer.addSeconds(30);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.adjustChipText}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                restTimer.stop();
              }}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="fast-forward" size={14} color={colors.text} />
              <Text style={styles.skipBtnText}>SKIP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preset Chips Row */}
        <View style={styles.presetsRow}>
          <Text style={styles.presetsLabel}>SET:</Text>
          {REST_PRESETS.map((preset) => {
            const isMatch = restTimer.totalSeconds === preset.seconds;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.presetChip, isMatch && styles.presetChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  restTimer.start(preset.seconds, restTimer.exerciseName);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetChipText, isMatch && styles.presetChipTextActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    floatingWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 12,
      paddingBottom: 12,
      zIndex: 999,
    },
    container: {
      backgroundColor: isDark ? 'rgba(18, 20, 29, 0.96)' : 'rgba(255, 255, 255, 0.97)',
      borderColor: colors.accent,
      borderWidth: 1.5,
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 10,
    },
    progressBarTrack: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3.5,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    leftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    timerBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countdownText: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
      lineHeight: 22,
    },
    exerciseNameText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.5,
      maxWidth: 160,
    },
    quickControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    adjustChip: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    adjustChipText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.text,
      fontFamily: 'monospace',
    },
    skipBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    skipBtnText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 0.5,
    },
    presetsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.cardBorder,
    },
    presetsLabel: {
      fontSize: 9,
      fontWeight: '900',
      color: colors.textDim,
      letterSpacing: 0.8,
    },
    presetChip: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    presetChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    presetChipText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    presetChipTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    finishedContainer: {
      backgroundColor: colors.accent,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    finishedLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    finishedIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    finishedTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    finishedSubtitle: {
      fontSize: 11,
      color: colors.accentContrastText,
      opacity: 0.85,
      marginTop: 1,
    },
    finishedDismissBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
    },
  });
