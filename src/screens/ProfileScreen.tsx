import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
} from 'react-native';
import { ProfileScreenSkeleton } from '../components/ClaySkeleton';
import { useScreenLoading } from '../hooks/useScreenLoading';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { useScreenBottomPadding } from '../hooks/useScreenBottomPadding';
import { EditProfileModal } from '../components/EditProfileModal';
import { AVATAR_ROSTER } from '../lib/dicebear';
import { WorkoutScheduleModal } from '../components/WorkoutScheduleModal';
import { getLevelInfo, DAY_NAMES_SHORT } from '../utils/gamification';

interface ProfileScreenProps {
  onOpenSettings?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const {
    activeUser,
    isDark,
    colors,
    workouts,
    isLoading,
  } = useFitness();

  const bottomPadding = useScreenBottomPadding(32);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const userLevelInfo = useMemo(() => getLevelInfo(activeUser?.exp || 0), [activeUser?.exp]);

  const { showSkeleton, contentOpacity } = useScreenLoading({ isLoading: isLoading || !activeUser });

  if (showSkeleton || !activeUser) {
    return <ProfileScreenSkeleton />;
  }

  const athleteName = activeUser.name?.includes('@')
    ? activeUser.name.split('@')[0]
    : activeUser.name;

  const initials = athleteName.slice(0, 2).toUpperCase();

  return (
    <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
      <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* Guest Local Storage Notice Banner */}
        {activeUser.id.startsWith('guest') && (
          <View style={styles.guestNoticeCard}>
            <View style={styles.guestNoticeIconBox}>
              <MaterialCommunityIcons name="alert" size={18} color={colors.amber} />
            </View>
            <View style={styles.guestNoticeContent}>
              <Text style={styles.guestNoticeTitle}>GUEST MODE (LOCAL STORAGE ONLY)</Text>
              <Text style={styles.guestNoticeDesc}>
                Your workouts and routines are saved on this device only. Sign up to sync across devices.
              </Text>
            </View>
          </View>
        )}

        {/* 1. Header Profile Hero Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={[styles.avatarBox, { backgroundColor: activeUser.avatarBg || colors.accent }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsEditModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            {activeUser.avatarUrl ? (
              <Image
                source={{ uri: activeUser.avatarUrl }}
                style={styles.profileAvatarImg}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {athleteName}
            </Text>
            <Text style={styles.profileHandle}>
              @{activeUser.handle || athleteName.toLowerCase().replace(/\s+/g, '')}
            </Text>

            <View style={styles.profileButtonsRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="account-edit-outline" size={13} color={colors.accent} />
                <Text style={styles.editButtonText}>EDIT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.streakBadge}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsScheduleModalOpen(true);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="fire" size={13} color={colors.flame} />
                <Text style={styles.streakText}>{activeUser.streakDays}d Streak</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. Level & Gamified XP Progress Bento Card */}
        <TouchableOpacity
          style={styles.levelCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsScheduleModalOpen(true);
          }}
          activeOpacity={0.85}
        >
          <View style={styles.levelCardHeader}>
            <View style={styles.levelBadge}>
              <MaterialCommunityIcons name="trophy-award" size={18} color={colors.amber} />
              <Text style={styles.levelBadgeText}>LEVEL {userLevelInfo.level}</Text>
            </View>
            <Text style={styles.levelTitle}>{userLevelInfo.title}</Text>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                { width: `${Math.min(Math.max(userLevelInfo.progressPercent, 5), 100)}%` },
              ]}
            />
          </View>

          <View style={styles.xpStatsRow}>
            <Text style={styles.xpLabel}>
              {userLevelInfo.currentExp} / {userLevelInfo.maxExpForNext} EXP
            </Text>
            <Text style={styles.xpPercent}>{userLevelInfo.progressPercent}% to next rank</Text>
          </View>
        </TouchableOpacity>

        {/* 3. 2x2 Bento Stats Grid */}
        <View style={styles.bentoGrid}>
          {/* Workouts Logged */}
          <View style={styles.bentoTile}>
            <View style={[styles.bentoIconBadge, { backgroundColor: colors.violetSubtle }]}>
              <MaterialCommunityIcons name="dumbbell" size={18} color={colors.violet} />
            </View>
            <Text style={styles.bentoValue}>{workouts.length}</Text>
            <Text style={styles.bentoLabel}>Total Workouts</Text>
          </View>

          {/* Streak Days */}
          <View style={styles.bentoTile}>
            <View style={[styles.bentoIconBadge, { backgroundColor: colors.coralSubtle }]}>
              <MaterialCommunityIcons name="fire" size={18} color={colors.coral} />
            </View>
            <Text style={styles.bentoValue}>{activeUser.streakDays} Days</Text>
            <Text style={styles.bentoLabel}>Active Streak</Text>
          </View>

          {/* Body Weight */}
          <View style={styles.bentoTile}>
            <View style={[styles.bentoIconBadge, { backgroundColor: colors.skySubtle }]}>
              <MaterialCommunityIcons name="scale-bathroom" size={18} color={colors.sky} />
            </View>
            <Text style={styles.bentoValue}>
              {activeUser.bodyWeight} {activeUser.weightUnit.toUpperCase()}
            </Text>
            <Text style={styles.bentoLabel}>Body Weight</Text>
          </View>

          {/* Training Focus */}
          <View style={styles.bentoTile}>
            <View style={[styles.bentoIconBadge, { backgroundColor: colors.mintSubtle }]}>
              <MaterialCommunityIcons name="target" size={18} color={colors.mint} />
            </View>
            <Text style={styles.bentoValue} numberOfLines={1}>
              {activeUser.trainingGoal}
            </Text>
            <Text style={styles.bentoLabel}>Primary Focus</Text>
          </View>
        </View>

        {/* 4. Weekly Training Split Schedule Card */}
        <TouchableOpacity
          style={styles.scheduleCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsScheduleModalOpen(true);
          }}
          activeOpacity={0.85}
        >
          <View style={styles.scheduleHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.scheduleIconBox, { backgroundColor: colors.accentSubtle }]}>
                <MaterialCommunityIcons name="calendar-sync" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.scheduleTitle}>TRAINING CADENCE</Text>
                <Text style={styles.scheduleSub}>Tap to configure weekly split & alerts</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
          </View>

          {/* 7 Day Pills */}
          <View style={styles.dayPillsRow}>
            {DAY_NAMES_SHORT.map((day, idx) => {
              const isTrain = (activeUser.workoutSchedule || [1, 3, 5]).includes(idx);
              return (
                <View
                  key={idx}
                  style={[styles.dayPill, isTrain && styles.dayPillTrain]}
                >
                  <Text style={[styles.dayPillText, isTrain && styles.dayPillTextTrain]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Edit Profile & Avatar Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
      />

      {/* Workout Schedule & Gamified Rewards Modal */}
      <WorkoutScheduleModal
        visible={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />
    </SafeAreaView>
    </Animated.View>
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
      gap: 14,
      paddingBottom: 110,
    },
    guestNoticeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: colors.amber,
      gap: 12,
    },
    guestNoticeIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.amberSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guestNoticeContent: {
      flex: 1,
    },
    guestNoticeTitle: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.amber,
      letterSpacing: 0.5,
    },
    guestNoticeDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 15,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 10,
      gap: 14,
    },
    avatarBox: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 2,
      borderColor: colors.accent,
      elevation: 4,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    profileAvatarImg: {
      width: 72,
      height: 72,
      borderRadius: 24,
    },
    avatarInitials: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    profileHandle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textDim,
      marginTop: 2,
    },
    profileButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentSubtle,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    editButtonText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.coralSubtle,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    streakText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.flame,
    },
    levelCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
    },
    levelCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    levelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.amberSubtle,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.amber,
    },
    levelBadgeText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.amber,
      letterSpacing: 0.8,
    },
    levelTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    xpTrack: {
      height: 8,
      backgroundColor: colors.surfaceRaised,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    xpFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 4,
    },
    xpStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    xpLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    xpPercent: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    bentoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    bentoTile: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
    },
    bentoIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    bentoValue: {
      fontSize: 17,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    bentoLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textDim,
      marginTop: 2,
    },
    scheduleCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
    },
    scheduleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    scheduleIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scheduleTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 0.8,
    },
    scheduleSub: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textDim,
      marginTop: 2,
    },
    dayPillsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 4,
    },
    dayPill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    dayPillTrain: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      elevation: 2,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    dayPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textDim,
    },
    dayPillTextTrain: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
  });
