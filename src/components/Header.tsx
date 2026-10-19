import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenLiveWorkout?: () => void;
  onNavigateToProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenLiveWorkout,
  onNavigateToProfile,
}) => {
  const {
    activeUser,
    activeSession,
    colors,
    isDark,
    isWorkoutStarted,
    isWorkoutPaused,
  } = useFitness();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const athleteName = activeUser?.name?.includes('@')
    ? activeUser.name.split('@')[0]
    : activeUser?.name || 'Guest';

  const initials = athleteName.slice(0, 2).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {title ? (
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        ) : (
          <View style={styles.brandRow}>
            <View style={styles.brandLogoBox}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.brandLogoImage}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.brandName}>SPOTTER</Text>
              <Text style={styles.brandSub}>LOGBOOK</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.rightContainer}>
        {activeSession ? (
          <TouchableOpacity
            style={[
              styles.liveSessionBadge,
              !isWorkoutStarted && styles.stagingSessionBadge,
              isWorkoutPaused && styles.pausedSessionBadge,
            ]}
            onPress={onOpenLiveWorkout}
            activeOpacity={0.8}
          >
            {!isWorkoutStarted ? (
              <MaterialCommunityIcons name="dumbbell" size={13} color={colors.accent} />
            ) : isWorkoutPaused ? (
              <MaterialCommunityIcons name="pause" size={12} color="#F59E0B" />
            ) : (
              <View style={styles.pulsingDot} />
            )}
            <Text
              style={[
                styles.liveSessionText,
                !isWorkoutStarted && { color: colors.textMuted },
                isWorkoutPaused && { color: '#F59E0B' },
              ]}
            >
              {!isWorkoutStarted ? 'STAGING' : (isWorkoutPaused ? 'PAUSED' : 'LIVE WORKOUT')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.athletePill}
            onPress={onNavigateToProfile}
            activeOpacity={0.7}
          >
            <View style={[styles.avatarCircle, { backgroundColor: activeUser?.avatarBg || '#EA580C' }]}>
              {activeUser?.avatarUrl ? (
                <Image
                  source={{ uri: activeUser.avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <Text style={styles.athleteText} numberOfLines={1}>
              {athleteName}
            </Text>
            <MaterialCommunityIcons name="fire" size={15} color={colors.flame} />
            <Text style={styles.streakCount}>{activeUser?.streakDays ?? 1}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    leftContainer: {
      flex: 1,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandLogoBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    brandLogoImage: {
      width: '100%',
      height: '100%',
    },
    brandName: {
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.textPrimary,
    },
    brandSub: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.accent,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    athletePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingVertical: 4,
      paddingHorizontal: 6,
      paddingRight: 10,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 6,
    },
    avatarCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#EA580C',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: 26,
      height: 26,
      borderRadius: 13,
    },
    avatarText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    athleteText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      maxWidth: 90,
    },
    streakCount: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'monospace',
    },
    liveSessionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    stagingSessionBadge: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: colors.cardBorder,
    },
    pausedSessionBadge: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    pulsingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    liveSessionText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 1,
    },
  });
