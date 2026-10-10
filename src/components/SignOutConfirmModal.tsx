import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

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
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>

              {/* Glowing Icon Header */}
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="logout" size={26} color="#ff4d4f" />
              </View>

              {/* Title & Description */}
              <Text style={styles.title}>Sign Out of SPOTTER?</Text>
              <Text style={styles.desc}>
                Are you sure you want to sign out? Your training logs, custom routines, and personal records remain securely preserved on this device.
              </Text>

              {/* Current Athlete Pill */}
              {athleteName ? (
                <View style={styles.athletePill}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.athleteName}>{athleteName}</Text>
                  {athleteHandle ? (
                    <Text style={styles.athleteHandle}>{athleteHandle}</Text>
                  ) : null}
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
                  <MaterialCommunityIcons name="logout" size={16} color="#000000" />
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 24,
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
    backgroundColor: 'rgba(255, 77, 79, 0.12)',
    borderColor: 'rgba(255, 77, 79, 0.25)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  athletePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.volt,
  },
  athleteName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  athleteHandle: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textDim,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#ff4d4f',
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
