import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { SignOutConfirmModal } from '../components/SignOutConfirmModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { AVATAR_ROSTER } from '../lib/dicebear';
import { WorkoutScheduleModal } from '../components/WorkoutScheduleModal';
import { getLevelInfo, DAY_NAMES_SHORT } from '../utils/gamification';

interface ProfileScreenProps {
  onOpenSettings?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenSettings }) => {
  const {
    activeUser,
    logout,
    isDark,
    colors,
  } = useFitness();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const userLevelInfo = useMemo(() => getLevelInfo(activeUser?.exp || 0), [activeUser?.exp]);

  if (!activeUser) return null;

  const athleteName = activeUser.name?.includes('@')
    ? activeUser.name.split('@')[0]
    : activeUser.name;

  const initials = athleteName.slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Guest Local Storage Notice Banner */}
        {activeUser.id.startsWith('guest') && (
          <View style={styles.guestNoticeCard}>
            <View style={styles.guestNoticeIconBox}>
              <MaterialCommunityIcons name="alert" size={18} color="#F59E0B" />
            </View>
            <View style={styles.guestNoticeContent}>
              <Text style={styles.guestNoticeTitle}>GUEST MODE (LOCAL STORAGE ONLY)</Text>
              <Text style={styles.guestNoticeDesc}>
                Your workouts and routines are saved on this device only. If you delete or uninstall the app, your progress cannot be recovered.
              </Text>
            </View>
          </View>
        )}

        {/* 1. Header Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={[styles.avatarBox, { backgroundColor: activeUser.avatarBg || '#EA580C' }]}
            onPress={() => setIsEditModalVisible(true)}
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
            <View style={styles.avatarEditOverlayBadge}>
              <MaterialCommunityIcons name="pencil" size={10} color={colors.accentContrastText} />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{athleteName}</Text>

            {/* Username and Edit Button Area */}
            <View style={styles.handleAreaRow}>
              <Text style={styles.profileHandle}>{activeUser.handle}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditModalVisible(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={12}
                  color={colors.accentContrastText}
                />
                <Text style={styles.editButtonText}>EDIT</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.streakBadge}
              onPress={() => setIsScheduleModalOpen(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="fire" size={14} color={colors.flame} />
              <Text style={styles.streakText}>{activeUser.streakDays} Day Workout Streak</Text>
              <MaterialCommunityIcons name="chevron-right" size={13} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Profile Summary Snapshot */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>GOAL</Text>
              <Text style={styles.summaryVal}>{activeUser.trainingGoal}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>BODY WEIGHT</Text>
              <Text style={styles.summaryVal}>
                {activeUser.bodyWeight} {activeUser.weightUnit}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>AVATAR</Text>
              <Text style={styles.summaryVal}>
                {AVATAR_ROSTER.find(
                  (c) =>
                    c.style === activeUser.avatarStyle &&
                    c.seed === activeUser.avatarSeed &&
                    (c.options
                      ? JSON.stringify(c.options) === JSON.stringify(activeUser.avatarOptions || {})
                      : !activeUser.avatarOptions || Object.keys(activeUser.avatarOptions).length === 0)
                )?.name ||
                  AVATAR_ROSTER.find(
                    (c) => c.style === activeUser.avatarStyle && c.seed === activeUser.avatarSeed
                  )?.name ||
                  activeUser.avatarSeed ||
                  activeUser.avatarStyle ||
                  'Titan'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2.5 Training Split & Rewards Card */}
        <TouchableOpacity
          style={styles.scheduleActionCard}
          onPress={() => setIsScheduleModalOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.scheduleActionHeader}>
            <View style={styles.scheduleActionLeft}>
              <View style={styles.scheduleActionIconBox}>
                <MaterialCommunityIcons name="calendar-sync" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.scheduleActionTitle}>TRAINING SPLIT & REWARDS</Text>
                <Text style={styles.scheduleActionSubtitle}>
                  {userLevelInfo.title} • Level {userLevelInfo.level} ({userLevelInfo.progressPercent}%)
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </View>

          <View style={styles.scheduleSplitPills}>
            {DAY_NAMES_SHORT.map((day, idx) => {
              const isTrain = (activeUser.workoutSchedule || [1, 3, 5]).includes(idx);
              return (
                <View
                  key={idx}
                  style={[styles.miniDayPill, isTrain && styles.miniDayPillTrain]}
                >
                  <Text
                    style={[
                      styles.miniDayPillText,
                      isTrain && { color: colors.accent, fontWeight: '800' },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

        {/* 3. Bio Card */}
        {activeUser.bio ? (
          <View style={styles.bioCard}>
            <View style={styles.bioHeaderRow}>
              <MaterialCommunityIcons name="text-box-outline" size={16} color={colors.accent} />
              <Text style={styles.bioHeaderTitle}>ATHLETE BIO</Text>
            </View>
            <Text style={styles.bioContent}>"{activeUser.bio}"</Text>
          </View>
        ) : null}

        {/* 5. Security & Offline Storage Card */}
        <View style={styles.securityCard}>
          <View style={styles.securityIconBox}>
            <MaterialCommunityIcons name="shield-check" size={20} color={colors.emerald} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Private & Isolated Storage</Text>
            <Text style={styles.securitySub}>
              Your workouts, walks, personal records, and themes are encrypted and securely stored on this device.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile & Avatar Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
      />

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={logout}
      />

      {/* Workout Schedule & Gamified Rewards Modal */}
      <WorkoutScheduleModal
        visible={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />
    </SafeAreaView>
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
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#151722' : '#FFFFFF',
      borderRadius: 28,
      padding: 18,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.45 : 0.12,
      shadowRadius: 14,
      elevation: 6,
      gap: 16,
    },
    avatarBox: {
      width: 70,
      height: 70,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF',
    },
    profileAvatarImg: {
      width: 70,
      height: 70,
      borderRadius: 26,
    },
    avatarInitials: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    avatarEditOverlayBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? '#151722' : '#FFFFFF',
    },
    profileInfo: {
      flex: 1,
      gap: 4,
    },
    profileName: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    handleAreaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    profileHandle: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: colors.textMuted,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    editButtonText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#1C1F2B' : '#F1F5F9',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginTop: 2,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    streakText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.flame,
    },
    summaryCard: {
      backgroundColor: isDark ? '#151722' : '#FFFFFF',
      borderRadius: 24,
      padding: 16,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.10,
      shadowRadius: 10,
      elevation: 4,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.textDim,
      marginBottom: 3,
    },
    summaryVal: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    summaryDivider: {
      width: 1,
      height: 24,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    scheduleActionCard: {
      backgroundColor: isDark ? '#151722' : '#FFFFFF',
      borderRadius: 24,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.accent,
      gap: 12,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    scheduleActionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    scheduleActionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    scheduleActionIconBox: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: isDark ? '#231B36' : '#EDE9FE',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.accent,
    },
    scheduleActionTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
    },
    scheduleActionSubtitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      marginTop: 2,
    },
    scheduleSplitPills: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 4,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    miniDayPill: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: isDark ? '#1C1F2B' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    miniDayPillTrain: {
      backgroundColor: isDark ? '#231B36' : '#EDE9FE',
      borderColor: colors.accent,
    },
    miniDayPillText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
    },
    bioCard: {
      backgroundColor: isDark ? '#151722' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      borderWidth: 1.5,
      borderRadius: 24,
      padding: 16,
      gap: 6,
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.10,
      shadowRadius: 10,
      elevation: 4,
    },
    bioHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bioHeaderTitle: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.textDim,
      letterSpacing: 0.8,
      fontFamily: 'monospace',
    },
    bioContent: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      fontStyle: 'italic',
    },
    securityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#151722' : '#FFFFFF',
      borderRadius: 24,
      padding: 16,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      gap: 12,
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.10,
      shadowRadius: 10,
      elevation: 4,
    },
    securityIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.emeraldBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    securityTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    securitySub: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
      lineHeight: 14,
    },
    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#261114' : '#FEE2E2',
      borderWidth: 1.5,
      borderColor: '#EF4444',
      paddingVertical: 15,
      borderRadius: 22,
      marginTop: 8,
    },
    signOutText: {
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 1,
      color: '#EF4444',
    },
    guestNoticeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)',
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
    },
    guestNoticeIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    guestNoticeContent: {
      flex: 1,
    },
    guestNoticeTitle: {
      fontSize: 10,
      fontWeight: '900',
      color: '#F59E0B',
      letterSpacing: 0.8,
      fontFamily: 'monospace',
      marginBottom: 3,
    },
    guestNoticeDesc: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 16,
    },
  });
