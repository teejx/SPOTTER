import React, { useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';

export type WorkoutConfirmType =
  | 'exit_staging'
  | 'exit_started'
  | 'finish_workout'
  | 'finish_empty'
  | 'remove_exercise'
  | 'replace_with_empty'
  | 'delete_workout'
  | 'delete_walk'
  | 'delete_routine'
  | 'delete_folder';

interface WorkoutConfirmModalProps {
  visible: boolean;
  type: WorkoutConfirmType;
  exerciseName?: string;
  targetRoutineName?: string;
  timeFormatted?: string;
  completedSets?: number;
  totalVolume?: number;
  weightUnit?: string;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const WorkoutConfirmModal: React.FC<WorkoutConfirmModalProps> = ({
  visible,
  type,
  exerciseName,
  targetRoutineName,
  timeFormatted = '0:00',
  completedSets = 0,
  totalVolume = 0,
  weightUnit = 'kg',
  onClose,
  onConfirm,
  onCancel,
}) => {
  const { colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.09,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  if (!visible) return null;

  // Determine modal configuration according to type
  let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'alert-circle';
  let iconColor = colors.danger;
  let iconBg = isDark ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.1)';
  let iconBorder = isDark ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 59, 48, 0.2)';
  let title = 'Exit Workout?';
  let description = 'Are you sure you want to exit?';
  let cancelText = 'CANCEL';
  let confirmText = 'CONFIRM';
  let confirmIcon: keyof typeof MaterialCommunityIcons.glyphMap = 'close';
  let isDestructive = true;
  let isSuccess = false;

  switch (type) {
    case 'exit_staging':
      iconName = 'exit-to-app';
      iconColor = '#F59E0B';
      iconBg = isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.1)';
      iconBorder = isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.2)';
      title = 'Exit Workout?';
      description = 'Are you sure you want to exit without starting?';
      cancelText = 'KEEP STAGING';
      confirmText = 'EXIT';
      confirmIcon = 'exit-to-app';
      isDestructive = true;
      break;

    case 'exit_started':
      iconName = 'alert-circle-outline';
      iconColor = colors.danger;
      iconBg = isDark ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.1)';
      iconBorder = isDark ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 59, 48, 0.2)';
      title = 'Exit Workout?';
      description = 'Are you sure you want to exit? All progress will not be saved.';
      cancelText = 'KEEP TRAINING';
      confirmText = 'EXIT & DISCARD';
      confirmIcon = 'trash-can-outline';
      isDestructive = true;
      break;

    case 'finish_workout':
      iconName = 'check-decagram';
      iconColor = colors.accent;
      iconBg = isDark ? 'rgba(212, 255, 0, 0.16)' : 'rgba(212, 255, 0, 0.12)';
      iconBorder = isDark ? 'rgba(212, 255, 0, 0.35)' : 'rgba(212, 255, 0, 0.2)';
      title = 'Finish Workout?';
      description = 'Ready to log this workout and update your training stats?';
      cancelText = 'KEEP TRAINING';
      confirmText = 'SAVE WORKOUT';
      confirmIcon = 'check-bold';
      isDestructive = false;
      isSuccess = true;
      break;

    case 'finish_empty':
      iconName = 'alert-rhombus-outline';
      iconColor = '#F59E0B';
      iconBg = isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.1)';
      iconBorder = isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.2)';
      title = 'No Sets Completed';
      description =
        'You have not checked off any completed sets (✓). Do you want to keep training or discard this session?';
      cancelText = 'KEEP TRAINING';
      confirmText = 'DISCARD';
      confirmIcon = 'trash-can-outline';
      isDestructive = true;
      break;

    case 'remove_exercise':
      iconName = 'trash-can-outline';
      iconColor = colors.danger;
      iconBg = isDark ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.1)';
      iconBorder = isDark ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 59, 48, 0.2)';
      title = 'Remove Exercise?';
      description = `Are you sure you want to remove ${exerciseName ? `"${exerciseName}"` : 'this exercise'} from your workout?`;
      cancelText = 'CANCEL';
      confirmText = 'REMOVE';
      confirmIcon = 'delete-outline';
      isDestructive = true;
      break;

    case 'replace_with_empty':
      iconName = 'alert-octagon-outline';
      iconColor = '#F59E0B';
      iconBg = isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.1)';
      iconBorder = isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.2)';
      title = 'Workout in Progress';
      description = targetRoutineName
        ? `An ongoing workout session ${exerciseName ? `"${exerciseName}" ` : ''}is already in progress. Are you sure you want to exit and start "${targetRoutineName}"?`
        : `An ongoing workout session ${exerciseName ? `"${exerciseName}" ` : ''}is already in progress. Are you sure you want to exit and start an empty workout session?`;
      cancelText = 'RESUME ONGOING';
      confirmText = 'DISCARD & START';
      confirmIcon = 'trash-can-outline';
      isDestructive = true;
      break;

    case 'delete_workout':
      iconName = 'trash-can-outline';
      iconColor = colors.danger;
      iconBg = isDark ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.1)';
      iconBorder = isDark ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 59, 48, 0.2)';
      title = 'Delete Workout?';
      description = `Are you sure you want to permanently delete "${exerciseName || 'this workout'}"? This action cannot be undone.`;
      cancelText = 'CANCEL';
      confirmText = 'DELETE';
      confirmIcon = 'delete-outline';
      isDestructive = true;
      break;

    case 'delete_walk':
      iconName = 'trash-can-outline';
      iconColor = colors.danger;
      iconBg = isDark ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.1)';
      iconBorder = isDark ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 59, 48, 0.2)';
      title = 'Delete Walk?';
      description = `Are you sure you want to permanently delete "${exerciseName || 'this walk'}"?`;
      cancelText = 'CANCEL';
      confirmText = 'DELETE';
      confirmIcon = 'delete-outline';
      isDestructive = true;
      break;

    case 'delete_routine':
      iconName = 'trash-can-outline';
      iconColor = colors.danger;
      iconBg = isDark ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.1)';
      iconBorder = isDark ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 59, 48, 0.2)';
      title = 'Delete Routine?';
      description = `Are you sure you want to delete routine "${exerciseName || 'this routine'}"?`;
      cancelText = 'CANCEL';
      confirmText = 'DELETE';
      confirmIcon = 'delete-outline';
      isDestructive = true;
      break;

    case 'delete_folder':
      iconName = 'folder-remove-outline';
      iconColor = colors.danger;
      iconBg = isDark ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.1)';
      iconBorder = isDark ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 59, 48, 0.2)';
      title = 'Delete Folder?';
      description = `Are you sure you want to delete folder "${exerciseName || 'this folder'}"? Routines inside will be moved to General.`;
      cancelText = 'CANCEL';
      confirmText = 'DELETE FOLDER';
      confirmIcon = 'delete-outline';
      isDestructive = true;
      break;
  }

  const handleCancelPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleCancelBtnPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleConfirmPress = () => {
    Haptics.notificationAsync(
      isDestructive
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
    onClose();
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleCancelPress}
    >
      <TouchableWithoutFeedback onPress={handleCancelPress}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Top Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleCancelPress}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Pulsing Icon Header */}
              <Animated.View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: iconBg,
                    borderColor: iconBorder,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
              </Animated.View>

              {/* Title & Description */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.desc}>{description}</Text>

              {/* Context Pill for Active / Staging Session */}
              {type === 'exit_started' && (
                <View style={styles.contextPill}>
                  <View style={[styles.liveDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.contextPillText}>
                    {timeFormatted} elapsed • {completedSets} set{completedSets !== 1 ? 's' : ''} logged
                  </Text>
                </View>
              )}

              {type === 'exit_staging' && (
                <View style={styles.contextPill}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color="#F59E0B" />
                  <Text style={[styles.contextPillText, { color: '#F59E0B' }]}>
                    Session not started • 0s elapsed
                  </Text>
                </View>
              )}

              {type === 'replace_with_empty' && (
                <View style={styles.contextPill}>
                  <View style={[styles.liveDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.contextPillText}>
                    {exerciseName || 'Active Workout'}
                    {timeFormatted && timeFormatted !== '0:00' ? ` • ${timeFormatted}` : ''}
                    {completedSets > 0 ? ` • ${completedSets} set${completedSets !== 1 ? 's' : ''}` : ''}
                  </Text>
                </View>
              )}

              {type === 'finish_workout' && (
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{timeFormatted}</Text>
                    <Text style={styles.statLabel}>TIME</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{completedSets}</Text>
                    <Text style={styles.statLabel}>SETS</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancelBtnPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    isDestructive && styles.confirmBtnDestructive,
                    isSuccess && { backgroundColor: colors.accent },
                  ]}
                  onPress={handleConfirmPress}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.confirmBtnText,
                      isSuccess && { color: colors.accentContrastText },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.cardBg,
      borderColor: colors.cardBorder,
      borderWidth: 1.5,
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      position: 'relative',
      elevation: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: 20,
    },
    closeBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      padding: 6,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
    iconCircle: {
      width: 60,
      height: 60,
      borderRadius: 22,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    desc: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    contextPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      gap: 7,
      marginBottom: 18,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    contextPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'monospace',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      width: '100%',
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginBottom: 18,
    },
    statBox: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.text,
      fontFamily: 'monospace',
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.6,
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.inputBorder,
    },
    btnRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 10,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      paddingVertical: 13,
      paddingHorizontal: 8,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
      textAlign: 'center',
    },
    confirmBtn: {
      flex: 1,
      paddingVertical: 13,
      paddingHorizontal: 8,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnDestructive: {
      backgroundColor: colors.danger,
    },
    confirmBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.8,
      textAlign: 'center',
    },
  });
