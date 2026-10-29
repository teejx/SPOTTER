import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { getClayCardStyle, getClayPillStyle } from '../theme/clay';

interface SignOutConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  athleteName?: string;
  athleteHandle?: string;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  athleteName,
  athleteHandle,
}) => {
  const { colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Glowing Icon Header */}
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="logout" size={26} color={colors.danger} />
              </View>

              {/* Title & Description */}
              <Text style={styles.title}>Sign Out of SPOTTER?</Text>
              <Text style={styles.desc}>
                Are you sure you want to sign out? Your training logs, custom routines, and personal records remain securely preserved on this device.
              </Text>

              {/* Current Athlete Pill */}
              {athleteName ? (
                <View style={styles.athletePill}>
                  <View style={[styles.pulseDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.athleteName}>{athleteName}</Text>
                </View>
              ) : null}

              {/* Privacy Reassurance */}
              <View style={styles.privacyRow}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#10b981" />
                <Text style={styles.privacyText}>Offline data is safe & private</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => {
                    onClose();
                    onConfirm();
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="logout" size={16} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>SIGN OUT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      ...getClayCardStyle(isDark, colors.cardBg, 28),
      borderColor: colors.cardBorder,
      padding: 24,
      alignItems: 'center',
      position: 'relative',
    },
    closeBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      padding: 6,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)',
      borderColor: isDark ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 59, 48, 0.2)',
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    desc: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    athletePill: {
      flexDirection: 'row',
      alignItems: 'center',
      ...getClayCardStyle(isDark, colors.inputBg, 14),
      borderColor: colors.inputBorder,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 8,
      marginBottom: 14,
    },
    pulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    athleteName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    athleteHandle: {
      fontSize: 11,
      fontFamily: 'monospace',
      color: colors.textDim,
    },
    privacyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 20,
    },
    privacyText: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    btnRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 10,
    },
    cancelBtn: {
      flex: 1,
      ...getClayCardStyle(isDark, colors.inputBg, 16),
      borderColor: colors.inputBorder,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    confirmBtn: {
      flex: 1,
      ...getClayPillStyle(colors.danger, 16),
      paddingVertical: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    confirmBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.8,
    },
  });
