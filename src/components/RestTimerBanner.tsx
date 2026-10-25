import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { getClayCardStyle, getClayPillStyle } from '../theme/clay';

interface RestTimerBannerProps {
  onOpenLiveWorkout?: () => void;
}

export const RestTimerBanner: React.FC<RestTimerBannerProps> = ({ onOpenLiveWorkout }) => {
  const { restTimer, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const isTimerActive = (restTimer.isRunning && restTimer.secondsRemaining > 0) || !!restTimer.isFinished;
  const [shouldRender, setShouldRender] = useState(isTimerActive);
  const [displayMode, setDisplayMode] = useState<'running' | 'finished'>(restTimer.isFinished ? 'finished' : 'running');

  const slideY = useRef(new Animated.Value(isTimerActive ? 0 : -45)).current;
  const opacity = useRef(new Animated.Value(isTimerActive ? 1 : 0)).current;

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
          duration: 260,
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
          toValue: -45,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
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

  // Celebratory Finished state banner
  if (displayMode === 'finished') {
    return (
      <Animated.View style={{ transform: [{ translateY: slideY }], opacity }}>
        <View style={styles.bannerFinishedContainer}>
          <TouchableOpacity
            style={styles.bannerFinishedContent}
            onPress={() => onOpenLiveWorkout?.()}
            activeOpacity={0.85}
          >
            <View style={styles.bannerFinishedLeft}>
              <View style={styles.bannerFinishedIconBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.accentContrastText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerFinishedTitle}>REST COMPLETE • READY TO TRAIN!</Text>
                <Text style={styles.bannerFinishedSubtitle}>Tap to resume active workout session</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bannerFinishedClose}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              restTimer.dismissFinished?.();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={16} color={colors.accentContrastText} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

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
    <Animated.View style={{ transform: [{ translateY: slideY }], opacity }}>
      <View style={styles.container}>
        {/* Progress track */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        <TouchableOpacity
          style={styles.leftRow}
          onPress={() => onOpenLiveWorkout?.()}
          activeOpacity={0.8}
        >
          <View style={styles.pulseIconBox}>
            <MaterialCommunityIcons name="timer-outline" size={18} color={colors.accentContrastText} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.timerTitle} numberOfLines={1}>
                {restTimer.exerciseName ? `REST • ${restTimer.exerciseName}` : 'REST PERIOD'}
              </Text>
              {onOpenLiveWorkout && (
                <View style={styles.resumePill}>
                  <Text style={styles.resumePillText}>RESUME</Text>
                </View>
              )}
            </View>
            <Text style={styles.timerCountdown}>{timeFormatted}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => restTimer.addSeconds(-15)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.adjustBtnText}>-15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => restTimer.addSeconds(30)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.adjustBtnText}>+30s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              restTimer.stop();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      ...getClayCardStyle(isDark, colors.cardBg, 20),
      borderColor: colors.accent,
      borderWidth: 1.5,
      marginHorizontal: 16,
      marginVertical: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    progressBarTrack: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
    },
    leftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    pulseIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timerTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.6,
      maxWidth: 140,
    },
    resumePill: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    resumePillText: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    timerCountdown: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
      lineHeight: 22,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    adjustBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    adjustBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.text,
      fontFamily: 'monospace',
    },
    closeBtn: {
      padding: 6,
    },
    bannerFinishedContainer: {
      ...getClayPillStyle(colors.accent, 18),
      marginHorizontal: 16,
      marginVertical: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bannerFinishedContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    bannerFinishedLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    bannerFinishedIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bannerFinishedTitle: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    bannerFinishedSubtitle: {
      fontSize: 10,
      color: colors.accentContrastText,
      opacity: 0.85,
    },
    bannerFinishedClose: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
    },
  });
