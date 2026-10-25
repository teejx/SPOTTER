import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFitness } from '../context/FitnessContext';
import { ThemeColors } from '../theme/colors';
import {
  getLevelInfo,
  REWARDS_CATALOG,
  DAY_NAMES_SHORT,
  DAY_NAMES_FULL,
  isDayScheduled,
} from '../utils/gamification';

interface WorkoutScheduleModalProps {
  visible: boolean;
  onClose: () => void;
}

const SPLIT_PRESETS = [
  { label: '3-Day Full Body / PPL', days: [1, 3, 5] }, // Mon, Wed, Fri
  { label: '4-Day Upper / Lower', days: [1, 2, 4, 5] }, // Mon, Tue, Thu, Fri
  { label: '5-Day Push Pull Legs', days: [1, 2, 3, 4, 5] }, // Mon-Fri
  { label: '6-Day Arnold Split', days: [1, 2, 3, 4, 5, 6] }, // Mon-Sat
];

const REMINDER_PRESETS = ['07:00 AM', '09:00 AM', '04:00 PM', '06:00 PM', '08:00 PM'];

export const WorkoutScheduleModal: React.FC<WorkoutScheduleModalProps> = ({ visible, onClose }) => {
  const {
    activeUser,
    updateWorkoutSchedule,
    updateReminders,
    setThemeId,
    themeId,
    colors,
    isDark,
  } = useFitness();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const currentSchedule = useMemo(() => {
    return activeUser?.workoutSchedule || [1, 3, 5];
  }, [activeUser?.workoutSchedule]);

  const [selectedDays, setSelectedDays] = useState<number[]>(currentSchedule);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(
    activeUser?.remindersEnabled ?? true
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    activeUser?.reminderTime || '06:00 PM'
  );
  const [activeTab, setActiveTab] = useState<'schedule' | 'rewards'>('schedule');

  // Sync state when modal opens
  useEffect(() => {
    if (visible && activeUser) {
      setSelectedDays(activeUser.workoutSchedule || [1, 3, 5]);
      setRemindersEnabled(activeUser.remindersEnabled ?? true);
      setSelectedTime(activeUser.reminderTime || '06:00 PM');
    }
  }, [visible, activeUser]);

  const levelInfo = useMemo(() => {
    return getLevelInfo(activeUser?.exp || 0);
  }, [activeUser?.exp]);

  const streakShields = activeUser?.streakShields ?? 1;

  const handleToggleDay = async (dayIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let next: number[];
    if (selectedDays.includes(dayIdx)) {
      // Must keep at least 1 workout day
      if (selectedDays.length <= 1) return;
      next = selectedDays.filter((d) => d !== dayIdx);
    } else {
      next = [...selectedDays, dayIdx].sort((a, b) => a - b);
    }
    setSelectedDays(next);
    await updateWorkoutSchedule(next);
  };

  const handleApplyPreset = async (days: number[]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedDays(days);
    await updateWorkoutSchedule(days);
  };

  const handleToggleReminders = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRemindersEnabled(val);
    await updateReminders(val, selectedTime);
  };

  const handleSelectTime = async (time: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTime(time);
    await updateReminders(remindersEnabled, time);
  };

  const handleEquipTheme = async (themeKey: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (themeKey === 'theme-violet') {
      await setThemeId('amethyst');
    } else if (themeKey === 'theme-gold') {
      await setThemeId('amber');
    } else if (themeKey === 'theme-crimson') {
      await setThemeId('crimson');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Drag Handle & Navigation */}
          <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TRAINING & REWARDS</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Level & EXP Master Card */}
          <View style={styles.levelCard}>
            <View style={styles.levelCardHeader}>
              <View style={styles.levelBadgeCircle}>
                <MaterialCommunityIcons
                  name={(levelInfo.badgeIcon as any) || 'trophy'}
                  size={26}
                  color={colors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.levelRow}>
                  <Text style={styles.levelNumberText}>LEVEL {levelInfo.level}</Text>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankPillText}>{levelInfo.title}</Text>
                  </View>
                </View>
                <Text style={styles.levelExpSub}>
                  {levelInfo.currentExp.toLocaleString()} / {levelInfo.maxExpForNext.toLocaleString()} EXP
                </Text>
              </View>
            </View>

            {/* EXP Progress Track */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(4, levelInfo.progressPercent)}%` },
                ]}
              />
            </View>

            {/* Sub-status Row: Streak & Shields */}
            <View style={styles.shieldStreakRow}>
              <View style={styles.statPill}>
                <MaterialCommunityIcons name="fire" size={16} color={colors.flame} />
                <Text style={styles.statPillText}>
                  {activeUser?.streakDays ?? 1} Day Streak
                </Text>
              </View>

              <View style={styles.statPill}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#10B981" />
                <Text style={styles.statPillText}>
                  {streakShields} Streak Shield{streakShields !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Next Milestone Note */}
            <View style={styles.nextRewardRow}>
              <MaterialCommunityIcons name="star-outline" size={14} color={colors.accent} />
              <Text style={styles.nextRewardText} numberOfLines={1}>
                Next Unlock: {levelInfo.nextReward}
              </Text>
            </View>
          </View>

          {/* Tab Selector: Schedule vs Rewards */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'schedule' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('schedule');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={16}
                color={activeTab === 'schedule' ? colors.accent : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'schedule' && styles.tabBtnTextActive,
                ]}
              >
                Workout Schedule
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'rewards' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('rewards');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="gift-outline"
                size={16}
                color={activeTab === 'rewards' ? colors.accent : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'rewards' && styles.tabBtnTextActive,
                ]}
              >
                Rewards Catalog
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'schedule' ? (
            <>
              {/* Rest-Day Friendly Info Banner */}
              <View style={styles.infoBanner}>
                <MaterialCommunityIcons name="shield-star-outline" size={20} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoBannerTitle}>Rest Days Never Break Your Streak</Text>
                  <Text style={styles.infoBannerText}>
                    Set your training days below. Spotter automatically designates your off-days as
                    scheduled muscle recovery so your streak stays unbroken.
                  </Text>
                </View>
              </View>

              {/* 7-Day Interactive Calendar Grid */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeaderTitle}>WEEKLY TRAINING SPLIT</Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Tap any day to toggle between Workout Day and Rest Day
                </Text>

                <View style={styles.daysGrid}>
                  {DAY_NAMES_SHORT.map((name, idx) => {
                    const isWorkout = selectedDays.includes(idx);
                    const isToday = new Date().getDay() === idx;

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.dayCol,
                          isWorkout ? styles.dayColWorkout : styles.dayColRest,
                          isToday && styles.dayColToday,
                        ]}
                        onPress={() => handleToggleDay(idx)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.dayNameText,
                            isWorkout && { color: colors.accent },
                            isToday && { color: colors.text },
                          ]}
                        >
                          {name}
                        </Text>
                        <View
                          style={[
                            styles.dayIconWrap,
                            isWorkout && { backgroundColor: colors.accentSubtle },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={isWorkout ? 'dumbbell' : 'power-sleep'}
                            size={18}
                            color={isWorkout ? colors.accent : colors.textDim}
                          />
                        </View>
                        <Text
                          style={[
                            styles.dayStatusText,
                            isWorkout ? { color: colors.accent } : { color: colors.textDim },
                          ]}
                        >
                          {isWorkout ? 'TRAIN' : 'REST'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Quick Split Presets */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeaderTitle}>SPLIT PRESETS</Text>
                <View style={styles.presetsList}>
                  {SPLIT_PRESETS.map((preset, idx) => {
                    const isActive =
                      preset.days.length === selectedDays.length &&
                      preset.days.every((d) => selectedDays.includes(d));

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.presetRow, isActive && styles.presetRowActive]}
                        onPress={() => handleApplyPreset(preset.days)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.presetLabel,
                              isActive && { color: colors.accent, fontWeight: '800' },
                            ]}
                          >
                            {preset.label}
                          </Text>
                          <Text style={styles.presetDays}>
                            {preset.days.map((d) => DAY_NAMES_SHORT[d]).join(' • ')}
                          </Text>
                        </View>
                        {isActive ? (
                          <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
                        ) : (
                          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDim} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Smart Workout Reminders */}
              <View style={styles.sectionCard}>
                <View style={styles.reminderHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionHeaderTitle}>WORKOUT REMINDERS</Text>
                    <Text style={styles.sectionHeaderSubtitle}>
                      Get notified on your scheduled training days
                    </Text>
                  </View>
                  <Switch
                    value={remindersEnabled}
                    onValueChange={handleToggleReminders}
                    trackColor={{ false: colors.cardBorder, true: colors.accent }}
                    thumbColor={remindersEnabled ? colors.accentContrastText : colors.textDim}
                  />
                </View>

                {remindersEnabled && (
                  <View style={styles.timeSelectorRow}>
                    {REMINDER_PRESETS.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <TouchableOpacity
                          key={time}
                          style={[styles.timeChip, isSelected && styles.timeChipActive]}
                          onPress={() => handleSelectTime(time)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              isSelected && { color: colors.accent, fontWeight: '800' },
                            ]}
                          >
                            {time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          ) : (
            /* Rewards & Unlockables Catalog */
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeaderTitle}>REWARDS & MILESTONES</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                Level up by finishing workouts, completing all sets, and breaking PRs
              </Text>

              <View style={styles.rewardsList}>
                {REWARDS_CATALOG.map((reward) => {
                  const isUnlocked = levelInfo.level >= reward.levelRequired;
                  const isTheme = reward.type === 'theme';
                  const isEquipped =
                    (reward.id === 'theme-violet' && themeId === 'amethyst') ||
                    (reward.id === 'theme-gold' && themeId === 'amber') ||
                    (reward.id === 'theme-crimson' && themeId === 'crimson');

                  return (
                    <View
                      key={reward.id}
                      style={[
                        styles.rewardCard,
                        isUnlocked ? styles.rewardCardUnlocked : styles.rewardCardLocked,
                      ]}
                    >
                      <View
                        style={[
                          styles.rewardIconCircle,
                          {
                            backgroundColor: isUnlocked
                              ? reward.color || colors.accent
                              : colors.cardBorder,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={(reward.icon as any) || 'gift'}
                          size={22}
                          color="#FFFFFF"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.rewardTitleRow}>
                          <Text style={styles.rewardName}>{reward.name}</Text>
                          <View
                            style={[
                              styles.reqBadge,
                              isUnlocked ? styles.reqBadgeUnlocked : styles.reqBadgeLocked,
                            ]}
                          >
                            <Text style={styles.reqBadgeText}>LVL {reward.levelRequired}</Text>
                          </View>
                        </View>
                        <Text style={styles.rewardDesc}>{reward.description}</Text>
                      </View>

                      {isTheme && isUnlocked && (
                        <TouchableOpacity
                          style={[
                            styles.equipBtn,
                            isEquipped && { backgroundColor: colors.accent },
                          ]}
                          onPress={() => handleEquipTheme(reward.id)}
                          disabled={isEquipped}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.equipBtnText,
                              isEquipped && { color: colors.accentContrastText },
                            ]}
                          >
                            {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  </Modal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 12) : 0,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 1.2,
      color: colors.text,
      fontFamily: 'monospace',
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
    },
    levelCard: {
      backgroundColor: isDark ? '#1C152B' : '#FAF5FF',
      borderRadius: 28,
      padding: 20,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(192, 132, 252, 0.4)' : 'rgba(147, 51, 234, 0.3)',
      shadowColor: '#A855F7',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 6,
    },
    levelCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 14,
    },
    levelBadgeCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accentSubtle,
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 3,
    },
    levelNumberText: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    rankPill: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    rankPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
    },
    levelExpSub: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    progressTrack: {
      height: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      borderRadius: 5,
      overflow: 'hidden',
      marginBottom: 14,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 5,
    },
    shieldStreakRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    statPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? '#141620' : '#F8FAFC',
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    statPillText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
      fontFamily: 'monospace',
    },
    nextRewardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    nextRewardText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      flex: 1,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#14161F' : '#F1F5F9',
      padding: 4,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      gap: 6,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,
    },
    tabBtnActive: {
      backgroundColor: isDark ? '#202434' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)',
      shadowColor: isDark ? '#000' : '#CBD5E1',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    tabBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    tabBtnTextActive: {
      color: colors.accent,
      fontWeight: '900',
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: isDark ? '#11221A' : '#DCFCE7',
      padding: 16,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.25)',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },
    infoBannerTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: '#10B981',
      marginBottom: 3,
    },
    infoBannerText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      lineHeight: 16,
    },
    sectionCard: {
      backgroundColor: isDark ? '#151722' : '#FFFFFF',
      borderRadius: 28,
      padding: 18,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.45 : 0.12,
      shadowRadius: 14,
      elevation: 6,
    },
    sectionHeaderTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 0.8,
      fontFamily: 'monospace',
      marginBottom: 3,
    },
    sectionHeaderSubtitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 14,
    },
    daysGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 4,
    },
    dayCol: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 2,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    dayColWorkout: {
      backgroundColor: colors.accentSubtle,
      borderColor: colors.accent,
    },
    dayColRest: {
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
    },
    dayColToday: {
      borderWidth: 2,
    },
    dayNameText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      marginBottom: 6,
    },
    dayIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    dayStatusText: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    presetsList: {
      gap: 8,
    },
    presetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    presetRowActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    presetLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    presetDays: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    reminderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    timeSelectorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    timeChip: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    timeChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    timeChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    rewardsList: {
      gap: 10,
    },
    rewardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
    },
    rewardCardUnlocked: {
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
    },
    rewardCardLocked: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
      borderColor: colors.cardBorder,
      opacity: 0.65,
    },
    rewardIconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rewardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    rewardName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    reqBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    reqBadgeUnlocked: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.15)',
    },
    reqBadgeLocked: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    reqBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.text,
      fontFamily: 'monospace',
    },
    rewardDesc: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textMuted,
      lineHeight: 15,
    },
    equipBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    equipBtnText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 0.6,
    },
  });
