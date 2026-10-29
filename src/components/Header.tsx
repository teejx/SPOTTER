import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { WorkoutScheduleModal } from './WorkoutScheduleModal';
import { getLevelInfo } from '../utils/gamification';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  currentTab?: string;
  onOpenLiveWorkout?: () => void;
  onNavigateToProfile?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  currentTab,
  onOpenLiveWorkout,
  onNavigateToProfile,
  onOpenSettings,
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

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const userLevel = useMemo(() => getLevelInfo(activeUser?.exp || 0).level, [activeUser?.exp]);

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
        ) : currentTab === 'profile' ? (
          <TouchableOpacity
            style={styles.settingsHeaderBtn}
            onPress={onOpenSettings}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.athletePill}
            onPress={() => setIsScheduleModalOpen(true)}
            activeOpacity={0.8}
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
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>L{userLevel}</Text>
            </View>
            <MaterialCommunityIcons name="fire" size={15} color={colors.flame} />
            <Text style={styles.streakCount}>{activeUser?.streakDays ?? 1}</Text>
          </TouchableOpacity>
        )}
      </View>

      <WorkoutScheduleModal
        visible={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />
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
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
      width: 40,
      height: 40,
      borderRadius: 12,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    brandLogoImage: {
      width: '100%',
      height: '100%',
    },
    brandName: {
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: 1.2,
      color: colors.textPrimary,
    },
    brandSub: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 2,
      color: colors.accent,
      marginTop: -1,
    },
    title: {
      fontSize: 19,
      fontWeight: '900',
      letterSpacing: 0.3,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      fontWeight: '600',
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
      backgroundColor: isDark ? '#152031' : '#FFFFFF',
      paddingVertical: 5,
      paddingHorizontal: 7,
      paddingRight: 11,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
      gap: 6,
      shadowColor: isDark ? '#000000' : '#111C2D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    avatarCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      fontSize: 11,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    athleteText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      maxWidth: 90,
    },
    levelBadge: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 8,
    },
    levelBadgeText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
    },
    streakCount: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.flame,
      marginLeft: -2,
    },
    settingsHeaderBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: isDark ? '#152031' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: isDark ? '#000000' : '#111C2D',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    liveSessionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? '#1C261E' : '#DCFCE7',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.3)',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    stagingSessionBadge: {
      backgroundColor: isDark ? '#231B36' : '#EDE9FE',
      borderColor: isDark ? 'rgba(192, 132, 252, 0.4)' : 'rgba(147, 51, 234, 0.3)',
      shadowColor: colors.accent,
    },
    pausedSessionBadge: {
      backgroundColor: isDark ? '#2D2012' : '#FEF3C7',
      borderColor: isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(245, 158, 11, 0.3)',
      shadowColor: '#F59E0B',
    },
    pulsingDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#10B981',
    },
    liveSessionText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: '#10B981',
    },
  });
