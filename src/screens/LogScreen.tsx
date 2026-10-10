import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { RoutineTemplate } from '../types';
import { LogWalkModal } from '../components/LogWalkModal';

interface LogScreenProps {
  onStartRoutine: (routine?: RoutineTemplate) => void;
  onNavigateToRoutines: () => void;
}

export const LogScreen: React.FC<LogScreenProps> = ({
  onStartRoutine,
  onNavigateToRoutines,
}) => {
  const { activeUser, routines, activeSession, walkingLogs, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [isWalkModalVisible, setIsWalkModalVisible] = useState(false);

  const athleteName = activeUser?.name?.includes('@')
    ? activeUser.name.split('@')[0]
    : activeUser?.name || 'Guest Athlete';

  const initials = athleteName.slice(0, 2).toUpperCase();

  // Today's Walking Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWalks = walkingLogs.filter((w) => w.date.startsWith(todayStr));
  const todaySteps = todayWalks.reduce((acc, w) => acc + (w.steps || 0), 0);
  const todayDistance = todayWalks.reduce((acc, w) => acc + (w.distanceKm || 0), 0);
  const todayMinutes = todayWalks.reduce((acc, w) => acc + (w.durationMinutes || 0), 0);
  const todayCalories = todayWalks.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 1. Athlete Hero Card */}
        <View style={styles.athleteCard}>
          <View style={[styles.avatarBox, { backgroundColor: activeUser?.avatarBg || '#EA580C' }]}>
            {activeUser?.avatarUrl ? (
              <Image
                source={{ uri: activeUser.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>

          <View style={styles.athleteDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.athleteName}>{athleteName}</Text>
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>
                  {activeUser?.trainingGoal || 'Strength'}
                </Text>
              </View>
            </View>
            <Text style={styles.athleteMeta}>
              {activeUser?.bodyWeight || 75} {activeUser?.weightUnit || 'kg'} • {activeUser?.handle || '@guest_athlete'}
            </Text>
          </View>

          <View style={styles.streakBox}>
            <View style={styles.streakRow}>
              <MaterialCommunityIcons name="fire" size={16} color={colors.flame} />
              <Text style={styles.streakNum}>{activeUser?.streakDays || 1}d</Text>
            </View>
            <Text style={styles.streakLabel}>STREAK</Text>
          </View>
        </View>

        {/* 2. Active Session Resume Card (if any) */}
        {activeSession ? (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => onStartRoutine()}
            activeOpacity={0.8}
          >
            <View style={styles.activeBannerLeft}>
              <View style={styles.activePulseDot} />
              <View>
                <Text style={styles.activeBannerTitle}>WORKOUT IN PROGRESS</Text>
                <Text style={styles.activeBannerSub}>{activeSession.title}</Text>
              </View>
            </View>
            <View style={styles.resumeBtn}>
              <Text style={styles.resumeBtnText}>RESUME</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color={colors.accentContrastText} />
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 3. Start Empty Workout CTA */}
        <TouchableOpacity
          style={styles.heroStartBtn}
          onPress={() => onStartRoutine()}
          activeOpacity={0.85}
        >
          <View style={styles.heroStartLeft}>
            <View style={styles.heroIconCircle}>
              <MaterialCommunityIcons
                name="play"
                size={22}
                color={colors.accentContrastText === '#FFFFFF' ? '#000000' : '#FFFFFF'}
              />
            </View>
            <View>
              <Text style={styles.heroStartTitle}>START EMPTY WORKOUT</Text>
              <Text style={styles.heroStartSub}>LOG EXERCISES AS YOU TRAIN</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={22} color={colors.accentContrastText} />
        </TouchableOpacity>

        {/* 4. Walking Tracker Card */}
        <View style={styles.walkingCard}>
          <View style={styles.walkingHeader}>
            <View style={styles.walkingTitleRow}>
              <View style={styles.walkingIconBox}>
                <MaterialCommunityIcons name="walk" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.walkingCardTitle}>WALKING & STEPS</Text>
                <Text style={styles.walkingCardSub}>
                  {todayWalks.length > 0 ? `${todayWalks.length} logged today` : 'No walks logged today'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logWalkBtn}
              onPress={() => setIsWalkModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.accentContrastText} />
              <Text style={styles.logWalkBtnText}>LOG WALK</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.walkingMetricsRow}>
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricNum}>{todaySteps.toLocaleString()}</Text>
              <Text style={styles.walkingMetricLabel}>STEPS</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricNum}>{todayDistance.toFixed(1)} km</Text>
              <Text style={styles.walkingMetricLabel}>DISTANCE</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricNum}>{todayMinutes}m</Text>
              <Text style={styles.walkingMetricLabel}>DURATION</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricNum}>{todayCalories}</Text>
              <Text style={styles.walkingMetricLabel}>KCAL</Text>
            </View>
          </View>
        </View>

        {/* 5. Saved Routines Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SAVED ROUTINES ({routines.length})</Text>
          <TouchableOpacity onPress={onNavigateToRoutines} activeOpacity={0.7}>
            <Text style={styles.sectionActionText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.routineList}>
          {routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View style={styles.routineInfo}>
                <View style={styles.routineTitleRow}>
                  <Text style={styles.routineTitle}>{routine.title}</Text>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{routine.category}</Text>
                  </View>
                </View>
                <Text style={styles.routineDesc} numberOfLines={1}>
                  {routine.description}
                </Text>
                <Text style={styles.exerciseCountText}>
                  {routine.exerciseIds.length} exercises
                </Text>
              </View>

              <TouchableOpacity
                style={styles.startRoutineBtn}
                onPress={() => onStartRoutine(routine)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="play" size={14} color={colors.accent} />
                <Text style={styles.startRoutineBtnText}>START</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Manual Walk Logger Modal */}
      <LogWalkModal
        visible={isWalkModalVisible}
        onClose={() => setIsWalkModalVisible(false)}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      gap: 16,
      paddingBottom: 110,
    },
    athleteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 12,
    },
    avatarBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: '#EA580C',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 16,
    },
    avatarInitials: {
      fontSize: 16,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    athleteDetails: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    athleteName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    focusBadge: {
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    focusBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    athleteMeta: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: 'monospace',
      marginTop: 4,
    },
    streakBox: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: 'center',
    },
    streakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    streakNum: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.flame,
      fontFamily: 'monospace',
    },
    streakLabel: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
      marginTop: 2,
    },
    activeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 20,
      padding: 14,
    },
    activeBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    activePulseDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    activeBannerTitle: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 1,
    },
    activeBannerSub: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 2,
    },
    resumeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      gap: 4,
    },
    resumeBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    heroStartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.accent,
      borderRadius: 24,
      paddingVertical: 18,
      paddingHorizontal: 18,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    heroStartLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    heroIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accentContrastText === '#FFFFFF' ? '#FFFFFF' : '#000000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroStartTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    heroStartSub: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accentContrastText === '#FFFFFF' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.7)',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    walkingCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: 16,
      gap: 14,
    },
    walkingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    walkingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    walkingIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    walkingCardTitle: {
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: colors.textPrimary,
    },
    walkingCardSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    logWalkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      gap: 4,
    },
    logWalkBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    walkingMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    walkingMetricBox: {
      flex: 1,
      alignItems: 'center',
    },
    walkingMetricNum: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
    },
    walkingMetricLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginTop: 2,
    },
    metricDivider: {
      width: 1,
      height: 22,
      backgroundColor: colors.surfaceBorder,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textMuted,
      letterSpacing: 1,
    },
    sectionActionText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
    },
    routineList: {
      gap: 12,
    },
    routineCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    routineInfo: {
      flex: 1,
      paddingRight: 12,
    },
    routineTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    routineTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    categoryPill: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    categoryPillText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    routineDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    exerciseCountText: {
      fontSize: 11,
      color: colors.textDim,
      fontFamily: 'monospace',
      marginTop: 4,
    },
    startRoutineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 6,
    },
    startRoutineBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
  });
