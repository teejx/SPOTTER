import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';

interface NotificationPermissionModalProps {
  visible: boolean;
  colors: ThemeColors;
  isDark: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  colors,
  isDark,
  onAllow,
  onDismiss,
}) => {
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  if (!visible) return null;

  const handleAllow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          await PermissionsAndroid.request(
            'android.permission.POST_NOTIFICATIONS' as any,
            {
              title: 'SPOTTER Training Alerts',
              message: 'Allow SPOTTER to notify you for workout reminders and rest timers.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }
          );
        }
      } catch (err) {
        console.warn('Notification permission request error:', err);
      }
    }
    onAllow();
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Bell Icon with Clay Glow Badge */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="bell-ring-outline" size={36} color={colors.accent} />
          </View>

          <Text style={styles.title}>Stay on Track with SPOTTER</Text>
          <Text style={styles.subtitle}>
            Enable push notifications to stay consistent and never miss a training milestone.
          </Text>

          {/* Value Props Bento List */}
          <View style={styles.benefitsList}>
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIconBox, { backgroundColor: colors.accentSubtle }]}>
                <MaterialCommunityIcons name="clock-check-outline" size={18} color={colors.accent} />
              </View>
              <View style={styles.benefitTextCol}>
                <Text style={styles.benefitTitle}>Workout Reminders</Text>
                <Text style={styles.benefitSub}>Timely cues tailored to your planned training days.</Text>
              </View>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.benefitIconBox, { backgroundColor: colors.coralSubtle }]}>
                <MaterialCommunityIcons name="timer-sand" size={18} color={colors.coral} />
              </View>
              <View style={styles.benefitTextCol}>
                <Text style={styles.benefitTitle}>Rest Timer Alerts</Text>
                <Text style={styles.benefitSub}>Get signaled as soon as your set rest interval completes.</Text>
              </View>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.benefitIconBox, { backgroundColor: colors.mintSubtle }]}>
                <MaterialCommunityIcons name="fire" size={18} color={colors.mint} />
              </View>
              <View style={styles.benefitTextCol}>
                <Text style={styles.benefitTitle}>Streak Protection</Text>
                <Text style={styles.benefitSub}>Friendly nudges before your active streak expires.</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleAllow} activeOpacity={0.85}>
            <MaterialCommunityIcons name="bell-check" size={18} color={colors.accentContrastText} />
            <Text style={styles.primaryBtnText}>ENABLE NOTIFICATIONS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleDismiss} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      elevation: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.45 : 0.15,
      shadowRadius: 18,
    },
    iconCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: colors.accentSubtle,
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      elevation: 4,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    title: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20,
      paddingHorizontal: 8,
    },
    benefitsList: {
      width: '100%',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 20,
      padding: 14,
      gap: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    benefitIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitTextCol: {
      flex: 1,
    },
    benefitTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 1,
    },
    benefitSub: {
      fontSize: 11,
      color: colors.textDim,
      lineHeight: 15,
    },
    primaryBtn: {
      width: '100%',
      backgroundColor: colors.accent,
      borderRadius: 18,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      elevation: 4,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      marginBottom: 10,
    },
    primaryBtnText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.6,
    },
    secondaryBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    secondaryBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textDim,
    },
  });
